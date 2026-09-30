<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';

  import HistoryPanel from '$lib/geochat/components/history-panel.svelte';
  import ChatPanel from '$lib/geochat/components/chat-panel.svelte';
  import RecordsPanel from '$lib/geochat/components/records-panel.svelte';
  import Splitter from '$lib/geochat/components/splitter.svelte';
  import { chatStore } from '$lib/geochat/stores/chat-store';
  import Info from '$lib/components/icons/info.svelte';
  import ChevronDown from '$lib/components/icons/chevrondown.svelte';
  import ChevronUp from '$lib/components/icons/chevronup.svelte';
  import ChevronLeft from '$lib/components/icons/chevronleft.svelte';
  import ChevronRight from '$lib/components/icons/chevronright.svelte';

  let {
    lang = 'en',
    alternateLanguageUrl = '',
  }: {
    lang?: 'en' | 'fr';
    alternateLanguageUrl?: string;
  } = $props();

  /************* Translations ***************/
  const translations = page.data.t;

  const title = translations?.title ? translations['title'] : 'GeoChat';

  const description = translations?.description
    ? translations['description']
    : 'Dive deeper into this topic by asking follow-up questions in natural language.';

  const chatHistory = translations?.chatHistory ? translations['chatHistory'] : 'Chat History';

  const chat = translations?.chat ? translations['chat'] : 'Chat';

  const recordsMap = translations?.recordsMap ? translations['recordsMap'] : 'Records & Map';

  const aboutChatHistory = translations?.aboutChatHistory ? translations['aboutChatHistory'] : 'About Chat History';

  const aboutChatHistoryText = translations?.aboutChatHistoryText
    ? translations['aboutChatHistoryText']
    : 'Recent chats are stored on this device for your convenience. ' +
      'They may not always be available until account sign-in and persistent history are introduced in a future release.';

  const newChat = translations?.newChat ? translations['newChat'] : 'New Chat';

  const showHistory = translations?.showHistory ? translations['showHistory'] : 'Show history';

  const hideHistory = translations?.hideHistory ? translations['hideHistory'] : 'Hide history';

  const deleteChat = translations?.deleteChat ? translations['deleteChat'] : 'Delete chat';

  const confirmDelete = translations?.confirmDelete ? translations['confirmDelete'] : 'Confirm delete';

  const cancelDelete = translations?.cancelDelete ? translations['cancelDelete'] : 'Cancel delete';

  /************* End Translations ***************/

  let chatWidth = $state(typeof localStorage !== 'undefined' ? Number(localStorage.getItem('geochat-chat-width')) || 50 : 50);

  let historyCollapsed = $state(
    typeof window !== 'undefined' ? (window.innerWidth < 768 ? true : localStorage.getItem('geochat-history-collapsed') === 'true') : false
  );

  let showHistoryInfo = $state(false);

  $effect(() => {
    localStorage.setItem('geochat-chat-width', String(chatWidth));
  });

  $effect(() => {
    localStorage.setItem('geochat-history-collapsed', String(historyCollapsed));
  });

  onMount(async () => {
    const searchTerm = page.url.searchParams.get('search-terms');

    await chatStore.initializeChat(lang);

    if (searchTerm) {
      chatStore.newChat(lang);
    }
  });

  function collapseHistoryOnMobile() {
    if (window.innerWidth < 768) {
      historyCollapsed = true;
    }
  }
</script>

<h1 class="font-custom-style-h1 mt-8 px-5 md:px-0 leading-tight">{title}</h1>

<p class="mt-3 mb-4 px-5 md:px-0 font-open-sans">{description}</p>

