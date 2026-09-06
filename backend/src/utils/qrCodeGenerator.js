import QRCode from "qrcode";

/**
 * Get the base frontend URL for product redirects.
 */
export const getFrontendBaseUrl = () => {
  let url = process.env.FRONTEND_URL || process.env.CLIENT_URL || "https://arcl-i34s.vercel.app";
  return url.replace(/\/+$/, ""); // strip trailing slash
};

/**
 * Generate a unique, high-resolution QR Code Data URL for a product.
 * The QR code encodes the direct canonical URL to the product's details page.
 * 
 * @param {string} slug - Permanent product slug
 * @param {string} [customBaseUrl] - Optional base URL override
 * @returns {Promise<{ qrCode: string, productUrl: string }>}
 */
export const generateProductQrCode = async (slug, customBaseUrl = "") => {
  if (!slug || !String(slug).trim()) {
    throw new Error("Product slug is required for QR code generation.");
  }

  const baseUrl = (customBaseUrl && customBaseUrl.trim()) || getFrontendBaseUrl();
  const productUrl = `${baseUrl}/products/${encodeURIComponent(String(slug).trim())}`;

  // High-performance, crisp QR code with error correction level M and ARCL brand styling
  const qrCodeDataUrl = await QRCode.toDataURL(productUrl, {
    errorCorrectionLevel: "M",
    type: "image/png",
    margin: 2,
    scale: 8,
    color: {
      dark: "#021C57", // ARCL Signature Navy Blue
      light: "#FFFFFF",
    },
  });

  return {
    qrCode: qrCodeDataUrl,
    productUrl,
  };
};
