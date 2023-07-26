<script lang="ts">
	import { slide } from 'svelte/transition';
	let collapse = false;
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
</script>

<h2 on:click={() => (collapse = !collapse)}>Organisations</h2>
{#if collapse}
	<ul transition:slide>
		{#each organisations as o}
			<li>
				<input type="checkbox" id="organisation-filter-{o}" name="organisation-filter-{o}" />
				<label for="organisation-filter-{o}">{o}</label>
			</li>
		{/each}
	</ul>
{/if}
