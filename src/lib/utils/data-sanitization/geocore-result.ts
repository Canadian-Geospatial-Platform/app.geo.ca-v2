function sanitize(results) {
	fixCoordinatesType(results);
}

function fixCoordinatesType(parsedResponse) {
	parsedResponse.Items.forEach((e) => {
		e.coordinates = JSON.parse(e.coordinates);
	});
}

export { sanitize };
