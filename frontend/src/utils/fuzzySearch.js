/**
 * High Precision Fuzzy & Typo-Tolerant Search Engine for ARCL Instruments
 */

/**
 * Phonetic Normalizer
 */
export const normalizePhonetic = (str = "") => {
  return String(str)
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/ph/g, "f")
    .replace(/sh/g, "s")
    .replace(/sch/g, "sk")
    .replace(/ck/g, "k")
    .replace(/c(?=[eiy])/g, "s")
    .replace(/c/g, "k")
    .replace(/q/g, "k")
    .replace(/x/g, "ks")
    .replace(/ee|ea|ey/g, "i")
    .replace(/oo|ou/g, "u")
    .replace(/y(?=\b)/g, "i")
    .replace(/(.)\1+/g, "$1") // duplicate letters: "compresion" <-> "compression"
    .trim();
};

/**
 * Levenshtein distance calculation
 */
export const getLevenshteinDistance = (a = "", b = "") => {
  const s1 = a.toLowerCase();
  const s2 = b.toLowerCase();

  const m = s1.length;
  const n = s2.length;

  if (m === 0) return n;
  if (n === 0) return m;

  const d = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + cost
      );
    }
  }

  return d[m][n];
};

/**
 * Strict single-word matching with >= 75% similarity or phonetic equality
 */
export const isWordMatch = (word = "", target = "") => {
  const w = word.toLowerCase().trim();
  const t = target.toLowerCase().trim();

  if (!w || !t) return false;
  if (w === t) return true;

  // Substring match if token length >= 3
  if (w.length >= 3 && t.includes(w)) return true;
  if (t.length >= 4 && w.includes(t)) return true;

  // Phonetic match
  const pW = normalizePhonetic(w);
  const pT = normalizePhonetic(t);
  if (pW && pT) {
    if (pW === pT) return true;
    if (pW.length >= 3 && pT.includes(pW)) return true;
    if (pT.length >= 3 && pW.includes(pT)) return true;
  }

  // Edit distance similarity check
  const maxLen = Math.max(w.length, t.length);
  if (maxLen <= 3) return false; // short words like "in", "to" must be exact

  const dist = getLevenshteinDistance(w, t);
  const similarity = 1 - dist / maxLen;

  // For words with length >= 4, allow similarity >= 0.75 (max 1 typo for 4-6 chars, 2 for 7-10 chars)
  if (similarity >= 0.72) return true;

  const pMaxLen = Math.max(pW.length, pT.length);
  if (pMaxLen >= 4) {
    const pDist = getLevenshteinDistance(pW, pT);
    if (1 - pDist / pMaxLen >= 0.72) return true;
  }

  return false;
};

/**
 * Fuzzy match full query string against title, category, equipment type
 */
export const fuzzyMatch = (query = "", targetText = "") => {
  const cleanQ = String(query).trim().toLowerCase();
  const cleanTarget = String(targetText).trim().toLowerCase();

  if (!cleanQ) return true;
  if (!cleanTarget) return false;

  // 1. Direct contains
  if (cleanTarget.includes(cleanQ)) return true;

  // 2. Direct phonetic contains
  const pQuery = normalizePhonetic(cleanQ);
  const pTarget = normalizePhonetic(cleanTarget);
  if (pTarget.includes(pQuery)) return true;

  // 3. Tokenize query
  const queryTokens = cleanQ.split(/\s+/).filter((t) => t.length > 1);
  const targetTokens = cleanTarget.split(/\s+/).filter((t) => t.length > 1);

  if (queryTokens.length === 0) return true;

  // Every token in query must match at least one word in target
  return queryTokens.every((qWord) => {
    return targetTokens.some((tWord) => isWordMatch(qWord, tWord));
  });
};
