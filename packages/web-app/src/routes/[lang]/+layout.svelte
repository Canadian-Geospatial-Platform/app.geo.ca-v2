<script lang="ts">
  import { page } from '$app/stores';
  import { updated } from '$app/stores';
  import { setContext } from 'svelte';
  import '../../app.css';
  import Header from '$lib/components/header/header.svelte';
  import Footer from '$lib/components/footer/footer.svelte';
  import Feedback from '$lib/components/feedback/feedback.svelte';
  import Breadcrumbs from '$lib/components/breadcrumbs/breadcrumbs.svelte';
  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();

  const lang = $page.data.lang.slice(0, 2);
</script>

<svelte:head>
  <html lang={lang} />
</svelte:head>

<Header />
<div
  class="flex flex-col content-width space-y-4 bg-custom-1 min-h-screen pt-24 "
  data-sveltekit-reload={$updated ? '' : 'off'}
>
  <Breadcrumbs />
  <div class="grow">
    {@render children?.()}
  </div>
  <Feedback />
</div>
<Footer />
