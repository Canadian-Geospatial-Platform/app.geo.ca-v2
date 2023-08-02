<script lang="ts">
	import { page } from '$app/stores';
	import { slide } from 'svelte/transition';
	import Checkbox from './inputs/checkbox.svelte';

	$: title = $page.data.lang == 'en-ca' ? 'Organisations' : 'Organisations';
	let collapse = true;

	const organisations = [
		{
			'fr-ca': 'Agence Canadienne de Développement économique du Nord',
			'en-ca': 'Canadian Northern Economic Development Agency'
		},
		{
			'fr-ca': "Agence d'évaluation d'impact du Canada",
			'en-ca': 'Impact Assessment Agency of Canada'
		},
		{ 'fr-ca': 'Agence de la santé publique du Canada', 'en-ca': 'Public Health Agency of Canada' },
		{ 'fr-ca': 'Agence spatiale canadienne', 'en-ca': 'Canadian Space Agency' },
		{
			'fr-ca': 'Agriculture et Agroalimentaire Canada',
			'en-ca': 'Agriculture and Agri-Food Canada'
		},
		{
			'fr-ca': 'Commission canadienne de sûreté nucléaire',
			'en-ca': 'Canadian Nuclear Safety Commission'
		},
		{ 'fr-ca': 'Défense nationale', 'en-ca': 'National Defence' },
		{ 'fr-ca': 'Élections Canada', 'en-ca': 'Elections Canada' },
		{
			'fr-ca': 'Emploi et Développement social Canada',
			'en-ca': 'Employment and Social Development Canada'
		},
		{
			'fr-ca': 'Environnement et Changement climatique Canada',
			'en-ca': 'Environment and Climate Change Canada'
		},
		{ 'fr-ca': "Gouvernement de l'Alberta", 'en-ca': 'Government of Alberta' },
		{
			'fr-ca': "Gouvernement de l'Île-du-Prince-Édouard",
			'en-ca': 'Government of Prince Edward Island'
		},
		{ 'fr-ca': "Gouvernement de l'Ontario", 'en-ca': 'Government of Ontario' },
		{
			'fr-ca': 'Gouvernement de la Colombie-Britannique',
			'en-ca': 'Government of British Columbia'
		},
		{ 'fr-ca': 'Gouvernement de la Nouvelle-Écosse', 'en-ca': 'Government of Nova Scotia' },
		{ 'fr-ca': 'Gouvernement de la Saskatchewan', 'en-ca': 'Government of Saskatchewan' },
		{
			'fr-ca': 'Gouvernement de Terre-Neuve-et-Labrador',
			'en-ca': 'Government of Newfoundland and Labrador'
		},
		{
			'fr-ca': 'Gouvernement des Territoires du Nord-Ouest',
			'en-ca': 'Government of Northwest Territories'
		},
		{ 'fr-ca': 'Gouvernement du Manitoba', 'en-ca': 'Government of Manitoba' },
		{ 'fr-ca': 'Gouvernement du Nouveau-Brunswick', 'en-ca': 'Government of New Brunswick' },
		{ 'fr-ca': 'Gouvernement du Nunavut', 'en-ca': 'Government of Nunavut' },
		{ 'fr-ca': 'Gouvernement du Yukon', 'en-ca': 'Government of Yukon' },
		{
			'fr-ca': 'Gouvernement et municipalités du Québec',
			'en-ca': 'Government and Municipalities of Québec'
		},
		{
			'fr-ca': "Moissonneur web de l'Infrastructure canadienne de données géospatiales",
			'en-ca': 'Canadian Geospatial Data Infrastructure Web Harvester'
		},
		{ 'fr-ca': 'Parcs Canada', 'en-ca': 'Parks Canada' },
		{ 'fr-ca': 'Patrimoine canadien', 'en-ca': 'Canadian Heritage' },
		{ 'fr-ca': 'Pêches et Océans Canada', 'en-ca': 'Fisheries and Oceans Canada' },
		{ 'fr-ca': 'Ressources naturelles Canada', 'en-ca': 'Natural Resources Canada' },
		{ 'fr-ca': 'Services aux Autochtones Canada', 'en-ca': 'Indigenous Services Canada' },
		{ 'fr-ca': 'Statistique Canada', 'en-ca': 'Statistics Canada' },
		{ 'fr-ca': 'Transports Canada', 'en-ca': 'Transport Canada	' }
	];
	function init(key) {
		return $page.url.searchParams.get(key) == 'on';
	}

	function getId(key) {
		return 'organisations-' + key.toLowerCase();
	}
</script>

<button on:click={() => (collapse = !collapse)}>{title}</button>
{#if !collapse}
	<ul transition:slide>
		{#each organisations as x}
			<li>
				<Checkbox id={getId(x['en-ca'])} name={x[$page.data.lang]} />
			</li>
		{/each}
	</ul>
{/if}
