<script lang="ts">
  import { onDestroy, type Snippet } from 'svelte';

  interface Props {
    open: boolean;
    title?: string;
    labelledby?: string;
    describedby?: string;
    role?: 'dialog' | 'alertdialog';
    wide?: boolean;
    padded?: boolean;
    closeOnBackdrop?: boolean;
    onclose?: () => void;
    children: Snippet;
  }

  let {
    open,
    title,
    labelledby,
    describedby,
    role = 'dialog',
    wide = false,
    padded = true,
    closeOnBackdrop = false,
    onclose,
    children,
  }: Props = $props();
  const id = $props.id();
  let dialog: HTMLDialogElement;

  $effect(() => {
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  });

  onDestroy(() => {
    if (dialog?.open) dialog.close();
  });

  function handleBackdropClick(event: MouseEvent): void {
    if (!closeOnBackdrop || event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) {
      onclose?.();
    }
  }
</script>

<dialog
  bind:this={dialog}
  class={[
    'fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] rounded border border-custom-16 bg-white shadow-lg',
    wide ? 'max-w-5xl' : 'max-w-md',
    padded && 'p-6',
    !padded && 'p-0',
  ]}
  {role}
  aria-modal="true"
  aria-labelledby={title ? `${id}-title` : labelledby}
  aria-describedby={describedby}
  oncancel={(event) => {
    event.preventDefault();
    onclose?.();
  }}
  onkeydown={(event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      onclose?.();
    }
  }}
  onclick={handleBackdropClick}
>
  {#if title}
    <h2 id={`${id}-title`} class="mb-3 text-xl font-bold">{title}</h2>
  {/if}
  {@render children()}
</dialog>

<style>
  dialog::backdrop {
    background: rgb(0 0 0 / 40%);
  }
</style>
