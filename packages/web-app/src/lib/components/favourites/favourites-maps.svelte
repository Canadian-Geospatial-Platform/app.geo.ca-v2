<script lang="ts">
  import { getComponentLabels, getTranslations } from '#lib/i18n/index.js';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import Card from '#lib/components/card/card.svelte';
  import ActionDialog from '#lib/components/dialog/action-dialog.svelte';
  import DownloadIcon from '#lib/components/icons/download.svelte';
  import GarbageCan from '#lib/components/icons/garbage-can.svelte';
  import MapIcon from '#lib/components/icons/map.svelte';
  import UploadIcon from '#lib/components/icons/upload.svelte';
  import type { MapConfigFavourite } from '#lib/db/db-types.js';
  import { getAppLanguage } from '#lib/utils/language.js';

  /**
   * Signed-in favourites maps view.
   *
   * Manages saved map configurations, including upload, open,
   * download, and delete actions for each saved map.
   */
  const appLang = $derived(getAppLanguage(page.data.lang ?? page.params.lang));
  const translations = $derived(getComponentLabels(appLang, 'favourites'));
  const dateFormatter = $derived(new Intl.DateTimeFormat(appLang, { dateStyle: 'medium', timeStyle: 'short' }));
  const userDataUnavailable = page.data.userDataStatus === 'unavailable';

  // State
  let actionDialog: ActionDialog;
  let savedMaps: MapConfigFavourite[] = $state(page.data?.userData?.mapConfigs ? [...page.data.userData.mapConfigs] : []);
  let statusType: 'success' | 'error' | null = $state(null);
  let statusMessage: string = $state('');

  /**
   * Generates a map name that does not collide with existing saved maps.
   *
   * Uses an incrementing numeric suffix when a matching name already exists.
   *
   * @param baseName - Preferred base map name.
   * @returns Unique map name.
   */
  function createUniqueMapName(baseName: string): string {
    const existingNames = new Set(savedMaps.map((mapItem) => mapItem.name));
    if (!existingNames.has(baseName)) {
      return baseName;
    }

    let suffix = 2;
    let candidate = `${baseName} ${suffix}`;
    while (existingNames.has(candidate)) {
      suffix += 1;
      candidate = `${baseName} ${suffix}`;
    }

    return candidate;
  }

  /**
   * Formats the saved timestamp for display in the active locale.
   *
   * Falls back to the original value if parsing fails.
   *
   * @param value - ISO timestamp string.
   * @returns Localized date/time text.
   */
  function formatCreatedAt(value: string): string {
    if (!value) {
      return '';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    return dateFormatter.format(parsed);
  }

  /**
   * Sets the transient status message shown above the map list.
   *
   * Updates both status type and status text used by the inline alert container.
   *
   * @param type - Status type for styling.
   * @param message - Message content to display.
   */
  function setStatus(type: 'success' | 'error', message: string): void {
    statusType = type;
    statusMessage = message;
  }

  /**
   * Opens a saved map configuration in the shared map viewer route.
   *
   * Passes map id and source context so return navigation remains tab-aware.
   *
   * @param mapConfig - Saved map metadata and config payload.
   */
  function handleOpenSavedMapClick(mapConfig: MapConfigFavourite): void {
    goto(resolve(`/[lang]/favourites/view?mapId=${encodeURIComponent(mapConfig.id)}&source=maps`, { lang: appLang }));
  }

  /**
   * Downloads a saved map configuration as a JSON file.
   *
   * Serializes the configuration payload and triggers a browser file download.
   *
   * @param mapConfig - Saved map metadata and config payload.
   */
  function handleDownloadSavedMapClick(mapConfig: MapConfigFavourite): void {
    const fileName = `${mapConfig.name.trim().replace(/\s+/g, '-') || 'my-map'}.json`;
    const blob = new Blob([JSON.stringify(mapConfig.config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  /**
   * Deletes a saved map configuration after user confirmation.
   *
   * Calls the favourites API and updates local list state with the returned payload.
   *
   * @param id - Saved map id.
   * @returns Resolves when delete flow completes.
   */
  async function handleDeleteSavedMapClick(id: string): Promise<void> {
    if (!(await actionDialog.confirm(getTranslations(appLang).components.favourites.messages.deleteMap))) {
      return;
    }

    const response = await fetch(`/${appLang}/api/favourites`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'deleteMapConfig', id }),
    });

    const payload = (await response.json()) as { ok: boolean; mapConfigs?: MapConfigFavourite[] };
    if (!response.ok || !payload.ok) {
      setStatus('error', translations.deleteMapFailed);
      return;
    }

    savedMaps = payload.mapConfigs ?? [];
    setStatus('success', translations.deleteMapSuccess);
  }

  /**
   * Prompts for a JSON file and uploads it as a saved map configuration.
   *
   * Validates JSON structure, applies unique naming, and handles API limit/error responses.
   *
   * @returns Resolves when upload flow completes.
   */
  async function handleUploadMapClick(): Promise<void> {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    const handleFileChange = async (event: Event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const config = JSON.parse(text);

        if (typeof config !== 'object' || config === null || Array.isArray(config)) {
          setStatus('error', translations.uploadMapFailed);
          return;
        }

        const fileName = file.name.replace(/\.json$/i, '');
        const finalName = createUniqueMapName(fileName || getTranslations(appLang).components.favourites.importedMap);

        const response = await fetch(`/${appLang}/api/favourites`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'createMapConfig',
            name: finalName,
            config,
          }),
        });

        const payload = (await response.json()) as { ok: boolean; mapConfigs?: MapConfigFavourite[]; reason?: string };
        if (!response.ok || !payload.ok) {
          if (payload.reason === 'limit') {
            setStatus('error', translations.mapLimitReached);
          } else if (payload.reason === 'item-too-large') {
            setStatus('error', translations.savedMapsTooLarge);
          } else {
            setStatus('error', translations.uploadMapFailed);
          }
          return;
        }

        savedMaps = payload.mapConfigs ?? savedMaps;
        setStatus('success', translations.uploadMapSuccess);
      } catch {
        setStatus('error', translations.uploadMapFailed);
      }
    };

    input.addEventListener('change', handleFileChange, { once: true });
    input.click();
  }
