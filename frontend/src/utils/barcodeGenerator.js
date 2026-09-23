/**
 * Standard ISO/IEC 15417 Code-128 Barcode Generator
 * Generates mathematically valid, 100% scannable 1D barcode patterns.
 */

// Code-128 pattern table (107 patterns)
const CODE128_PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213", // 0-9
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132", // 10-19
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211", // 20-29
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313", // 30-39
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331", // 40-49
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111", // 50-59
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214", // 60-69
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111", // 70-79
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141", // 80-89
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141", // 90-99
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112" // 100-106
];

/**
 * Encodes text into a series of 1 (bar) and 0 (space) binary modules
 * using Code-128 Subset B.
 * @param {string} text 
 * @returns {Array<{ isBar: boolean, width: number }>}
 */
export const encodeCode128B = (text) => {
  if (!text) text = "ARCL-SPEC";
  const clean = text.trim().substring(0, 30);

  // Start with Start Code B (104)
  const symbols = [104];
  let checkSum = 104;

  for (let i = 0; i < clean.length; i++) {
    const code = clean.charCodeAt(i) - 32;
    const validCode = Math.max(0, Math.min(code, 95));
    symbols.push(validCode);
    checkSum += validCode * (i + 1);
  }

  // Check character
  const checkChar = checkSum % 103;
  symbols.push(checkChar);

  // Stop character (106)
  symbols.push(106);

  // Convert symbol indices into alternating bar & space modules
  const modules = [];
  symbols.forEach((symIndex) => {
    const pattern = CODE128_PATTERNS[symIndex] || "212222";
    for (let p = 0; p < pattern.length; p++) {
      const width = parseInt(pattern[p], 10);
      const isBar = p % 2 === 0;
      modules.push({ isBar, width });
    }
  });

  return modules;
};

/**
 * Returns a high-density QR code URL for a given product or destination.
 */
export const getProductQrUrl = (slugOrUrl, size = 300) => {
  const fullUrl = slugOrUrl?.startsWith("http")
    ? slugOrUrl
    : `https://arclinstruments.com/products/${slugOrUrl || "catalog"}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=1&data=${encodeURIComponent(
    fullUrl
  )}`;
};
