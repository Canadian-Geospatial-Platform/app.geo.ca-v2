/**
 * Gets today's date in YYYY-MM-DD format.
 *
 * @returns Today's date as a string in YYYY-MM-DD format.
 */
export function getToday(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = `0${today.getMonth() + 1}`.slice(-2);
  const day = `0${today.getDate()}`.slice(-2);

  return `${year}-${month}-${day}`;
}
