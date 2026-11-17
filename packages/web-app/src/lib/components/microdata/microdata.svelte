<script lang="ts">
  import { getContentLanguage, getAppLanguage } from '#lib/utils/language.js';
  import { page } from '$app/state';
  import Catalog from './catalog.svelte';
  import Record from './record.svelte';

  let { item } = $props();
  let contentLang = $derived(getContentLanguage(getAppLanguage(page.data.lang)));
</script>

{#if item}
  <div vocab="http://schema.org/" typeof="Dataset" class="hidden">
    <Record {item} lang={contentLang} />
    <Catalog {item} lang={contentLang} />
  </div>
{/if}
