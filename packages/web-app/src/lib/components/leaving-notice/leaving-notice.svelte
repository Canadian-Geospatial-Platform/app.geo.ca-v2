<script>
  import { onDestroy } from 'svelte';
  import { page } from '$app/state';
  import { pickByLanguage } from '$lib/utils/language';

  const lang = page.data.lang;
  const message = pickByLanguage(lang, 'Leaving geo.ca', 'Vous quittez geo.ca');

  let dots = '';
  let interval;

  // Cycle dots every 300ms
  interval = setInterval(() => {
    dots = dots.length < 3 ? `${dots}.` : '';
  }, 300);

  onDestroy(() => clearInterval(interval));
</script>

<div
  class="fixed inset-0 z-10050 flex items-center justify-center
    w-screen h-screen bg-custom-5/80 text-3xl md:text-7xl"
  style="text-shadow: 2px 2px 6px rgba(0, 0, 0, 0.6);"
>
  {message}<span class="w-3">{dots}</span>
</div>
