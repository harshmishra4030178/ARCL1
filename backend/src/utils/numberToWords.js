/**
 * Convert number to Indian Currency words (Rupees and Paise)
 */
export function numberToIndianWords(num) {
  if (num === null || num === undefined || isNaN(num)) return "Zero Rupees Only";
  const n = Math.round(Number(num));
  if (n === 0) return "Zero Rupees Only";
  if (n < 0) return "Minus " + numberToIndianWords(Math.abs(n));

  const units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function convertTwoDigits(val) {
    if (val < 20) return units[val];
    const t = Math.floor(val / 10);
    const u = val % 10;
    return tens[t] + (u ? " " + units[u] : "");
  }

  function convertThreeDigits(val) {
    const h = Math.floor(val / 100);
    const rest = val % 100;
    let res = "";
    if (h > 0) {
      res += units[h] + " Hundred";
      if (rest > 0) res += " and ";
    }
    if (rest > 0) {
      res += convertTwoDigits(rest);
    }
    return res;
  }

  const crore = Math.floor(n / 10000000);
  let rem = n % 10000000;
  const lakh = Math.floor(rem / 100000);
  rem = rem % 100000;
  const thousand = Math.floor(rem / 1000);
  rem = rem % 1000;
  const hundredAndRest = rem;

  let words = "";

  if (crore > 0) {
    words += convertTwoDigits(crore) + " Crore ";
  }
  if (lakh > 0) {
    words += convertTwoDigits(lakh) + " Lakh ";
  }
  if (thousand > 0) {
    words += convertTwoDigits(thousand) + " Thousand ";
  }
  if (hundredAndRest > 0) {
    words += convertThreeDigits(hundredAndRest);
  }

  return (words.trim() + " Rupees Only").replace(/\s+/g, " ");
}
