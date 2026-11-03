<script lang="ts">
  import { onDestroy } from 'svelte';
  import { page } from '$app/state';
  import { pickByLanguage } from '#lib/utils/language.js';
  import AppDialog from './app-dialog.svelte';

  const id = $props.id();
  let pending = $state<{ mode: 'confirm' | 'prompt'; message: string; resolve: (value: string | null) => void } | null>(null);
  let value = $state('');
  const cancelLabel = $derived(pickByLanguage(page.data.lang, 'Cancel', 'Annuler'));
  const confirmLabel = $derived(pickByLanguage(page.data.lang, 'Delete', 'Supprimer'));
  const saveLabel = $derived(pickByLanguage(page.data.lang, 'Save', 'Enregistrer'));
  const confirmTitle = $derived(pickByLanguage(page.data.lang, 'Confirm deletion', 'Confirmer la suppression'));
  const promptTitle = $derived(pickByLanguage(page.data.lang, 'Save as...', 'Enregistrer sous...'));

  /**
   * Opens a dialog and resolves when the user submits or cancels it.
   *
   * @param mode - Whether to request confirmation or text input.
   * @param message - The message displayed in the dialog.
   * @param initialValue - Initial prompt value; ignored for confirmation.
   * @returns The submitted text, an empty string for confirmation, or null when cancelled.
   */
  function request(mode: 'confirm' | 'prompt', message: string, initialValue = ''): Promise<string | null> {
    if (pending) throw new Error('A dialog is already open.');
    value = initialValue;
    return new Promise((resolve) => {
      pending = { mode, message, resolve };
    });
  }

  /**
   * Shows a confirmation dialog.
   *
   * @param message - The message displayed in the dialog.
   * @returns True when confirmed, or false when cancelled.
   */
  export async function confirm(message: string): Promise<boolean> {
    return (await request('confirm', message)) !== null;
  }

  /**
   * Shows a text-entry dialog.
   *
   * @param message - The prompt displayed alongside the input.
   * @param initialValue - The input's initial text.
   * @returns The submitted text, or null when cancelled.
   */
  export function prompt(message: string, initialValue = ''): Promise<string | null> {
    return request('prompt', message, initialValue);
  }

  /**
   * Resolves and closes the active dialog, if one is open.
   * @param result - The submitted value, or null when the dialog is cancelled.
   */
  function finish(result: string | null): void {
    const current = pending;
    pending = null;
    current?.resolve(result);
  }

  onDestroy(() => finish(null));
</script>

<AppDialog
  open={pending !== null}
  title={pending?.mode === 'prompt' ? promptTitle : confirmTitle}
  describedby={pending?.mode === 'confirm' ? `${id}-message` : undefined}
  onclose={() => finish(null)}
>
  {#if pending}
    <form
      onsubmit={(event) => {
        event.preventDefault();
        finish(pending?.mode === 'prompt' ? value : '');
      }}
    >
      {#if pending.mode === 'prompt'}
        <label for={`${id}-input`} class="mb-2 block font-custom-style-body-1">{pending.message}</label>
        <input
          id={`${id}-input`}
          type="text"
          class="mb-5 w-full rounded border border-custom-16 px-3 py-2"
          bind:value
          onfocus={(event) => event.currentTarget.select()}
        />
      {:else}
        <p id={`${id}-message`} class="mb-5 whitespace-pre-line wrap-break-word font-custom-style-body-1">{pending.message}</p>
      {/if}
      <div class="flex flex-wrap gap-3">
        <button type="button" class="button-action-light" onclick={() => finish(null)}>
          {cancelLabel}
        </button>
        <button type="submit" class="button-action-dark">
          {pending.mode === 'prompt' ? saveLabel : confirmLabel}
        </button>
      </div>
    </form>
  {/if}
</AppDialog>
