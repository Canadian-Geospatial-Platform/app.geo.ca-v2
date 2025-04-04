// Source for clickOutside function based on: https://svelte.dev/repl/0ace7a508bd843b798ae599940a91783?version=3.16.7
import { onMount } from 'svelte';

export function clickOutside(node) {
  let handleClick;

  // Since Svelte does not execute onMount during servere side rendering,
  // it safe to include DOM operations here (i.e. referencing the window)
  onMount(() => {
    handleClick = (event) => {
      if (node && !node.contains(event.target) && !event.defaultPrevented) {
        node.dispatchEvent(new CustomEvent('click_outside'));
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