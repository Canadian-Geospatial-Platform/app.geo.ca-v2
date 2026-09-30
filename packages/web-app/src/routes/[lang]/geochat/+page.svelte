<script lang="ts">
  import GeoChatPage from '$lib/geochat/components/geochat-page.svelte';
  import { page } from '$app/state';

  const lang: 'en' | 'fr' = page.data.lang.startsWith('fr') ? 'fr' : 'en';

  const alternateLanguageUrl = page.data.alternateLanguageUrl;

  // $effect(() => {
  //   console.log('=== GeoChat +page ===');
  //   console.log('page.params.lang =', page.params.lang);
  //   console.log('page.data.lang =', page.data.lang);
  //   console.log('lang =', lang);
  //   console.log('page.data.alternateLanguageUrl =', page.data.alternateLanguageUrl);
  //   console.log('alternateLanguageUrl =', alternateLanguageUrl);
  //   console.log('======================');
  // });
</script>

<GeoChatPage {lang} {alternateLanguageUrl} />
