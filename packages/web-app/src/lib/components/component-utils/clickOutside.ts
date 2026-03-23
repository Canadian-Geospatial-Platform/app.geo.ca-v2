// Source for clickOutside function based on: https://svelte.dev/repl/0ace7a508bd843b798ae599940a91783?version=3.16.7
import { onMount } from 'svelte';
import type { ActionReturn } from 'svelte/action';

/**
 * Svelte action that detects clicks outside of the specified node (button or form).
 *
 * Calls the provided callback when a click occurs outside the node.
 *
 * @param  node - The DOM node to detect outside clicks for.
 * @param  callback - The function to call when a click occurs outside.
 * @returns  An object with a destroy method to clean up the event listener.
 */
export function clickOutside(node: HTMLButtonElement | HTMLFormElement, callback?: () => void): ActionReturn {
  let handleClick: (event: MouseEvent) => void;

  // Since Svelte does not execute onMount during server side rendering,
  // it's safe to include DOM operations here (i.e. referencing the window)
  onMount(() => {
    handleClick = (event: MouseEvent): void => {
      if (node && !node.contains(event.target as Node) && !event.defaultPrevented) {
        callback?.();
      }
    };

    window.addEventListener('click', handleClick, true);
  });

  return {
    destroy() {
      window.removeEventListener('click', handleClick, true);
    },
  };
}
