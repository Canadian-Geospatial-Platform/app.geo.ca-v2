<script lang="ts">
	import { page } from '$app/stores';
</script>

<div class="grid grid-cols-2 md:grid-cols-2 gap-10 p-10 bg-custom-5 rounded-lg drop-shadow-lg">
	<div>
		<h3 class="text-2xl pb-2">{$page.data.i18nFooterLabels.contactUs}</h3>
		<ul>
			<li>{$page.data.i18nFooterLabels.ccmeo}</li>
			<li>{$page.data.i18nFooterLabels.nrcan}</li>
			<li>{$page.data.i18nFooterLabels.goc}</li>
			<li><a href="mailto:geo@nrcan-rncan.gc.ca">geo@nrcan-rncan.gc.ca</a></li>
		</ul>
	</div>
	<div class="text-right">
		<img
			src="https://geo.ca/wp-content/uploads/2020/05/Canada-Gov-logo.png"
			class="w-40 ml-auto pb-2"
		/>
		<ul>
			<li>
				<a href={$page.data.i18nFooterLabels.licenseUrl}>{$page.data.i18nFooterLabels.license}</a>
			</li>
			<li>{$page.data.i18nFooterLabels.copyright}</li>
		</ul>
	</div>
</div>

<style>
	a {
		@apply underline;
	}
</style>
