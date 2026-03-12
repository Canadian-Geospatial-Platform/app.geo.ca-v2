/**
 * Gets today's date in YYYY-MM-DD format.
 *
 * @returns Today's date as a string in YYYY-MM-DD format.
 */
export function getToday(): string {
	let today = new Date();
	let year = today.getFullYear();
	let month = ('0' + (today.getMonth() + 1)).slice(-2);
	let day = ('0' + today.getDate()).slice(-2);

	return year + '-' + month + '-' + day;
}
