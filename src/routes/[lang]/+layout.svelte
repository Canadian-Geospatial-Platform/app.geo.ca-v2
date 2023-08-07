<script lang="ts">
	import '../../app.css';
	import Header from '$lib/components/header/header.svelte';
</script>

<Header />
<div class="container mx-auto bg-green-100">
	<slot />
</div>
