import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { Config } from 'sst/node/config';

const COGNITO_USERPOOL_ID = Config.COGNITO_USERPOOL_ID;

const verifier = CognitoJwtVerifier.create({
	userPoolId: COGNITO_USERPOOL_ID ,
	tokenUse: 'access',
	clientId: Config.OIDC_CLIENT_ID
});

const getToken = async (cookies) => {
	let access_token = cookies.get('access_token');

	try {
		const payload = await verifier.verify(access_token);
		console.log('Token is valid.');
		return { ok: true, value: payload };
	} catch {
		cookies.delete('access_token', { path: '/' });
		cookies.delete('id_token', { path: '/' });
		cookies.delete('refresh_token', { path: '/' });
		console.log('Token not valid! Deleting token cookies.');
		return { ok: false };
	}
};

export { getToken };
