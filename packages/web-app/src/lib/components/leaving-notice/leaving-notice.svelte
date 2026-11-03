<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { pickByLanguage } from '#lib/utils/language.js';
  import AppDialog from '#lib/components/dialog/app-dialog.svelte';

  const lang = page.data.lang;
  const message = pickByLanguage(lang, 'Leaving geo.ca', 'Vous quittez geo.ca');

  let dots = $state('');

  onMount(() => {
    const interval = setInterval(() => {
      dots = dots.length < 3 ? `${dots}.` : '';
    }, 300);
    return () => clearInterval(interval);
  });
</script>

<AppDialog open labelledby="leaving-notice-title">
  <h2 id="leaving-notice-title" class="text-xl font-bold">{message}<span aria-hidden="true">{dots}</span></h2>
</AppDialog>
