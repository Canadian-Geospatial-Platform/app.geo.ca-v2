<script lang="ts">
  import { chatStore } from '$lib/geochat/stores/chat-store';
  import type { ChatRecord } from '$lib/geochat/stores/chat-store';
  import Splitter from '$lib/geochat/components/splitter.svelte';
  import Map from '$lib/components/map/map.svelte';
  import enTranslations from '$lib/geochat/i18n/en/translations.json';
  import frTranslations from '$lib/geochat/i18n/fr/translations.json';

  const translations = {
    en: enTranslations,
    fr: frTranslations,
  };

  let {
    lang = 'en',
  }: {
    lang?: 'en' | 'fr';
  } = $props();

  const t = $derived(translations[lang]);

  let recordsHeight = $state(typeof localStorage !== 'undefined' ? Number(localStorage.getItem('geochat-records-height')) || 50 : 50);

  $effect(() => {
    localStorage.setItem('geochat-records-height', String(recordsHeight));
  });

  let selectedRecord = $state<ChatRecord | undefined>();

  $effect(() => {
    const current = selectedRecord;

    if (!current || !$chatStore.records.some((r) => r.uuid === current.uuid)) {
      selectedRecord = $chatStore.records[0];
    }
  });

  const uuid = $derived(selectedRecord?.uuid);

  const coordinates = $derived(selectedRecord?.geometry?.coordinates?.[0]);

  // $effect(() => {
  //   if (!selectedRecord) return;
  //
  //   console.log('Selected:', selectedRecord);
  //
  //   console.table(
  //     $chatStore.records.map((r) => ({
  //       title: r.title_display,
  //       geometry: r.geometry,
  //       type: r.geometry?.type,
  //       rings: r.geometry?.coordinates?.length,
  //       selected: r.uuid === selectedRecord?.uuid,
  //     }))
  //   );
  // });
</script>

<div class="records-panel">
  <div class="records-body" style={`grid-template-rows:${recordsHeight}% 12px 1fr;`}>
    <div class="records-list">
      {#if $chatStore.isThinking}
        <div class="empty">
          <p>{t.searchingRecords}</p>
        </div>
      {:else if $chatStore.records.length === 0}
        <div class="empty">
          <p>{t.noSupportingRecords}</p>
          <p>{t.generalResponse}</p>
        </div>
      {:else}
        {#each $chatStore.records as record (record.uuid)}
          <button
            class="record"
            class:selected={selectedRecord?.uuid === record.uuid}
            aria-pressed={selectedRecord?.uuid === record.uuid}
            onclick={() => (selectedRecord = record)}
          >
            <span class="record-title">
              {record.title_display}
            </span>

            <span class="record-description">
              {record.description_display}
            </span>
          </button>
        {/each}
      {/if}
    </div>

    <Splitter bind:value={recordsHeight} direction="horizontal" min={20} max={80} />

    <div class="map">
      {#if $chatStore.isThinking}
        <div class="empty">
          <p>{t.searchingMap}</p>
        </div>
      {:else if selectedRecord?.geometry}
        {#key uuid}
          <Map {coordinates} id={selectedRecord.uuid} dynamic={true} mapType="record" mapVariant="geochat" footer={false} mapFill={true} />
        {/key}
      {:else}
        <div class="empty">
          <p>{t.noMap}</p>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .records-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }

  .records-body {
    display: grid;

    flex: 1;
    min-height: 0;
    min-width: 0;

    overflow: hidden;
  }
  .records-body > * {
    min-height: 0;
    min-width: 0;
  }

  .records-list {
    overflow-y: auto;
    min-height: 0;
  }

  .records-list::-webkit-scrollbar {
    width: 8px;
  }

  .records-list::-webkit-scrollbar-track {
    background: transparent;
  }

  .records-list::-webkit-scrollbar-thumb {
    background: #535aa4;
    border-radius: 9999px;
  }

  .records-list::-webkit-scrollbar-thumb:hover {
    background: #130944;
  }

  /* Firefox */
  .records-list {
    scrollbar-width: thin;
    scrollbar-color: #535aa4 transparent;
  }

  .record {
    width: 100%;
    text-align: left;
    padding: 0.75rem;
    border: none;
    border-bottom: 1px solid #ddd;
    background: white;
    cursor: pointer;
  }

  .record:hover {
    background: #f8f8f8;
  }

  .record.selected {
    background: #ececec;
  }

  .record-title {
    display: block;
    font-weight: 600;
  }

  .record-description {
    display: block;
    margin-top: 0.25rem;
    font-size: 0.875rem;
    color: #666;

    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .empty {
    padding: 1rem;
    color: #666;
  }

  .empty p {
    margin: 0 0 1rem 0;
  }

  .map {
    width: 100%;
    height: 100%;
    min-height: 0;
    overflow: hidden;

    border-top: 1px solid #e5e7eb;
    padding-top: 0.75rem;
  }
</style>
