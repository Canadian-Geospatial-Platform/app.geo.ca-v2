<script lang="ts">
	import { page } from '$app/stores';

	const legalData: { [key: string]: string } = $page.data.legalData;

	let logoUrl = legalData?.logoUrl ? legalData['logoUrl'] : '';
	let logoAlt = legalData?.logoAlt ? legalData['logoAlt'] : '';
	let contactUs = legalData?.contactUs ? legalData['contactUs'] : '';
	let ccmeo = legalData?.ccmeo ? legalData['ccmeo'] : '';
	let nrcan = legalData?.nrcan ? legalData['nrcan'] : '';
	let goc = legalData?.goc ? legalData['goc'] : '';
	let license = legalData?.license ? legalData['license'] : '';
	let licenceUrl = legalData?.licenceUrl ? legalData['licenceUrl'] : '';
	let copyright = legalData?.copyright ? legalData['copyright'] : '';
	let email = legalData?.email ? legalData['email'] : '';
	let cdgi = legalData?.cdgi ? legalData['cdgi'] : '';
	let cdgiLink = legalData?.cdgiLink ? legalData['cdgiLink'] : '';
	let cdgiLinkText = legalData?.cdgiLinkText ? legalData['cdgiLinkText'] : '';
	let cdgiAcronym = legalData?.cdgiAcronym ? legalData['cdgiAcronym'] : '';
</script>

<div class="bg-custom-5 font-open-sans py-4">
	<div class="grid grid-cols-1 md:grid-cols-2 content-width">
		<div class="legal-col">
			<h3 class="mb-2.5">{contactUs}</h3>
			<p>{ccmeo}</p>
			<p>{nrcan}</p>
			<p>{goc}</p>
			<p><a href={'mailto:' + email}>{email}</a></p>
		</div>
		<div class="legal-col md:text-right">
			<img class="w-28 md:ml-auto mb-5" src={logoUrl} alt={logoAlt} />
			<p><a href={licenceUrl}>{license}</a></p>
			<p>{copyright}</p>
			<p>
				{cdgi}
				<a href={cdgiLink}>
					{cdgiLinkText}
				</a>
				{cdgiAcronym}
			</p>
		</div>
	</div>
</div>

<style>
	.legal-col {
		@apply p-3;
	}

	@media (min-width: 48rem) {
		.legal-col {
			align-content: flex-end;
		}
	}

	h3 {
		@apply text-lg;
		@apply font-semibold;
	}

	p {
		@apply text-base;
	}

	a {
		@apply underline;
		@apply hover:no-underline;
		@apply text-custom-8;
	}
</style>