<div class="history-info-section" class:hidden={historyCollapsed}>
  <button
    type="button"
    class="history-info"
    class:collapsed={!showHistoryInfo}
    aria-expanded={showHistoryInfo}
    aria-label={historyCollapsed ? showHistory : hideHistory}
    onclick={() => (showHistoryInfo = !showHistoryInfo)}
  >
    <Info classes="w-5 h-5 mr-2" />
    <span>{aboutChatHistory}</span>
    {#if showHistoryInfo}
      <ChevronUp classes="w-4 h-4 ml-2" />
    {:else}
      <ChevronDown classes="w-4 h-4 ml-2" />
    {/if}
  </button>

  {#if showHistoryInfo}
    <p class="history-note">
      {aboutChatHistoryText}
    </p>
  {/if}
</div>

<div class="geochat-page px-5 md:px-0" class:history-collapsed={historyCollapsed}>
  <div class="panel history" class:collapsed={historyCollapsed}>
    <div class="panel-header history-header">
      <h2>{chatHistory}</h2>
    </div>

    <div class="panel-body">
      <div class="panel-content history-content">
        <HistoryPanel {lang} {newChat} {deleteChat} {confirmDelete} {cancelDelete} onHistoryAction={collapseHistoryOnMobile} />
      </div>
    </div>
  </div>
  <div class="main-layout" style={`--chat-width:${chatWidth}%;`}>
    <section class="panel chat">
      <div class="panel-header chat-header">
        <button
          type="button"
          class="history-toggle
                  h-[30px] w-[30px]
                  rounded-[0.3125rem]
                  bg-custom-16 hover:bg-custom-23
                  text-white
                  inline-flex items-center justify-center
                  cursor-pointer
                  transition-colors"
          onclick={() => (historyCollapsed = !historyCollapsed)}
          aria-label={historyCollapsed ? showHistory : hideHistory}
          aria-expanded={!historyCollapsed}
        >
          {#if historyCollapsed}
            <ChevronRight classes="w-6 h-6 hidden md:block" />
            <ChevronUp classes="w-5 h-5 block md:hidden" />
          {:else}
            <ChevronLeft classes="w-6 h-6 history-chevron-left hidden md:block" />
            <ChevronDown classes="w-5 h-5 block md:hidden" />
          {/if}
        </button>

        <h2>{chat}</h2>
      </div>

      <div class="panel-body">
        <div class="panel-content chat-layout">
          <ChatPanel {lang} {alternateLanguageUrl} showDiveDeeper={false} initialQuery={page.url.searchParams.get('search-terms') || ''} />
        </div>
      </div>
    </section>

    <Splitter bind:value={chatWidth} direction="vertical" min={25} max={75} />

    <div class="panel records">
      <div class="panel-header">
        <h2>{recordsMap}</h2>
      </div>

      <div class="panel-body">
        <div class="panel-content">
          <RecordsPanel {lang} />
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  /* =========================================================
       PAGE LAYOUT
    ========================================================= */

  .geochat-page {
    display: grid;
    grid-template-columns: 240px minmax(0, 1fr);
    gap: 0.75rem;

    height: 600px;
    min-height: calc(100vh - 160px);
    align-items: stretch;

    transition:
      grid-template-columns 200ms ease,
      gap 200ms ease;
  }

  .geochat-page.history-collapsed {
    grid-template-columns: 0 minmax(0, 1fr);
    gap: 0;
  }

  /* =========================================================
       CHAT HEADER
    ========================================================= */

  .chat-header {
    position: relative;
    justify-content: center;
  }

  .chat-header .history-toggle {
    position: absolute;
    left: 1rem;

    display: flex;
    align-items: center;
    justify-content: center;
  }

  .chat-header .history-toggle :global(svg) {
    transform: translate(-2px, 0);
  }

  .chat-header .history-toggle :global(.history-chevron-left) {
    transform: translate(0, 0);
  }

  .chat-header h2 {
    flex: 1;
    margin: 0;
    text-align: center;
  }

  /* =========================================================
       HISTORY PANEL
    ========================================================= */

  .history,
  .chat,
  .records {
    min-width: 0;
  }

  .history {
    display: flex;
    flex-direction: column;
    overflow: hidden;

    transition:
      opacity 120ms ease 80ms,
      visibility 0s linear 200ms;
  }

  .history.collapsed {
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
  }

  .history-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
  }

  .history-header h2 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    line-height: 1.2;
  }

  .history-content {
    flex: 1;
    overflow: hidden;
    white-space: nowrap;

    opacity: 1;
    transform: translateX(0);

    transition:
      opacity 250ms ease,
      transform 250ms ease;
  }

  .history.collapsed .history-content {
    opacity: 0;
    transform: translateX(-16px);
    pointer-events: none;
  }

  .history-toggle {
    font-size: 20px;
    line-height: 1;
    transition: transform 200ms ease;
  }

  .history-toggle:active {
    transform: scale(0.96);
  }

  .history-info {
    display: inline-flex;
    align-items: center;

    margin: 0 0 0.35rem;
    padding: 0;

    background: none;
    border: none;

    color: #374151;
    font-size: 1rem;
    font-weight: 400;
    line-height: 1.5;

    cursor: pointer;
  }

  .history-info.collapsed {
    margin-bottom: 0;
  }

  .history-info-section {
    margin-bottom: 0.5rem;
    margin-left: 1rem;
    padding-top: 1rem;
  }

  .history-note {
    max-width: 68ch;
    margin-top: 0;
    margin-bottom: 0.75rem;

    color: #374151;
    font-size: 0.95rem;
    line-height: 1.5;
  }

  /* =========================================================
       MAIN LAYOUT / PANELS
    ========================================================= */

  .main-layout {
    display: grid;
    grid-template-columns: var(--chat-width) 12px 1fr;

    min-width: 0;
    min-height: 0;

    gap: 0.5rem;
    overflow: hidden;
  }

  .main-layout > * {
    min-width: 0;
    min-height: 0;
  }

  .panel {
    display: flex;
    flex-direction: column;

    box-sizing: border-box;
    min-height: 0;

    border: 1px solid #ddd;
    background: #fff;
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: center;

    padding: 0.75rem 1rem;
    border-bottom: 1px solid #e5e7eb;
    background: #fff;
  }

  .panel-header h2 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    line-height: 1.2;
  }

  .panel-body {
    display: flex;
    flex: 1;
    flex-direction: column;

    min-height: 0;
    padding: 0;
  }

  .panel-content {
    display: flex;
    flex: 1;
    flex-direction: column;

    min-height: 0;
    background: #fff;
  }

  /* =========================================================
       CHAT LAYOUT
    ========================================================= */

  .chat-layout {
    min-width: 0;
    min-height: 0;

    overflow: hidden;
  }

  .chat-layout :global(#chat-log-wrapper) {
    flex: 1;

    margin: 0;
    overflow-y: auto;

    border: none !important;
    background: transparent !important;
  }

  .chat-layout :global(#chat-input) {
    margin-top: 0;
  }

  .chat-layout :global(#chat-log) {
    padding: 10px 10px 8px;
  }

  .chat :global(#chat-log-wrapper) {
    margin-bottom: 8px;
  }

  .chat :global(.chat-input) {
    padding-top: 8px;
    border-top: 1px solid #e5e7eb;
  }

  /* =========================================================
       MOBILE / TABLET
       Below Tailwind's md breakpoint (48rem / 768px).
    ========================================================= */

  @media (max-width: 47.999rem) {
    .geochat-page {
      grid-template-columns: 1fr;
      grid-template-rows: auto;

      height: auto;
      min-height: 0;
      gap: 1rem;
    }

    .geochat-page.history-collapsed {
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .geochat-page.history-collapsed .history {
      display: none;
    }

    .panel {
      border-width: 2px;
    }

    .main-layout {
      grid-template-columns: 1fr;
      gap: 1rem;
      overflow: visible;
    }

    .main-layout > :global(.splitter) {
      display: none;
    }

    .history,
    .chat,
    .records {
      width: 100%;
    }

    .chat-header .history-toggle :global(svg) {
      transform: translate(-2px, -2px);
    }

    .chat {
      height: 65svh;
    }
  }
</style>
