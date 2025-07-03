<script lang="ts">
	let { item, lang } = $props();
</script>

{#each item.distributor as x}
	<span itemscope itemtype="http://schema.org/Organization">
		<span property="name">{x?.organisation[lang]}</span>
		<span property="email">{x?.email[lang]}</span>
	</span>
{/each}
