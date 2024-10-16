<script lang="ts">
	export let item;
	export let lang;
</script>

{#each item.properties.distributor as x}
	<span itemscope itemtype="http://schema.org/Organization">
		<span property="name">{x.organisation[lang]}</span>
		<span property="email">{x.email[lang]}</span>
	</span>
{/each}
