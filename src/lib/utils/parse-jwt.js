// todo: might need to be changed to take into account front end and back end context. (atob does not exist in node context)
const parseJwt = function (unparsedToken) {
	return JSON.parse(Buffer.from(unparsedToken.split('.')[1], 'base64').toString());
};

export { parseJwt };
