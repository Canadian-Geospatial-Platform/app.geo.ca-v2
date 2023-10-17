const getSession = async function () {
	console.log('getSession');
	const ret = await fetch('/api/session', {
		headers: {
			Authorization: 'Bearer ' + sessionStorage.getItem('access_token')
		}
	})
		.then((response) => response.json())
		.then((data) => data)
		.catch((error) => console.error(error));
	return ret;
};

const putSession = async function (session) {
	console.log('putSession');
	const data = session;
	const ret = await fetch('/api/session', {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
			Authorization: 'Bearer ' + sessionStorage.getItem('access_token')
		},
		body: JSON.stringify(data)
	})
		.then((response) => response.json())
		.then((data) => data)
		.catch((error) => console.error(error));
	return ret;
};

export { putSession, getSession };
