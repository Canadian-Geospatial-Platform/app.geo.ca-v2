import { json } from '@sveltejs/kit';

export async function POST({ request }) {
  const { ids, lang } = await request.json();

  if (!Array.isArray(ids)) {
    return json({ error: 'Invalid IDs' }, { status: 400 });
  }

  const records = await getRecordsByIds(ids, lang);
  const idsWithLayers = await checkForMapLayers(ids, lang);

  // Update the record data with the following:
  //   (1) a list of resource formats
  //   (2) a boolean including if the resource has a map layer
  for (let record of records) {
    const formats = getFormats(record, lang);
    record.formats = formats;

    if (idsWithLayers.includes(record.id)) {
      record.hasMapLayer = true;
    } else {
      record.hasMapLayer = false;
    }
  }

  return json(records);
}

function getRecord(id, lang) {
	const url = new URL('https://geocore.api.geo.ca/id/v2');
	const params = {
		id: id,
		lang: lang.split('-')[0]
	};
	url.search = new URLSearchParams(params).toString();
	return fetch(url);
}

function getFormats(record, lang) {
  const options = record.options;

  // Get an array of just the format of each record option
  const formatArray = options.map((x) => {
    const description = x.description;
    const descriptionString = lang == 'fr' ? description.fr : description.en;
    const descriptionArray = descriptionString.split(';');

    // The description string is always in this format 'type;format;language',
    // so when splitting the string to an array, we can get the format by returning
    // the item in the second array index.
    return descriptionArray[1];
  });

  // Note: In the geocore records, the protocol is sometimes listed as the string 'null',
  // not just the value null, so we should check for the string to filer it out.
  // We can also check for 'undefined' as a string too for good measure.
  // Using indexOf allows us to check for duplicate values since it always returns the
  // first instance of the value being searched. If it doesn't match the current index,
  // then it must be a duplicate.
  const filteredFormats = formatArray.filter((x, index, self) => {
    return x && x !== 'null' && x != 'undefined' && self.indexOf(x) === index;
  });

  return filteredFormats;
}

// Query vcs to check if resources have map layers
async function checkForMapLayers(ids, lang) {
	const langShort = lang.split('-')[0];
	let filteredIds = [];

  // Set url search params
	const url = new URL('https://geocore.api.geo.ca/vcs');
	const params = {
		id: ids,
		lang: langShort,
		referrer: 'geo.ca',
	}
	url.search = new URLSearchParams(params).toString();

	try {
		// Get data
	  const response = await fetch(url);
	  const results = await response.json();

    // Get a list of ids with map layers. For resources with no map layers
	  const rcs = results.response.rcs;
	  const layersArray = rcs[langShort];
	  filteredIds = layersArray.map((result) => {
      // Since we are only checking if at least one layer exists,
      // we can stop at the first layer for each resource
      const layer = result.layers[0];
      const layerId = layer.id;

      // The rcs ids don't have the same format as the geocore ids, but
      // always contain the geocode id. For example an rcs layer id could look
      // like this: "rcs.03ccfb5c-a06e-43e3-80fd-09d4f8f69703.en". To get just the
      // geocore id, we can check with the includes method.
      for (const id of ids) {
        if (layerId.includes(id)) {
          return id;
        }
      }
	  });
	} catch (error) {
	  console.log(error);
	}

	return filteredIds;
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
