<script lang="ts">
  import { page } from '$app/stores';
  import { updated } from '$app/stores';
  import { onMount } from 'svelte';
  import '../../app.css';
  import Header from '$lib/components/header/header.svelte';
  import Footer from '$lib/components/footer/footer.svelte';
  import Feedback from '$lib/components/feedback/feedback.svelte';
  import Breadcrumbs from '$lib/components/breadcrumbs/breadcrumbs.svelte';
  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();

  const lang = $page.data.lang?.slice(0, 2) ?? 'en';

  // Set the language of the page. This needs to be done using onMount to
  // ensure it is only executed after the <html> element is present in the DOM.
  // Assigning the language using <svelte:head> instead sometimes caused errors
  onMount(() => {
    document.documentElement.lang = lang;
  });
</script>

<Header />
<div
  class="flex flex-col content-width space-y-4 bg-custom-1 min-h-screen pt-4"
  data-sveltekit-reload={$updated ? '' : 'off'}
>
  <Breadcrumbs />
  <div class="grow">
    {@render children?.()}
  </div>
  <Feedback />
</div>
<Footer />
