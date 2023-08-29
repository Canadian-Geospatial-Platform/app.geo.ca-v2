<script lang="ts">
	export let item;
	export let lang;
</script>

{#each item.distributor as x}
	<span property="publisher" typeof="Organization">
		<span property="name">{JSON.stringify(x.organisation[lang])}</span>
		<span property="email">open-ouvert@tbs-sct.gc.ca</span>
	</span>
{/each}
