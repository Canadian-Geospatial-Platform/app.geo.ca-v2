const urlEncode = function (data) {
	var formBody = [];
	for (var property in data) {
		var encodedKey = encodeURIComponent(property);
		var encodedValue = encodeURIComponent(data[property]);
		formBody.push(encodedKey + '=' + encodedValue);
	}
	const formBodyString = formBody.join('&');
	return formBodyString;
};

export { urlEncode };
