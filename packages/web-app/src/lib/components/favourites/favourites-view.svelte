<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { sanitizeMapConfigForStorage } from '#lib/utils/map-config-sanitizer.js';
  import MycartMap from '#lib/components/map/favourites-map.svelte';
  import ActionDialog from '#lib/components/dialog/action-dialog.svelte';
  import AppDialog from '#lib/components/dialog/app-dialog.svelte';
  import enTranslations from '#lib/components/favourites/i18n/en/translations.json';
  import type { MapConfigFavourite } from '#lib/db/db-types.js';
  import type { AppLanguage } from '#lib/utils/language.js';
  import type { DatasetAdditionResult } from '#lib/utils/map-dataset.js';

  /**
   * Shared favourites map viewer.
   *
   * Opens either selected datasets or a saved map configuration,
   * and allows signed-in users to save the current map state.
   */
  type FavouritesTranslations = typeof enTranslations;
  const translations: FavouritesTranslations = {
    ...enTranslations,
    ...((page.data.t ?? {}) as Partial<FavouritesTranslations>),
  };
  const lang = page.data.lang as AppLanguage;
  const signedIn = Boolean(page.data.signedIn);
  const userDataUnavailable = page.data.userDataStatus === 'unavailable';

  // Translations
  const returnToList = translations.returnToList;
  const goToDatasetsLabel = translations.datasetsLinkLabel;
  const goToMapsLabel = translations.mapsLinkLabel;
  const savedDataUnavailable = translations.savedDataUnavailable;
  const saveMapLabel = translations.saveMap;
  const saveMapAsLabel = translations.saveMapAs;
  const saveMapHelp = translations.saveMapHelp;
  const overwriteMapHelp = translations.overwriteMapHelp;
  const savedMapNotFound = translations.savedMapNotFound;
  const saveMapPrompt = translations.saveMapPrompt;
  const saveMapFailed = translations.saveMapFailed;
  const saveMapSuccess = translations.saveMapSuccess;
  const savedMapsTooLarge = translations.savedMapsTooLarge;
  const mapLimitReached = translations.mapLimitReached;
  const presentationModeLabel = translations.presentationMode;
  const presentationTipLabel = translations.presentationTipLabel;
  const presentationNoticeTitle = translations.presentationNoticeTitle;
  const presentationNotice = translations.presentationNotice;
  const dismissPresentationNotice = translations.dismissPresentationNotice;
  // Shallow history updates page.state; the URL fallback supports direct links and refreshes.
  const presentationMode = $derived(page.state.presentationMode ?? page.url.searchParams.get('presentation') === '1');

  // State
  let actionDialog: ActionDialog;
  let selectedIds: string[] = $state([]);
  let selectedMapConfig: MapConfigFavourite | null = $state(null);
  let viewSource: 'datasets' | 'maps' = $state('datasets');
  let statusType: 'success' | 'error' | null = $state(null);
  let statusMessage: string = $state('');
  let loading: boolean = $state(true);
  let mapComponent: MycartMap | undefined = $state();
  let savedMaps: MapConfigFavourite[] = $state([]);
  let saving = $state(false);
  let addDatasetId: string | null = $state(null);
  let addingDataset = $state(false);
  let showDatasetNotice = $state(false);
  // Dismissal overrides this value until the mode changes, so Forward shows the notice again.
  let showPresentationNotice = $derived(presentationMode);
  let mapContainer: HTMLDivElement;
  let presentationSize: { width: number; height: number } | null = $state(null);

  $effect(() => {
    if (!presentationMode) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  });

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
   * Sets the transient status message shown below the map.
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
   * Removes the replayable dataset-addition query parameter without remounting the map.
   *
   * Called only after saving successfully or finding the dataset already present.
   */
  function clearAdditionIntent(): void {
    const nextUrl = new URL(page.url.href);
    nextUrl.searchParams.delete('addDatasetId');
    void goto(`${resolve('/[lang]/favourites/view', { lang })}${nextUrl.search}${nextUrl.hash}`, {
      state: { ...page.state },
      shallow: true,
      replace: true,
    });
  }

  /**
   * Completes the addition flow and shows either the save reminder or duplicate notice.
   *
   * @param result - Outcome reported after GeoView finishes loading the dataset.
   */
  function handleDatasetAdded(result: DatasetAdditionResult): void {
    addingDataset = false;
    if (result === 'already-present') {
      clearAdditionIntent();
      setStatus('success', translations.datasetAlreadyPresent);
    } else {
      // Retain the query parameter so refresh can replay the addition until a save succeeds.
      showDatasetNotice = true;
    }
  }

  /**
   * Clears the pending-addition state and reports a map or dataset loading failure.
   */
  function handleMapLoadError(): void {
    addingDataset = false;
    setStatus('error', addDatasetId ? translations.addDatasetFailed : translations.mapLoadFailed);
  }

  /**
   * Returns to datasets or maps, depending on the current view source.
   */
  function handleReturnToListClick(): void {
    goto(resolve(viewSource === 'maps' ? '/[lang]/favourites/maps' : '/[lang]/favourites/datasets', { lang }));
  }

  /**
   * Navigates back to saved maps.
   */
  function handleGoToMapsClick(): void {
    goto(resolve('/[lang]/favourites/maps', { lang }));
  }

  /**
   * Navigates back to favourite datasets.
   */
  function handleGoToDatasetsClick(): void {
    goto(resolve('/[lang]/favourites/datasets', { lang }));
  }

  /**
   * Enters presentation mode through shallow history, keeping the live map mounted.
   *
   * Retains its measured size when available, otherwise uses the presentation CSS fallback.
   * Does nothing when already presenting; browser Back restores the normal view.
   */
  function handleEnterPresentationMode(): void {
    if (presentationMode) return;

    // GeoView renders its footer below the map area; exclude it from the retained map height.
    const target = mapContainer.querySelector('#map-favourites-resources')?.getBoundingClientRect();
    const mapArea = mapContainer.querySelector('#map-map-favourites-resources')?.getBoundingClientRect();
    if (target) {
      presentationSize = { width: target.width, height: mapArea ? mapArea.height : target.height };
    }

    const nextUrl = new URL(page.url.href);
    nextUrl.searchParams.set('presentation', '1');
    void goto(`${resolve('/[lang]/favourites/view', { lang })}${nextUrl.search}${nextUrl.hash}`, {
      state: { ...page.state, presentationMode: true },
      shallow: true,
    });
  }

  /**
   * Saves the live map state as a new configuration or overwrites the loaded one.
   *
   * Captures live map state, sanitizes payload size, then persists via the favourites API.
   */
  async function handleSaveMapClick(mode: 'create' | 'update'): Promise<void> {
    if (!signedIn || saving || addingDataset || (mode === 'update' && !selectedMapConfig)) {
      return;
    }

    saving = true;
    try {
      const defaultName = createUniqueMapName('My Map');
      let name = defaultName;
      if (mode === 'create') {
        const requestedName = await actionDialog.prompt(saveMapPrompt, defaultName);
        if (requestedName === null) {
          return;
        }
        name = requestedName.trim() || defaultName;
      }

      statusType = null;
      statusMessage = '';
      const mapStateConfig = mapComponent?.getMapConfigFromCurrentState();
      if (!mapStateConfig) {
        setStatus('error', saveMapFailed);
        return;
      }

      const sanitizedConfig = sanitizeMapConfigForStorage(mapStateConfig);
      const response = await fetch(`/${lang}/api/favourites`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(mode === 'update' ? { action: 'updateMapConfig', id: selectedMapConfig?.id } : { action: 'createMapConfig', name }),
          config: sanitizedConfig,
        }),
      });

      const payload = (await response.json()) as {
        ok: boolean;
        mapConfigs?: MapConfigFavourite[];
        mapConfigId?: string;
        reason?: string;
      };
      if (!response.ok || !payload.ok) {
        if (payload.reason === 'limit') {
          setStatus('error', mapLimitReached);
        } else if (payload.reason === 'item-too-large') {
          setStatus('error', savedMapsTooLarge);
        } else if (payload.reason === 'not-found') {
          setStatus('error', savedMapNotFound);
        } else if (payload.reason === 'unavailable') {
          setStatus('error', savedDataUnavailable);
        } else {
          setStatus('error', saveMapFailed);
        }
        return;
      }

      if (!Array.isArray(payload.mapConfigs)) {
        setStatus('error', saveMapFailed);
        return;
      }
      if (mode === 'create') {
        const createdMap = payload.mapConfigs.find((mapConfig) => mapConfig.id === payload.mapConfigId);
        if (!createdMap) {
          setStatus('error', saveMapFailed);
          return;
        }

        selectedMapConfig = createdMap;
        viewSource = 'maps';
        const nextUrl = new URL(page.url.href);
        nextUrl.searchParams.delete('ids');
        nextUrl.searchParams.delete('addDatasetId');
        nextUrl.searchParams.set('mapId', createdMap.id);
        nextUrl.searchParams.set('source', 'maps');
        void goto(`${resolve('/[lang]/favourites/view', { lang })}${nextUrl.search}${nextUrl.hash}`, {
          state: { ...page.state },
          shallow: true,
          replace: true,
        });
      }
      savedMaps = payload.mapConfigs;
      showDatasetNotice = false;
      if (mode === 'update' && page.url.searchParams.has('addDatasetId')) clearAdditionIntent();
      setStatus('success', saveMapSuccess);
    } catch {
      setStatus('error', saveMapFailed);
    } finally {
      saving = false;
    }
  }

  /**
   * Resolves viewer inputs from query params and route data.
   *
   * Determines source context, selects map by id or dataset ids, and redirects when inputs are invalid.
   */
  onMount(async () => {
    const source = page.url.searchParams.get('source');
    viewSource = source === 'maps' ? 'maps' : 'datasets';

    if (signedIn) {
      savedMaps = page.data?.userData?.mapConfigs ? [...page.data.userData.mapConfigs] : [];
    }

    const mapId = page.url.searchParams.get('mapId');
    const idsParam = page.url.searchParams.get('ids');

    if (signedIn && userDataUnavailable && mapId) {
      viewSource = 'maps';
      loading = false;
      return;
    }

    if (mapId) {
      selectedMapConfig = savedMaps.find((mapConfig) => mapConfig.id === mapId) ?? null;
    }

    const requestedDataset = page.url.searchParams.get('addDatasetId')?.trim();
    if (requestedDataset) {
      if (!signedIn || !selectedMapConfig) {
        setStatus('error', translations.openSavedMapFailed);
        loading = false;
        return;
      }
      viewSource = 'maps';
      addDatasetId = requestedDataset;
      addingDataset = true;
    }

    if (!selectedMapConfig) {
      selectedIds = (idsParam ?? '')
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id.length > 0);
    }

    if (!selectedMapConfig && selectedIds.length === 0) {
      await goto(resolve('/[lang]/favourites/datasets', { lang }), { replace: true, reset: false });
      return;
    }

    loading = false;
  });
