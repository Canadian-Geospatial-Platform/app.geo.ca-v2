// To conform with the Canada.ca Content Style Guide large numbers should be
// comma separated every 3-digits e.g. 1,154 instead of 1154
export const formatNumber = function(num) {

  if ((typeof num) === 'number') {
    num = num.toLocaleString();
  } else if ((typeof num) === 'string') {
    num = Number.parseFloat(num).toLocaleString();
  }

  return num;
}
