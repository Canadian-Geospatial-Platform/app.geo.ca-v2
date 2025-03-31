export const SUPPORTED_3D_TYPES = [
	'WMS',
	//'WMTS',
	'ESRI REST',
	//'OGCMAP',
	//'FEATURE',
	//'COVERAGE',
	//'CELESTIAL',
	//'SENSORTHINGS',
	//'GEOJSON',
	//'KML',
	//'3DTILES',
	//'COG',
	//'GPKG'
];

export function create3dRequestBody(properties: any, row: any): {} {
	switch (row['format']) {
		default:
			return {};
		case 'WMS':
			return {
				type: 'WMS',
				args: {
					uid: properties.id,
					capabilitiesUrl: row['url'],
					name: '',
					credit: '',
					serviceInfo: {
						serviceTitle: row['name'],
						serviceId: properties.id,
						serviceUrl: row['url']
					}
				}
			};
		case 'WMTS':
			return {};
		case 'ESRI REST':
			return {
				type: 'ARCGISWMS',
				args: {
					uid: properties.id,
					title: '',
					id: '',
					description: properties.description.en,
					url: row['url'],
					serviceInfo: {
						serviceTitle: row['name'],
						serviceId: properties.id,
						serviceUrl: row['url']
					},
					wgs84BoundingBox: {
						minX: properties.extent.west,
						minY: properties.extent.south,
						maxX: properties.extent.east,
						maxY: properties.extent.north
					},
					credit: ''
				}
			};
		case 'OGCMAP':
			return {};
		case 'FEATURE':
			return {};
		case 'COVERAGE':
			return {};
		case 'CELESTIAL':
			return {};
		case 'SENSORTHINGS':
			return {};
		case 'GEOJSON':
			return {};
		case 'KML':
			return {};
		case '3DTILES':
			return {};
		case 'COG':
			return {};
		case 'GPKG':
			return {};
	}
}
