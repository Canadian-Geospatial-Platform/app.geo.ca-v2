import { Bucket } from 'sst/node/bucket';
/** @satisfies {import('./$types').PageServerLoad} */
export const load = () => {
	console.log(
		'The bucket object should contain information on the bound bucket. instead it is an empty object: \n',
		Bucket
	);
};
