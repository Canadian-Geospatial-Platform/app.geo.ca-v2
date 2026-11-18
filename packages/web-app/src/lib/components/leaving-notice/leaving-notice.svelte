<script lang="ts">
  import { getTranslations } from '#lib/i18n/index.js';
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { getAppLanguage } from '#lib/utils/language.js';
  import AppDialog from '#lib/components/dialog/app-dialog.svelte';

  const appLang = $derived(getAppLanguage(page.data.lang ?? page.params.lang));
  const titleText = $derived(getTranslations(appLang).components.leavingNotice.title);

  let dots = $state('');

  onMount(() => {
    const interval = setInterval(() => {
      dots = dots.length < 3 ? `${dots}.` : '';
    }, 300);
    return () => clearInterval(interval);
  });
</script>

<AppDialog open labelledby="leaving-notice-title">
  <h2 id="leaving-notice-title" class="text-xl font-bold">{titleText}<span aria-hidden="true">{dots}</span></h2>
</AppDialog>
