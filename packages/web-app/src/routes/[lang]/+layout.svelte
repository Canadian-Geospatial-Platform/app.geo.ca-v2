<script lang="ts">
	import { updated } from '$app/stores';
	import { setContext } from 'svelte';
	import '../../app.css';
	import Header from '$lib/components/header/header.svelte';
	import Footer from '$lib/components/footer/footer.svelte';
	import Feedback from '$lib/components/feedback/feedback.svelte';
	import Breadcrumbs from '$lib/components/breadcrumbs/breadcrumbs.svelte';
</script>

<div
	class="container flex flex-col mx-auto px-2 space-y-4 bg-custom-1 min-h-screen"
	data-sveltekit-reload={$updated ? '' : 'off'}
>
	<Header />
	<Feedback />
	<Breadcrumbs />
	<div class="grow">
		<slot />
	</div>
	<Footer />
</div>
