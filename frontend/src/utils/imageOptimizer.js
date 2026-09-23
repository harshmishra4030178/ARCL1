/**
 * Image Optimization Utility for ARCL Instruments
 *
 * Automatically injects responsive widths, modern formats (WebP/AVIF),
 * and automatic compression quality parameters into CDN URLs.
 */

export function getOptimizedImageUrl(url, { width = 280, quality = "auto" } = {}) {
  if (!url || typeof url !== "string") return url;

  // Optimize Cloudinary URLs
  if (url.includes("res.cloudinary.com") && url.includes("/upload/")) {
    const uploadIdx = url.indexOf("/upload/");
    const afterUpload = url.slice(uploadIdx + 8);

    // If there's an existing version tag (e.g. v1789032089/...) strip any prior transformation
    const versionMatch = afterUpload.match(/v\d+\//);
    const pathAfterVersion = versionMatch ? afterUpload.slice(versionMatch.index) : afterUpload;

    const transform = `f_auto,q_${quality},w_${width},c_limit/`;
    return `${url.slice(0, uploadIdx + 8)}${transform}${pathAfterVersion}`;
  }

  // Optimize Unsplash images
  if (url.includes("images.unsplash.com")) {
    const cleanUrl = url.split("?")[0];
    return `${cleanUrl}?auto=format&fit=crop&q=80&w=${width}`;
  }

  return url;
}
