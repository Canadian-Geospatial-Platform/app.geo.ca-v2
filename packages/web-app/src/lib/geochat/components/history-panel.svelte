<script lang="ts">
  import { chatStore } from '$lib/geochat/stores/chat-store';
  import type { ChatHistory } from '$lib/geochat/session/chat-session';
  import PlusIcon from '$lib/components/icons/plus.svelte';
  import GarbageCanIcon from '$lib/components/icons/garbage-can.svelte';

  let {
    lang,
    newChat,
    deleteChat,
    confirmDelete,
    cancelDelete,
    onHistoryAction,
  }: {
    lang: 'en' | 'fr';
    newChat: string;
    deleteChat: string;
    confirmDelete: string;
    cancelDelete: string;
    onHistoryAction: () => void;
  } = $props();

  let deleteSessionId = $state<string | undefined>();

  function handleNewChat() {
    chatStore.newChat(lang);
    onHistoryAction();
  }

  function handleSelectChat(chat: ChatHistory) {
    chatStore.selectChat(chat, lang);
    onHistoryAction();
  }

  function handleDeleteClick(chat: ChatHistory) {
    deleteSessionId = chat.sessionId;
  }

  function handleConfirmDelete(chat: ChatHistory) {
    chatStore.deleteChat(chat, lang);
    deleteSessionId = undefined;
  }

  function handleCancelDelete() {
    deleteSessionId = undefined;
  }
</script>

<div class="history-list">
  <button
    class="text-nowrap
           h-[34px] px-3
           mb-4
           rounded-[0.3125rem]
           font-custom-style-button-3
           shadow-[0rem_0.1875rem_0.375rem_#00000029]
           bg-custom-16 hover:bg-custom-23
           text-white cursor-pointer
           inline-flex items-center"
    onclick={handleNewChat}
  >
    <PlusIcon classes="inline h-4 w-4 mr-2" />
    {newChat}
  </button>

  {#each $chatStore.history as chat (chat.sessionId)}
    {#if chat.title !== 'New Chat'}
      <div class="history-item" class:active={$chatStore.activeSessionId === chat.sessionId}>
        <button
          class="history-select"
          aria-pressed={$chatStore.activeSessionId === chat.sessionId}
          onclick={(e) => {
            handleSelectChat(chat);
            e.currentTarget.blur();
          }}
        >
          <span class="history-title" title={chat.title}>{chat.title}</span>
        </button>

        {#if deleteSessionId === chat.sessionId}
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div class="history-confirm-group" onmouseleave={handleCancelDelete}>
            <button type="button" class="history-confirm" aria-label={confirmDelete} onclick={() => handleConfirmDelete(chat)}> ✓ </button>

            <button type="button" class="history-confirm" aria-label={cancelDelete} onclick={handleCancelDelete}> ✕ </button>
          </div>
        {:else}
          <button
            class="history-delete"
            aria-label={deleteChat}
            onclick={(e) => {
              e.stopPropagation();
              handleDeleteClick(chat);
            }}
          >
            <GarbageCanIcon classes="w-4 h-4" />
          </button>
        {/if}
      </div>
    {/if}
  {/each}
</div>

<style>
  .history-list {
    flex: 1;
    padding: 1rem;
    overflow-y: auto;
  }

  .history-item {
    display: flex;
    align-items: center;
    border-radius: 0.3125rem;
    transition: background-color 0.15s ease;
  }

  .history-item:hover,
  .history-item.active {
    background: #f3f4f6;
  }

  .history-item.active .history-select {
    font-weight: 600;
  }

  .history-select {
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 0;
    margin: 0;
    padding: 0.375rem 0.75rem;

    text-align: left;
    font: inherit;
    color: inherit;

    background: transparent;
    border: none;
    cursor: pointer;
  }

  .history-select:focus-visible {
    outline: 2px solid #26374a;
    outline-offset: 1px;
  }

  .history-title {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .history-delete {
    width: 24px;
    height: 24px;
    padding: 2px;
    margin-right: 0.5rem;

    opacity: 0;
    pointer-events: none;

    background: transparent;
    border: none;
    cursor: pointer;
    transition: opacity 0.15s ease;
  }

  .history-item:hover .history-delete,
  .history-item:focus-within .history-delete {
    opacity: 1;
    pointer-events: auto;
  }

  .history-confirm {
    padding: 2px;
    margin-right: 0.25rem;

    background: transparent;
    border: none;
    cursor: pointer;
  }

  /* Keep the delete icon visible for the selected chat on mobile and tablet. */
  @media (max-width: 63.999rem) {
    .history-item.active .history-delete {
      opacity: 1;
      pointer-events: auto;
    }
  }
</style>
