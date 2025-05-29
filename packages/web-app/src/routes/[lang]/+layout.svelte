<script lang="ts">
  import { page } from '$app/stores';
  import { updated } from '$app/stores';
  import { onMount } from 'svelte';
  import '../../app.css';
  import Header from '$lib/components/header/header.svelte';
  import Footer from '$lib/components/footer/footer.svelte';
  import Feedback from '$lib/components/feedback/feedback.svelte';
  import Breadcrumbs from '$lib/components/breadcrumbs/breadcrumbs.svelte';
  import LeavingNotice from '$lib/components/leaving-notice/leaving-notice.svelte';

  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();
  let showLeavingSitePopup = $state(false);
  const lang = $page.data.lang?.slice(0, 2) ?? 'en';

  // Set the language of the page. This needs to be done using onMount to
  // ensure it is only executed after the <html> element is present in the DOM.
  // Assigning the language using <svelte:head> instead sometimes caused errors
  onMount(() => {
    document.documentElement.lang = lang;

    // When the user clicks on an external link, indicate to the user that they are leaving
    const handleClick = (event) => {
      const anchor = event.target.closest('a');
      if (!anchor) {
        return;
      }

      const href = anchor.href;
      const isExternal = href
        && !href.includes($page.url.host)
        && !href.includes('geo.ca')
        && !href.startsWith('mailto');

      if (isExternal) {
        showLeavingSitePopup = true;

        // delay navigation to allow for users to read the message
        event.preventDefault();
        setTimeout(() => {
          showLeavingSitePopup = false;
          window.location.href = href;
        }, 2000);
      }
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  });
</script>

<Header />
<main
  class="flex flex-col content-width bg-custom-1 min-h-screen pt-8"
  data-sveltekit-reload={$updated ? '' : 'off'}
>
  <Breadcrumbs />
  <div>
    {@render children?.()}
  </div>
  <Feedback />
</main>
<Footer />

{#if showLeavingSitePopup}
  <LeavingNotice />
{/if}
