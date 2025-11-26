import { json } from '@sveltejs/kit';
import { Config } from 'sst/node/config';

let GEOCORE_API_DOMAIN: string;
try {
	console.log('Reading values from sst/config/node.');
	GEOCORE_API_DOMAIN = Config.VITE_GEOCORE_API_DOMAIN;
} catch (e) {
	console.warn(
		'Error using values from sst/config/node, assuming the project is running locally and reading from .env.\n If this is not the case please ensure correct configuration of environment variables.'
	);
	GEOCORE_API_DOMAIN = import.meta.env.VITE_GEOCORE_API_DOMAIN;
}

export async function POST({ request }) {
	const { ids, lang } = await request.json();

	if (!Array.isArray(ids)) {
		return json({ error: 'Invalid IDs' }, { status: 400 });
	}

	const records = await getRecordsByIds(ids, lang);

	return json(records);
}

function getRecord(id, lang) {
	const url = new URL(`${GEOCORE_API_DOMAIN}/id/v2`);
	const params = {
		id: id,
		lang: lang.split('-')[0]
	};
	url.search = new URLSearchParams(params).toString();
	return fetch(url);
}

async function getRecordsByIds(idIterator, lang) {
	let promises = [];

	for (const id of idIterator) {
		promises.push(getRecord(id, lang));
	}

	const results = await Promise.all(promises);
	const values = [...results];

	let ret = await Promise.all(
		values.map(async (v) => {
			try {
				const contents = await v.json();
				if (contents?.body?.Items[0]) return contents.body.Items[0];
			} catch {
				(error) => console.log(error);
			}
		})
	);
	return ret;
}
