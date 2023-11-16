function sanitize(results) {
	let truthyResults = results.filter((e) => e);
	return fixCoordinatesType(truthyResults);
}

function fixCoordinatesType(results) {
	results.forEach((e) => {
		e.coordinates = JSON.parse(e.coordinates);
	});
	return results;
}

export { sanitize };
