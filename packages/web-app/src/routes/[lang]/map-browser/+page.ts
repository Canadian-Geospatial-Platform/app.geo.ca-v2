import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

const description = {
	en: 'Welcome to app.geo.ca, the geospatial data catalog that connects you to a world of data. Whether you are looking for maps, satellite imagery, aerial photos, census data, environmental indicators, or any other kind of geospatial information, you can find it here. Browse through our catalog of over 10,000 datasets from hundreds of sources, or use our advanced search tools to find exactly what you need. You can also access our APIs and web services to integrate geo.ca data into your own applications. Geo.ca is your one-stop shop for geospatial data discovery and access. Start exploring today!',
	fr: 'Bienvenue sur app.geo.ca, le catalogue de données géospatiales qui vous relie à un monde de données. Que vous recherchiez des cartes, des images satellites, des photos aériennes, des données de recensement, des indicateurs environnementaux ou tout autre type d’information géospatiale, vous pouvez la trouver ici. Parcourez notre catalogue de plus de 10 000 jeux de données provenant de centaines de sources, ou utilisez nos outils de recherche avancés pour trouver exactement ce dont vous avez besoin. Vous pouvez également accéder à nos API et services web pour intégrer les données de geo.ca dans vos propres applications. Geo.ca est votre guichet unique pour la découverte et l’accès aux données géospatiales. Commencez à explorer dès aujourd’hui !'
};

export const load: PageLoad = ({ params, data, url }) => {
	return {
		results: data.results,
		lang: params.lang,
		userData: data.userData,
		start: data.start,
		end: data.end,
		t_title_1: {
			text:
				params.lang == 'en-ca' ? 'Geospatial Data Catalog' : 'Catalogue de données géospatiales',
			href: url.href
		},
		t_description: params.lang == 'en-ca' ? description.en : description.fr,
		total: parseInt(data.results?.[0]?.total ? data.results[0].total : 0)
	};
};

function translations(lang) {
	return {
		title: lang == 'en-ca' ? 'Geospatial Data Catalog' : 'Catalogue de données géospatiales'
	};
}
