function sanitize(results, lang) {
	let truthyResults = results.filter((e) => e);
	let fixedCoordsResults = fixCoordinatesType(truthyResults);
	let normalizedLanguagedResults = normaliseLangage(fixedCoordsResults, lang);
	return normalizedLanguagedResults;
}

function fixCoordinatesType(results) {
	results.forEach((e) => {
		e.coordinates = JSON.parse(e.coordinates);
	});
	return results;
}

function normaliseLangage(records, lang) {
	for (const r of records) {
		try {
			let t = r?.['title_' + lang.split('-')[0]];
			if (t) {
				r.title = t;
			}
			let d = r?.['title_' + lang.split('-')[0]];
			if (d) {
				r.description = d;
			}
		} catch (e) {
			console.warn('error normalizing data: \n', r);
		}
	}
	return records;
}

export { sanitize };
