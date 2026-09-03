/**
 * Utility to format string into proper Title Case (capitalizes first letter of every word)
 * e.g., "lab pan mixer" -> "Lab Pan Mixer"
 *       "SOIL TESTING EQUIPMENT" -> "Soil Testing Equipment"
 *       "polarimeters & refractometers" -> "Polarimeters & Refractometers"
 */
export const formatTitleCase = (str) => {
  if (!str || typeof str !== "string") return "";

  // Minor connecting words that should remain lowercase unless at the start
  const minorWords = new Set(["and", "or", "for", "with", "in", "on", "at", "to", "by", "of", "the", "a", "an", "via"]);

  const words = str.trim().split(/\s+/);

  return words
    .map((word, index) => {
      // Handle words with punctuation/slashes/hyphens
      if (word.includes("-")) {
        return word
          .split("-")
          .map((sub) => (sub ? sub.charAt(0).toUpperCase() + sub.slice(1).toLowerCase() : ""))
          .join("-");
      }

      if (word.includes("/")) {
        return word
          .split("/")
          .map((sub) => (sub ? sub.charAt(0).toUpperCase() + sub.slice(1).toLowerCase() : ""))
          .join("/");
      }

      // If it's a known short acronym like ISO, NABL, ASTM, BIS, NDT, QA, QC, keep uppercase
      const upper = word.toUpperCase();
      if (["ISO", "NABL", "ASTM", "BIS", "NDT", "QA", "QC", "GST", "HSN", "ARCL", "PDF", "RPM", "CNC"].includes(upper)) {
        return upper;
      }

      const lower = word.toLowerCase();
      if (index !== 0 && minorWords.has(lower)) {
        return lower;
      }

      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
};

/**
 * Utility to capitalize only the very first letter of a sentence
 */
export const capitalizeFirstLetter = (str) => {
  if (!str || typeof str !== "string") return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};