</script>

<ActionDialog bind:this={actionDialog} />

<h1 class="page-title-favourites font-custom-style-h1">{translations.mapsTab}</h1>

<div class="page-section-favourites">
  {#if userDataUnavailable}
    <div class="status-alert-error font-custom-style-body-1" role="status" aria-live="polite">
      {translations.savedDataUnavailable}
    </div>
  {:else}
    <p class="page-copy-block">
      <!-- These are our descriptions, no injection risk -->
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html translations.mapsDescription}
    </p>

    {#if statusType && statusMessage}
      <div
        class={`mb-4 status-alert-base font-custom-style-body-1 ${statusType === 'success' ? 'status-alert-success' : 'status-alert-danger'}`}
        role="status"
        aria-live="polite"
      >
        {statusMessage}
      </div>
    {/if}
    <div class="pb-3">
      <button class="button-action-light surface-shadow button-width-mobile-full" onclick={handleUploadMapClick}>
        <UploadIcon classes="h-5 button-icon-inline" />
        {translations.uploadMap}
      </button>
    </div>
    {#if savedMaps.length > 0}
      <Card>
        <div>
          <div class="divide-y divide-custom-17 border-b border-custom-17">
            {#each savedMaps as mapItem (mapItem.id)}
              <div class="py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 class="font-custom-style-h2-2">{mapItem.name}</h2>
                  <p class="font-custom-style-body-9">{formatCreatedAt(mapItem.createdAt)}</p>
                </div>

                <div class="flex flex-wrap gap-2">
                  <button
                    class="button-action-dark"
                    onclick={() => {
                      handleOpenSavedMapClick(mapItem);
                    }}
                  >
                    <MapIcon classes="h-5 button-icon-inline" />
                    {translations.viewMap}
                  </button>
                  <button
                    class="button-action-light"
                    onclick={() => {
                      handleDownloadSavedMapClick(mapItem);
                    }}
                  >
                    <DownloadIcon classes="h-5 button-icon-inline" />
                    {translations.downloadMap}
                  </button>
                  <button
                    class="button-action-light"
                    onclick={() => {
                      handleDeleteSavedMapClick(mapItem.id);
                    }}
                  >
                    <GarbageCan classes="h-4 button-icon-inline" />
                    {translations.delete}
                  </button>
                </div>
              </div>
            {/each}
          </div>
          <br />
          <div class="info-tip-card">
            <p>
              <!-- Translation content is controlled in-repo; safe to render as HTML for inline icon/text formatting. -->
              <!-- eslint-disable-next-line svelte/no-at-html-tags -->
              {@html translations.mapsTipLabel}
            </p>
          </div>
        </div>
      </Card>
    {:else}
      <p class="font-custom-style-body-1">{translations.savedMapsEmpty}</p>
    {/if}

    <div class="mt-9">
      <a class="button-action-dark button-cta-link-dark" href={resolve('/[lang]/favourites/datasets', { lang: appLang })}>
        {translations.datasetsLinkLabel}
      </a>
    </div>
  {/if}
</div>
