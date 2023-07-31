export const load = async ({ fetch, params }) => {
	const response = await fetch(
		'https://geocore.api.geo.ca/geo?north=69.8698915662856&east=44.6484375&south=46.01222384063236&west=-180&keyword=&lang=fr&min=1&max=10&sort=title'
	);
	return {
		lang: params.lang,
		results: await response.json()
	};
};
