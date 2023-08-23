const jwtIsValid = function (jwt) {
	if (
		!jwt?.id_token ||
		!jwt?.access_token ||
		!jwt?.refresh_token ||
		!jwt?.expires_in ||
		!jwt?.token_type
	) {
		return false;
	}
	return true;
};

export { jwtIsValid };
