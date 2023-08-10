<script lang="ts">
	import '../../app.css';
	import Header from '$lib/components/header/header.svelte';
	import Footer from '$lib/components/footer/footer.svelte';
</script>

<div class="container mx-auto py-1 bg-green-100">
	<Header />
	<slot />
	<Footer />
</div>
