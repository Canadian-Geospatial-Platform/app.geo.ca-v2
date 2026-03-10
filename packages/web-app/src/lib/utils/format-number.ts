/**
 * Formats a number by adding comma separators for thousands.
 *
 * To conform with the Canada.ca Content Style Guide large numbers should be
 * formatted with a comma separator every three digits.
 *
 * @param num - The number to format.
 * @returns The formatted number as a string.
 */
export const formatNumber = function (num: string | number): string {
	if (typeof num === 'number') {
		num = num.toLocaleString();
	} else if (typeof num === 'string') {
		num = Number.parseFloat(num).toLocaleString();
	}

	return num;
};
