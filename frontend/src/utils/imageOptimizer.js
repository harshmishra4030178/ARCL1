/**
 * Image Optimization Utility for ARCL Instruments
 *
 * Automatically injects responsive widths, modern formats (WebP/AVIF),
 * and automatic compression quality parameters into CDN URLs.
 */

export function getOptimizedImageUrl(url, { width = 400, quality = "auto" } = {}) {
  if (!url || typeof url !== "string") return url;

  // Optimize Cloudinary URLs
  if (url.includes("res.cloudinary.com") && url.includes("/upload/")) {
    // If it already has transformation parameters, don't duplicate
    if (
      url.includes("/upload/f_auto") ||
      url.includes("/upload/w_") ||
      url.includes("/upload/q_") ||
      url.includes("/upload/c_")
    ) {
      return url;
    }
    const transform = `f_auto,q_${quality},w_${width},c_limit/`;
    return url.replace("/upload/", `/upload/${transform}`);
  }

  // Optimize Unsplash images
  if (url.includes("images.unsplash.com")) {
    const cleanUrl = url.split("?")[0];
    return `${cleanUrl}?auto=format&fit=crop&q=80&w=${width}`;
  }

  return url;
}