</script>

{#if !presentationMode && selectedMapConfig}
  <h1 class="page-title-favourites font-custom-style-h1">
    {selectedMapConfig.name}
  </h1>
{/if}

<div
  bind:this={mapContainer}
  class={presentationMode ? 'presentation-map-shell' : `page-section-favourites${selectedMapConfig ? '' : ' pt-12'}`}
  style:--presentation-width={presentationSize ? `${presentationSize.width}px` : undefined}
  style:--presentation-height={presentationSize ? `${presentationSize.height}px` : undefined}
>
  {#if !loading}
    {#if selectedMapConfig || selectedIds.length > 0}
      <MycartMap
        layerIds={selectedIds}
        mapConfig={selectedMapConfig?.config ?? null}
        {addDatasetId}
        onDatasetAdded={handleDatasetAdded}
        onLoadError={handleMapLoadError}
        bind:this={mapComponent}
      />
    {:else if userDataUnavailable && viewSource === 'maps'}
      <div class="status-alert-error font-custom-style-body-1" role="status" aria-live="polite">
        {savedDataUnavailable}
      </div>
    {/if}
    {#if !presentationMode}
      {#if addingDataset}
        <p class="mt-5 font-custom-style-body-1" role="status">
          {translations.addingDataset}
        </p>
      {/if}
      {#if statusType && statusMessage}
        <div
          class={`mt-5 status-alert-base font-custom-style-body-1 ${statusType === 'success' ? 'status-alert-success' : 'status-alert-danger'}`}
          role="status"
          aria-live="polite"
        >
          {statusMessage}
        </div>
      {/if}
      {#if signedIn && (selectedMapConfig || selectedIds.length > 0)}
        <p class="font-custom-style-body-1 mx-0 pt-5 mb-2">
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html saveMapHelp}
          {#if selectedMapConfig}
            <!-- eslint-disable-next-line svelte/no-at-html-tags -->
            {@html overwriteMapHelp}
          {/if}
        </p>
      {/if}
      <div class="flex flex-wrap gap-3 mt-5 mb-5">
        {#if signedIn && (selectedMapConfig || selectedIds.length > 0)}
          {#if selectedMapConfig}
            <button
              class="button-inline-desktop button-action-light surface-shadow button-width-mobile-full"
              onclick={() => handleSaveMapClick('update')}
              disabled={saving || addingDataset}
            >
              {saveMapLabel}
            </button>
          {/if}
          <button
            class="button-inline-desktop button-action-light surface-shadow button-width-mobile-full"
            onclick={() => handleSaveMapClick('create')}
            disabled={saving || addingDataset}
          >
            {saveMapAsLabel}
          </button>
        {/if}
        {#if selectedMapConfig || selectedIds.length > 0}
          <button
            class="button-inline-desktop button-action-light surface-shadow button-width-mobile-full"
            onclick={handleEnterPresentationMode}
          >
            {presentationModeLabel}
          </button>
        {/if}
      </div>
      <div class="info-tip-card">
        <p>
          {presentationTipLabel}
        </p>
      </div>
      <div class="flex flex-wrap gap-3 mt-5 mb-5">
        {#if signedIn}
          <button
            class="button-inline-desktop button-action-dark surface-shadow button-width-mobile-full"
            onclick={handleGoToDatasetsClick}
          >
            {goToDatasetsLabel}
          </button>
          <button class="button-inline-desktop button-action-dark surface-shadow button-width-mobile-full" onclick={handleGoToMapsClick}>
            {goToMapsLabel}
          </button>
        {:else}
          <button
            class="button-inline-desktop button-action-dark surface-shadow button-width-mobile-full"
            onclick={handleReturnToListClick}
          >
            {returnToList}
          </button>
        {/if}
      </div>
    {/if}
  {:else}
    <div class={presentationMode ? 'animate-pulse bg-custom-6 h-full w-full' : 'animate-pulse bg-custom-6 w-full h-[32rem]'}></div>
  {/if}
</div>

<ActionDialog bind:this={actionDialog} />
<AppDialog
  open={showDatasetNotice}
  title={translations.unsavedMapChanges}
  describedby="unsaved-dataset-description"
  onclose={() => (showDatasetNotice = false)}
>
  <p id="unsaved-dataset-description" class="mb-5">{translations.unsavedDatasetNotice}</p>
  <button class="button-action-dark" onclick={() => (showDatasetNotice = false)}>
    {dismissPresentationNotice}
  </button>
</AppDialog>
<AppDialog
  open={presentationMode && showPresentationNotice}
  title={presentationNoticeTitle}
  describedby="presentation-notice-description"
  onclose={() => (showPresentationNotice = false)}
>
  <p id="presentation-notice-description" class="mb-5">{presentationNotice}</p>
  <button class="button-action-dark" onclick={() => (showPresentationNotice = false)}>
    {dismissPresentationNotice}
  </button>
</AppDialog>

<style>
  .presentation-map-shell {
    position: fixed;
    inset: 0;
    z-index: 10020;
    min-height: 0;
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior: contain;
    box-sizing: border-box;
    padding: 24px;
    background: white;
  }

  .presentation-map-shell :global(#map-favourites-resources) {
    width: min(100%, var(--presentation-width, 1240px));
    height: var(--presentation-height, auto) !important;
    max-height: none;
    aspect-ratio: 16 / 9;
    margin-inline: auto;
    border: 0 !important;
    box-sizing: border-box;
    background: transparent;
    box-shadow: none;
  }

  .presentation-map-shell :global(#shell-map-favourites-resources) {
    border: 1px solid gray;
    box-sizing: border-box;
  }
</style>
