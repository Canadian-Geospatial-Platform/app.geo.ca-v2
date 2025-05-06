import { json } from '@sveltejs/kit';

export async function POST({ request }) {
  const { ids, lang } = await request.json();

  if (!Array.isArray(ids)) {
    return json({ error: 'Invalid IDs' }, { status: 400 });
  }

  const records = await getRecordsByIds(ids, lang);

  return json(records);
}

function getRecord(id, lang) {
	const url = new URL('https://geocore.api.geo.ca/id');
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
				if (contents.Items[0]) return contents.Items[0];
			} catch {
				(error) => console.log(error);
			}
		})
	);
	return ret;
}
