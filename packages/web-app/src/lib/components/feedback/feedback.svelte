<script lang="ts">
	import { page } from '$app/stores';

	const lang = $page.data.lang;
	const title = lang == 'fr-ca' ? 'Dites-nous ce que vous pensez!' : 'Tell us what you think!';
</script>

<div class="font-custom-style-body-1 px-5 mt-9 md:px-0">
	<h2 class="font-custom-style-h2 mb-4">
		{title}
	</h2>
	<div>
		{#if lang == 'fr-ca'}
			<p>
				GEO.ca s’engage à favoriser un dialogue ouvert et à renforcer la communauté autour des
				enjeux et sujets liées à la localisation qui vous intéressent.
				<br /><a
					class="underline hover:no-underline text-custom-16"
					href="mailto:geo@nrcan-rncan.gc.ca">Faites-nous part de vos commentaires</a
				>
			</p>
		{:else}
			<p>
				GEO.ca is committed to open dialogue and community building around location-based issues and
				topics that matter to you.
				<br /><a
					class="underline hover:no-underline text-custom-16"
					href="mailto:geo@nrcan-rncan.gc.ca">Please send us your feedback</a
				>
			</p>
		{/if}
	</div>
</div>
