<script lang="ts">
	import { page } from '$app/stores';
	import { updated } from '$app/stores';
	import { setContext } from 'svelte';
	import '../../app.css';
	import Header from '$lib/components/header/header.svelte';
	import Footer from '$lib/components/footer/footer.svelte';
	import Feedback from '$lib/components/feedback/feedback.svelte';
	import Breadcrumbs from '$lib/components/breadcrumbs/breadcrumbs.svelte';

	const linksData: JSON = $page.data.footerLinks;
  const legalData: {[key: string]: string} = $page.data.legalData;
</script>

<Header />
<div
	class="container flex flex-col mx-auto space-y-4 bg-custom-1 min-h-screen relative pt-24 z-0"
	data-sveltekit-reload={$updated ? '' : 'off'}
>
	<Feedback />
	<Breadcrumbs />
	<div class="grow">
		<slot />
	</div>
</div>
<Footer linksData={linksData} legalData={legalData}/>
