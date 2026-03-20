/**
 * URL-encodes an object of key-value pairs.
 *
 * @param data - The data object to be URL-encoded.
 * @returns The URL-encoded string.
 */
export function urlEncode(data: Record<string, any>): string {
  const formBody: string[] = [];
  for (const property in data) {
    const encodedKey = encodeURIComponent(property);
    const encodedValue = encodeURIComponent(data[property]);
    formBody.push(encodedKey + '=' + encodedValue);
  }
  const formBodyString = formBody.join('&');
  return formBodyString;
}
