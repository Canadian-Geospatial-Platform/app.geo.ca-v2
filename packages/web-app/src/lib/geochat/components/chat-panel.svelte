<script lang="ts">
  import { tick } from 'svelte';
  import { chatStore } from '$lib/geochat/stores/chat-store';
  import type { ChatMessage } from '$lib/geochat/stores/chat-store';
  import ChatBubbleIcon from '$lib/components/icons/chatbubble.svelte';
  import SendIcon from '$lib/components/icons/send.svelte';
  import { DOWNLOAD_ICON_URI } from '$lib/geochat/utils/download-icon';
  import enTranslations from '$lib/geochat/i18n/en/translations.json';
  import frTranslations from '$lib/geochat/i18n/fr/translations.json';

  const translations = {
    en: enTranslations,
    fr: frTranslations,
  };

  let {
    lang = 'en',
    alternateLanguageUrl = '',
    showDiveDeeper = false,
    onDiveDeeper,
    initialQuery = '',
  }: {
    lang?: 'en' | 'fr';
    alternateLanguageUrl?: string;
    showDiveDeeper?: boolean;
    onDiveDeeper?: () => void;
    initialQuery?: string;
  } = $props();

  const t = $derived(translations[lang]);

  // svelte-ignore state_referenced_locally
  let message = $state(initialQuery ?? '');
  let chatLogWrapper: HTMLDivElement;

  async function handleSend() {
    const text = message;

    message = '';

    await chatStore.sendMessage(text, lang);
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  function toggleMessage(msg: ChatMessage) {
    if (msg.role !== 'bot') {
      return;
    }

    chatStore.toggleMessage(msg);
  }

  let lastBotCount = 0;
  let lastThinking = false;

  $effect(() => {
    const botCount = $chatStore.messages.filter((m) => m.role === 'bot').length;

    const thinking = $chatStore.isThinking;

    const newBotMessage = botCount > lastBotCount;
    const thinkingStarted = thinking && !lastThinking;

    lastBotCount = botCount;
    lastThinking = thinking;

    if (!newBotMessage && !thinkingStarted) {
      return;
    }

    tick().then(() => {
      if (!chatLogWrapper) {
        return;
      }

      if (thinkingStarted) {
        chatLogWrapper.scrollTop = chatLogWrapper.scrollHeight;
        return;
      }

      const botRows = chatLogWrapper.querySelectorAll('.chat-row.bot');
      const lastBotRow = botRows[botRows.length - 1] as HTMLElement | undefined;

      if (!lastBotRow) {
        return;
      }

      const messageHeight = lastBotRow.offsetHeight;
      const viewportHeight = chatLogWrapper.clientHeight;

      if (messageHeight > viewportHeight) {
        const TOP_PADDING = 16;

        const wrapperRect = chatLogWrapper.getBoundingClientRect();
        const rowRect = lastBotRow.getBoundingClientRect();

        const scrollAmount = chatLogWrapper.scrollTop + (rowRect.top - wrapperRect.top) - TOP_PADDING;

        chatLogWrapper.scrollTo({
          top: scrollAmount,
          behavior: 'smooth',
        });
      } else {
        chatLogWrapper.scrollTop = chatLogWrapper.scrollHeight;
      }
    });
  });
</script>

<!--
  Download links are rendered inside {@html msg.html}, so we cannot use a Svelte
  icon component.  Download icon used by a[data-download='true']::after. Embedded as a data URI
     to keep the WordPress widget self-contained (no external SVG file required). -->
<!-- messages -->
<div id="chat-log-wrapper" bind:this={chatLogWrapper}>
  <div id="chat-log" role="log" aria-live="polite" aria-relevant="additions" style={`--download-icon-uri: url("${DOWNLOAD_ICON_URI}")`}>
    {#each $chatStore.messages as msg, index (index)}
      <div class="chat-row {msg.role}">
        {#if msg.role === 'bot' && msg.languageMismatch}
          <div class="bubble bot-text">
            {t.languageMessage}
            <a href={alternateLanguageUrl} data-sveltekit-reload>
              {lang.startsWith('fr') ? t.switchToEnglish : t.switchToFrench}
            </a>
          </div>
        {:else if msg.role === 'bot' && msg.expandable && !msg.isCurrent}
          <div
            class="bubble bot-text expandable {msg.collapsed ? 'collapsed' : ''}"
            role="button"
            tabindex="0"
            aria-expanded={!msg.collapsed}
            onclick={() => toggleMessage(msg)}
            onkeydown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleMessage(msg);
              }
            }}
          >
            {@html msg.html}
          </div>
        {:else if msg.role === 'bot'}
          <div class="bubble bot-text">
            {@html msg.html}
          </div>
        {:else}
          <div class="bubble">
            {@html msg.html}
          </div>
        {/if}
      </div>
    {/each}

    {#if $chatStore.isThinking}
      <div class="chat-row bot thinking">
        <div class="bubble bot-text">
          <span class="typing">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </div>
      </div>
    {/if}
  </div>
</div>

{#if showDiveDeeper}
  <div id="chat-actions">
    <button class="dive-deeper-button" onclick={onDiveDeeper}>
      <ChatBubbleIcon classes="h-4 w-4 md:h-5 md:w-5" />
      {t.diveDeeper}
    </button>
  </div>
{/if}

<!-- input -->
<div class="chat-input-container">
  <label for="chat-input" class="sr-only">
    {t.typeMessage}
  </label>

  <textarea id="chat-input" bind:value={message} maxlength="100" placeholder={t.typeMessage} onkeydown={handleKeydown}></textarea>

  <button id="chat-send" type="button" class:disabled={!message.trim()} aria-label={t.sendMessage} onclick={handleSend}>
    <SendIcon classes="h-4 w-4" />
  </button>
</div>

<div id="chat-counter">
  {message.length} / 100
</div>

<style lang="postcss">
  @reference "../../../app.css";

  /* =========================================================
       CHAT LOG
    ========================================================= */

  #chat-log-wrapper {
    flex: 1;
    min-height: 0;
    margin: 10px 0;

    overflow-y: auto;
    scroll-behavior: smooth;

    border: 1px solid #eee;
    background: #fafafa;
    color: #5b58a0;
  }

  #chat-log {
    padding: 10px;
  }

  /* Scrollbar */
  #chat-log-wrapper::-webkit-scrollbar {
    width: 10px;
  }

  #chat-log-wrapper::-webkit-scrollbar-track {
    background: #f1f1f1;
  }

  #chat-log-wrapper::-webkit-scrollbar-thumb {
    background: #5b58a0;
  }

  #chat-log-wrapper::-webkit-scrollbar-thumb:hover {
    background: #555;
  }

  /* =========================================================
       CHAT INPUT
    ========================================================= */

  .chat-input-container {
    display: flex;
    flex: 0 0 auto;

    border-top: 1px solid #eee;
  }

  #chat-input {
    flex: 1;

    box-sizing: border-box;
    height: 36px;
    padding: 6px 8px;

    border: none;
    outline: none;

    background: transparent;

    line-height: 1.4;
    overflow: hidden;
    resize: none;
  }

  #chat-input:focus-visible {
    outline: 2px solid #6c757d;
    outline-offset: -2px;
  }

  .chat-input-container button {
    padding: 8px 12px;

    border: 0;
    background: none;

    cursor: pointer;
  }

  /* Send button */
  #chat-send {
    border-radius: 5px;
    background: #ccc;
    color: #fff;
  }

  #chat-send:not(.disabled) {
    background: #5859a2;
  }

  #chat-send.disabled {
    background: #e5e5e5;
    color: #fff;
    pointer-events: none;
  }

  #chat-send:focus-visible {
    outline: 2px solid #6c757d;
    outline-offset: -2px;
  }

  /* Character counter */
  #chat-counter {
    margin-top: 3px;

    color: #666;
    font-size: 12px;
    text-align: right;
  }

  /* =========================================================
       CHAT ROWS
    ========================================================= */

  .chat-row {
    display: flex;
    width: 100%;
    margin-bottom: 10px;
    font-size: 14px;
    animation: chatFade 0.2s ease;
    scroll-margin-top: 8px;
  }

  .chat-row.user {
    justify-content: flex-end;
  }

  .chat-row.bot {
    justify-content: flex-start;
  }

  .chat-row.bot.thinking {
    opacity: 0.8;
  }

  /* Message bubble */
  .chat-row > div {
    padding: 8px 12px;

    border: 1px solid rgba(0, 0, 0, 0.05);
    border-radius: 10px;

    line-height: 1.5;
  }

  /* User bubble */
  .chat-row.user > div {
    max-width: 65%;

    background: #f3f7ff;
    color: #172554;

    border-color: #c7d7ff;
    border-bottom-left-radius: 4px;
  }

  /* Bot bubble */
  .chat-row.bot > div {
    width: fit-content;
    max-width: 95%;

    background: #f9fafb;
    color: #111827;

    border-bottom-right-radius: 4px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
  }

  /* =========================================================
       BOT TEXT / MARKDOWN
    ========================================================= */

  .chat-row.bot .bot-text {
    position: relative;

    display: flex;
    flex-direction: column;
    gap: 4px;

    overflow: hidden;
  }

  .bot-text :global(p) {
    margin: 6px 0;
    transition: max-height 0.2s ease;
  }

  .bot-text :global(ul) {
    margin: 8px 0;
    padding-left: 18px;
  }

  .bot-text :global(li) {
    margin-bottom: 4px;
  }

  .bot-text :global(a) {
    @apply text-custom-8 underline;
    font-weight: 600;
  }

  .bot-text :global(a:hover) {
    @apply no-underline;
  }

  /* Download links */
  .bot-text :global(a[data-download='true']) {
    display: inline-flex !important;
    align-items: center;

    white-space: nowrap !important;
  }

  .bot-text :global(a[data-download='true'])::after {
    display: inline-block;

    width: 1.5em;
    height: 1.5em;
    margin-left: 0.2em;

    background-color: currentColor;

    content: '';

    vertical-align: -0.375em;

    -webkit-mask: var(--download-icon-uri) center / contain no-repeat;
    mask: var(--download-icon-uri) center / contain no-repeat;
  }

  /* Expandable messages */
  .bot-text:global(.expandable) {
    cursor: pointer;
  }

  .bot-text:global(.collapsed) {
    position: relative;

    max-height: 7.5rem;

    overflow: hidden;
  }

  .bot-text:global(.collapsed)::after {
    position: absolute;
    bottom: 0;
    left: 0;

    width: 100%;
    height: 40px;

    background: linear-gradient(to bottom, rgba(229, 231, 235, 0), rgba(229, 231, 235, 1));

    content: '';
  }

  .bot-text:not(:global(.collapsed)) {
    max-height: none;
  }

  /* =========================================================
       TYPING INDICATOR
    ========================================================= */

  .typing {
    display: inline-flex;
    gap: 4px;
  }

  .typing span {
    width: 6px;
    height: 6px;

    border-radius: 50%;
    background: #555;

    animation: typingBounce 1.4s infinite ease-in-out;
  }

  .typing span:nth-child(2) {
    animation-delay: 0.2s;
  }

  .typing span:nth-child(3) {
    animation-delay: 0.4s;
  }

  /* Respect user's reduced-motion preference */
  @media (prefers-reduced-motion: reduce) {
    .typing span {
      animation: none;
    }
  }

  /* =========================================================
       ACTIONS
    ========================================================= */

  #chat-actions {
    display: flex;
    justify-content: center;

    padding: 8px 10px;

    border-top: 1px solid #eee;
    background: #fff;
  }

  #chat-actions .dive-deeper-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;

    padding: 8px 20px;

    border: none;
    border-radius: 5px;
    outline: none;

    background: #535aa4;
    color: #fff;

    box-shadow: none;
    cursor: pointer;

    font-size: 16px;
    font-weight: 600;
  }

  #chat-actions .dive-deeper-button:hover {
    background: #130944;
  }

  #chat-actions .dive-deeper-button:focus-visible {
    outline: 2px solid #6c757d;
    outline-offset: 2px;
  }

  /* =========================================================
       ANIMATIONS
    ========================================================= */

  @keyframes typingBounce {
    0%,
    80%,
    100% {
      transform: scale(0.7);
      opacity: 0.5;
    }

    40% {
      transform: scale(1);
      opacity: 1;
    }
  }

  @keyframes chatFade {
    from {
      transform: translateY(4px);
      opacity: 0;
    }

    to {
      transform: none;
      opacity: 1;
    }
  }
</style>
