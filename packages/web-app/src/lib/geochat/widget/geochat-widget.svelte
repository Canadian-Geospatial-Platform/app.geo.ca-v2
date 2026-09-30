<script lang="ts">
  import { onMount } from 'svelte';
  import { draggable } from '$lib/geochat/utils/draggable';

  import ChatPanel from '$lib/geochat/components/chat-panel.svelte';
  import ExpandIcon from '$lib/components/icons/expand.svelte';
  import CloseIcon from '$lib/components/icons/close.svelte';
  import ChatBubbleIcon from '$lib/components/icons/chatbubble.svelte';
  import { chatStore } from '$lib/geochat/stores/chat-store';
  import { warmUpChat } from '$lib/geochat/api/chat-api';
  import { tick } from 'svelte';
  import enTranslations from '$lib/geochat/i18n/en/translations.json';
  import frTranslations from '$lib/geochat/i18n/fr/translations.json';

  const translations = {
    en: enTranslations,
    fr: frTranslations,
  };

  let {
    lang = 'en',
    alternateLanguageUrl = '',
    onDiveDeeper,
  }: {
    lang?: 'en' | 'fr';
    alternateLanguageUrl?: string;
    onDiveDeeper?: () => void;
  } = $props();

  const t = $derived(translations[lang]);

  let chatbotPanel = $state<HTMLDivElement | undefined>(undefined);

  let isOpen = $state(false);
  let isExpanded = $state(false);

  const WIDGET_OPEN_COOKIE = 'geochat-widget-open';

  function getWidgetOpenState(): boolean {
    if (typeof document === 'undefined') {
      return false;
    }

    return (
      document.cookie
        .split('; ')
        .find((row) => row.startsWith(`${WIDGET_OPEN_COOKIE}=`))
        ?.split('=')[1] === 'true'
    );
  }

  function setWidgetOpenState(open: boolean): void {
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';

    const cookie = `${WIDGET_OPEN_COOKIE}=${open}; path=/; max-age=31536000; SameSite=Lax${secure}`;

    if (window.location.hostname === 'geo.ca' || window.location.hostname.endsWith('.geo.ca')) {
      document.cookie = `${cookie}; domain=geo.ca`;
    } else {
      document.cookie = cookie;
    }
  }

  onMount(() => {
    console.log('GeoChat widget mounted');

    const openState = getWidgetOpenState();
    //console.log('widget cookie on mount:', openState);

    isOpen = openState;

    if (isOpen) {
      chatStore.initializeChat(lang);
    }

    return () => {
      console.log('GeoChat widget unmounted');
    };
  });

  function closeChat() {
    isOpen = false;
    setWidgetOpenState(false);

    //console.log('cookie after close:', document.cookie);
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && isOpen) {
      event.preventDefault();
      closeChat();
    }
  }

  function toggleChat() {
    isOpen = !isOpen;

    setWidgetOpenState(isOpen);

    if (isOpen) {
      chatStore.initializeChat(lang);
    }
  }

  async function toggleExpanded() {
    isExpanded = !isExpanded;

    await tick();

    if (chatbotPanel) {
      chatbotPanel.removeAttribute('style');
    }
  }

  $effect(() => {
    if (!isOpen && chatbotPanel) {
      chatbotPanel.style.left = '';
      chatbotPanel.style.top = '';
      chatbotPanel.style.right = '';
      chatbotPanel.style.bottom = '';
    }
  });
</script>

<svelte:window onkeydown={handleKeydown} />

<div id="chatbot-widget">
  <!-- launcher -->
  <button
    id="chatbot-toggle"
    class="font-custom-style-button-1"
    type="button"
    aria-expanded={isOpen}
    aria-controls="chatbot-panel"
    onpointerenter={warmUpChat}
    ontouchstart={warmUpChat}
    onclick={toggleChat}
  >
    <ChatBubbleIcon classes="h-5 w-5" />
    <span class="label">
      {t.askGeoChat}
    </span>
  </button>
</div>

