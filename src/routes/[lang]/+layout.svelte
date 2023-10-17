<script lang="ts">
	import { updated } from '$app/stores';
	import { setContext } from 'svelte';
	import '../../app.css';
	import Header from '$lib/components/header/header.svelte';
	import Footer from '$lib/components/footer/footer.svelte';
	import Feedback from '$lib/components/feedback/feedback.svelte';
	import Breadcrumbs from '$lib/components/breadcrumbs/breadcrumbs.svelte';

	setContext('userData', {
		favorites: ['xxxx', 'yyyyy', 'a3edf193-5c56-4b38-bcc5-c8708c60ce38'],
		darkmode: true
	});
</script>

<div
	class="container flex flex-col mx-auto py-1 bg-custom-1 h-screen"
	data-sveltekit-reload={$updated ? '' : 'off'}
>
	<Header />
	<Feedback />
	<Breadcrumbs />
	<slot />
	<div class="grow" />
	<Footer />
</div>
