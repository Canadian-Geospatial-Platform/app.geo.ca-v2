<script lang="ts">
	import { page } from '$app/stores';
</script>

<div class="bg-custom-8 text-custom-1 rounded-lg drop-shadow-lg p-3">
	<p>
		{#if $page.data.lang == 'en-ca'}
			<h2>🌟 Welcome to the app.geo.ca Beta! 🌟</h2>
			<br />
			<p>
				We're thrilled to have you on board as we explore the exciting world of geospatial data.
				Your feedback is invaluable to us! If you encounter any issues, have suggestions, or simply
				want to share your thoughts, please reach out to us at
				<a class="underline" href="mailto:geo@nrcan-rncan.gc.ca">geo@nrcan-rncan.gc.ca</a>
				. Let's make this platform even better together! 🗺️📊
			</p>
			<br />
			<p>Happy mapping! 🌐🌍</p>
		{:else}
			<h2>🌟 Bienvenue dans la version bêta d'app.geo.ca ! 🌟</h2>
			<br />
			<p>
				Nous sommes ravis de vous accueillir à bord alors que nous explorons le passionnant monde
				des données géospatiales. Vos commentaires sont inestimables pour nous ! Si vous rencontrez
				des problèmes, avez des suggestions ou souhaitez simplement partager vos réflexions,
				n'hésitez pas à nous contacter à l'adresse
				<a class="underline" href="mailto:geo@nrcan-rncan.gc.ca">geo@nrcan-rncan.gc.ca</a>
				. Construisons ensemble une plateforme encore meilleure ! 🗺️📊
			</p>
			<br />
			<p>Bon mappage ! 🌐🌍</p>
		{/if}
	</p>
</div>