<!-- panel -->
{#if isOpen}
  <div
    id="chatbot-panel"
    bind:this={chatbotPanel}
    class:large={isExpanded}
    role="dialog"
    aria-modal="false"
    aria-labelledby="chatbot-title"
  >
    <!-- header -->
    <div class="chat-header">
      <div class="drag-handle" use:draggable>
        <span id="chatbot-title">
          {t.askGeoChat}
        </span>
      </div>
      <div class="icons">
        <button
          type="button"
          class="chat-expand hidden md:block"
          aria-label={isExpanded ? t.switchToSmallChat : t.switchToLargeChat}
          title={isExpanded ? t.smallChat : t.largeChat}
          onclick={toggleExpanded}
        >
          <ExpandIcon classes="h-4 w-4 md:h-5 md:w-5" />
        </button>

        <button type="button" class="chat-close" aria-label={t.closeChat} title={t.close} onclick={closeChat}>
          <CloseIcon classes="h-4 w-4 md:h-4 md:w-4" />
        </button>
      </div>
    </div>
    <ChatPanel {lang} {alternateLanguageUrl} showDiveDeeper={true} {onDiveDeeper} />
  </div>
{/if}

<style lang="postcss">
  @reference "../../../app.css";

  /* =========================================================
       CHAT WIDGET LAUNCHER
    ========================================================= */

  #chatbot-widget {
    z-index: 10020;
  }

  /* Background is defined here because the standalone WordPress
       build does not always generate custom Tailwind utility classes. */
  #chatbot-toggle {
    position: fixed;
    right: 20px;
    bottom: 20px;
    z-index: 10020;

    display: flex;
    align-items: center;
    gap: 8px;

    height: 42px;
    padding: 0 16px;

    border: 0;
    border-radius: 28px;

    background: #5859a2;
    color: #fff;

    cursor: pointer;
    white-space: nowrap;

    transition: background 0.2s ease;
  }

  #chatbot-toggle:hover {
    background: #130944;
  }

  #chatbot-toggle:active {
    transform: scale(0.97);
  }

  /* =========================================================
       CHAT PANEL
    ========================================================= */

  #chatbot-panel {
    position: fixed;
    right: 20px;
    bottom: 70px;
    z-index: 10020;

    display: flex;
    flex-direction: column;

    width: 420px;
    height: 65dvh;
    min-height: 380px;
    max-height: calc(100dvh - 100px);

    overflow: hidden;

    background: #fff;
    border-radius: 10px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  }

  #chatbot-panel.large {
    top: 20px;
    right: 20px;
    bottom: auto;

    width: 580px;
    height: calc(100dvh - 100px);
  }

  /* =========================================================
       CHAT HEADER
    ========================================================= */

  .chat-header {
    position: sticky;
    top: 0;
    z-index: 10;

    display: flex;
    align-items: center;

    padding: 10px;

    background: #5859a2;
    color: #fff;

    font-weight: bold;
  }

  .chat-header button {
    cursor: pointer;
  }

  .icons {
    display: flex;
    gap: 12px;
    margin-left: auto;
  }

  .chat-header .icons button {
    padding: 0;

    border: 0;
    background: transparent;
    color: inherit;

    cursor: pointer;
  }

  .chat-header .chat-expand :global(svg) {
    display: block;
    width: 20px;
    height: 20px;
  }

  .chat-header .chat-close :global(svg) {
    display: block;
    width: 16px;
    height: 16px;
  }

  .drag-handle {
    display: flex;
    flex: 1;
    align-items: center;

    min-width: 0;

    cursor: grab;
    user-select: none;
    touch-action: none;
  }

  .drag-handle:active {
    cursor: grabbing;
  }

  /* =========================================================
       TABLET
       ========================================================= */

  @media (min-width: 48rem) and (max-width: 74.999rem) {
    #chatbot-panel {
      height: 45svh;
    }

    #chatbot-panel.large {
      top: auto;
      right: 20px;
      bottom: 70px;
      left: auto;

      width: 60%;
      height: 58svh;
    }
  }

  /* Tablet landscape */
  @media (min-width: 48rem) and (max-width: 74.999rem) and (orientation: landscape) {
    #chatbot-panel {
      height: 55svh;
    }

    #chatbot-panel.large {
      height: 70svh;
    }
  }

  /* =========================================================
       MOBILE
       ========================================================= */

  @media (max-width: 47.999rem) {
    #chatbot-panel {
      top: 20%;
      right: auto;
      bottom: auto;
      left: 10%;

      width: 80%;
      height: 60svh;
    }

    #chatbot-panel .chat-expand {
      display: none;
    }
  }
</style>
