<script lang="ts">
	export let item;
	export let lang;
</script>

{#each item.features[0].properties.distributor as x}
	<span property="publisher" typeof="Organization">
		<span property="name">{x.organisation[lang]}</span>
		<span property="email">{x.email[lang]}</span>
	</span>
{/each}
