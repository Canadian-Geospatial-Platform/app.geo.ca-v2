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
			r.title = r['title_' + lang.split('-')[0]];
			r.description = r['title_' + lang.split('-')[0]];
		} catch (e) {
			console.warn('error normalizing data: \n', e);
		}
	}
	return records;
}

export { sanitize };
