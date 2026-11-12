export const normalizeCustomerKey = (companyName) =>
  String(companyName || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

export const computeCustomerQrSignature = (companyName) => {
  const norm = normalizeCustomerKey(companyName);
  if (!norm) return "";
  const input = `ARCL-NABL-CC4313::${norm}`;
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 ^= ch;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= ch + (i + 1) * 31;
    h2 = Math.imul(h2, 0x85ebca6b);
  }
  const p1 = (h1 >>> 0).toString(16).padStart(8, "0");
  const p2 = (h2 >>> 0).toString(16).padStart(8, "0");
  return `${p1}${p2}`.slice(0, 12);
};

export const getPublicSiteBaseUrl = () => {
  let base =
    (typeof globalThis !== "undefined" &&
      (globalThis.process?.env?.NEXT_PUBLIC_SITE_URL ||
        globalThis.process?.env?.NEXT_PUBLIC_FRONTEND_URL)) ||
    "https://arclinstruments.com";
  if (typeof window !== "undefined" && window.location?.origin) {
    const host = window.location.hostname || "";
    const isLocalLoopback =
      host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0";
    if (!isLocalLoopback) {
      base = window.location.origin;
    }
  }
  return String(base).trim().replace(/\/+$/, "");
};

export const buildCustomerQrVerifyPath = ({ recordId, clientCompany } = {}) => {
  const params = new URLSearchParams();
  if (recordId && /^[a-f0-9]{24}$/i.test(String(recordId))) {
    params.set("cust", String(recordId));
  }
  const ck = computeCustomerQrSignature(clientCompany);
  if (ck) params.set("ck", ck);
  const qs = params.toString();
  return qs ? `/certificate-verify?${qs}` : "/certificate-verify";
};

export const buildCustomerQrVerifyUrl = (opts = {}) =>
  `${getPublicSiteBaseUrl()}${buildCustomerQrVerifyPath(opts)}`;
