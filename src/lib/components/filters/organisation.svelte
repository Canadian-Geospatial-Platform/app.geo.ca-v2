<script lang="ts">
	import { page } from '$app/stores';
	import { slide } from 'svelte/transition';
	import Checkbox from './inputs/checkbox.svelte';
	let collapse = true;
	let organisations = [
		'Agence Canadienne de Développement économique du Nord',
		"Agence d'évaluation d'impact du Canada",
		'Agence de la santé publique du Canada',
		'Agence spatiale canadienne',
		'Agriculture et Agroalimentaire Canada',
		'Commission canadienne de sûreté nucléaire',
		'Défense nationale',
		'Élections Canada',
		'Emploi et Développement social Canada',
		'Environnement et Changement climatique Canada',
		"Gouvernement de l'Alberta",
		"Gouvernement de l'Île-du-Prince-Édouard",
		"Gouvernement de l'Ontario",
		'Gouvernement de la Colombie-Britannique',
		'Gouvernement de la Nouvelle-Écosse',
		'Gouvernement de la Saskatchewan',
		'Gouvernement de Terre-Neuve-et-Labrador',
		'Gouvernement des Territoires du Nord-Ouest',
		'Gouvernement du Manitoba',
		'Gouvernement du Nouveau-Brunswick',
		'Gouvernement du Nunavut',
		'Gouvernement du Yukon',
		'Gouvernement et municipalités du Québec',
		"Moissonneur web de l'Infrastructure canadienne de données géospatiales",
		'Parcs Canada',
		'Patrimoine canadien',
		'Pêches et Océans Canada',
		'Ressources naturelles Canada',
		'Services aux Autochtones Canada',
		'Statistique Canada',
		'Transports Canada'
	];
	function init(key) {
		return $page.url.searchParams.get(key) == 'on';
	}

	function getId(key) {
		return 'filters-organisations-' + key.toLowerCase().replace(/\s/g, '-');
	}
</script>

<button on:click={() => (collapse = !collapse)}>Organisations</button>
{#if !collapse}
	<ul transition:slide>
		{#each organisations as x}
			<li>
				<Checkbox id={getId(x)} name={x} />
			</li>
		{/each}
	</ul>
{/if}
