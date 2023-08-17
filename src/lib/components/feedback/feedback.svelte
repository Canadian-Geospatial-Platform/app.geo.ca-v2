<script lang="ts">
	import { page } from '$app/stores';
</script>

<div class="bg-custom-8 text-custom-1 p-4 m-4 rounded-lg drop-shadow-lg">
	<p>
		{#if $page.data.lang == 'en-ca'}
			We need your feedback! Please take our <a class="underline" href="survey">survey</a> on your recent
			user experience.
		{:else}
			Nous avons besoin de votre avis! Veuillez répondre à notre <a class="underline" href="survey"
				>sondage</a
			> sur votre expérience utilisateur récente.
		{/if}
	</p>
</div>
