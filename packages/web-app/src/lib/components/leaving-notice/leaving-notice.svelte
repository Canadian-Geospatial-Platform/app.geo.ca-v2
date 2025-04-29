<script>
  import { onDestroy } from 'svelte';
  import { page } from '$app/stores';

  const lang = $page.data.lang;
  const message = lang == 'fr-ca' ? 'Vous quittez geo.ca' : 'Leaving geo.ca';

  let dots = '';
  let interval;

  // Cycle dots every 300ms
  interval = setInterval(() => {
    dots = dots.length < 3 ? dots + '.' : '';
  }, 300);

  onDestroy(() => clearInterval(interval));
</script>

<div
  class="fixed top-0 z-[100050] flex items-center justify-center
    w-full h-screen bg-custom-5/80 text-3xl md:text-7xl"
  style="text-shadow: 2px 2px 6px rgba(0, 0, 0, 0.6);"
>
  {message}<span class='w-3'>{dots}</span>
</div>
