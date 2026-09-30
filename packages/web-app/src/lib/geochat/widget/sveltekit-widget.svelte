<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import GeoChatWidget from '../widget/geochat-widget.svelte';
  import { setGeoChatConfig } from '$lib/geochat/geochat-config';

  const locale = $derived(page.params.lang ?? 'en-ca');

  const lang = $derived(locale.startsWith('fr') ? 'fr' : 'en');
  // console.log('lang=', lang);
  // console.log('page.params.lang=', page.params.lang);

  const alternateLanguageUrl = $derived.by(() => {
    const alternateLocale = page.params.lang === 'fr-ca' ? 'en-ca' : 'fr-ca';

    return `${page.url.pathname.replace(`/${page.params.lang}`, `/${alternateLocale}`)}${page.url.search}${page.url.hash}`;
  });

  //console.log('alternateLanguageUrl=', alternateLanguageUrl);

  function handleDiveDeeper() {
    console.log('page.params.lang =', page.params.lang);
    console.log('lang =', lang);
    console.log('goto =', `/${lang}/geochat`);

    goto(`/${locale}/geochat`);
  }

  // TODO: Replace hardcoded URLs with environment variables.
  // WordPress supplies these via plugin settings.
  // Add to .env
  //  CHAT_API_URL
  //  CHAT_HISTORY_URL
  // and
  // setGeoChatConfig({
  //     chatApiUrl: CHAT_API_URL,
  //     chatHistoryUrl: CHAT_HISTORY_URL,
  // });

  setGeoChatConfig({
    chatApiUrl: 'https://0y633i08af.execute-api.ca-central-1.amazonaws.com/staging/chat',

    chatHistoryUrl: 'https://0y633i08af.execute-api.ca-central-1.amazonaws.com/staging/chathistory',

    chatWarmupUrl: 'https://0y633i08af.execute-api.ca-central-1.amazonaws.com/staging/warmup',

    chatHistoryVerifyUrl: 'https://0y633i08af.execute-api.ca-central-1.amazonaws.com/staging/chathistory/verify',
  });
</script>

{#if !page.url.pathname.endsWith('/geochat')}
  <GeoChatWidget {lang} {alternateLanguageUrl} onDiveDeeper={handleDiveDeeper} />
{/if}
