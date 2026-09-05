/**
 * Lightweight User-Agent and client hints parser to accurately identify
 * device type, operating system, and browser without bulky external packages.
 */
export function parseUserAgent(uaString = "", clientDevice = "") {
  const ua = uaString.toLowerCase();

  // If client explicitly reported device from window/screen, respect it if valid
  if (["mobile", "tablet", "desktop"].includes(clientDevice)) {
    // Client device confirmed
  }

  // 1. DEVICE TYPE DETECTION
  let device = "desktop";
  if (
    /ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk/i.test(
      ua
    )
  ) {
    device = "tablet";
  } else if (
    /mobile|iphone|ipod|android.*mobile|blackberry|bb10|phone|opera mini|iemobile/i.test(
      ua
    )
  ) {
    device = "mobile";
  }

  // If client provided explicit hint and it matches tablet/mobile characteristics
  if (clientDevice && ["mobile", "tablet", "desktop"].includes(clientDevice)) {
    device = clientDevice;
  }

  // 2. OPERATING SYSTEM DETECTION
  let os = "Other";
  if (/windows nt 10\.0|windows nt 11\.0/i.test(ua)) os = "Windows 10/11";
  else if (/windows/i.test(ua)) os = "Windows";
  else if (/android/i.test(ua)) os = "Android";
  else if (/iphone|ipad|ipod/i.test(ua)) os = "iOS";
  else if (/macintosh|mac os x/i.test(ua)) os = "macOS";
  else if (/linux/i.test(ua)) os = "Linux";
  else if (/cros/i.test(ua)) os = "ChromeOS";

  // 3. BROWSER DETECTION
  let browser = "Other";
  if (/edg\//i.test(ua)) browser = "Edge";
  else if (/opr\/|opera/i.test(ua)) browser = "Opera";
  else if (/chrome|crios/i.test(ua) && !/edg/i.test(ua)) browser = "Chrome";
  else if (/safari/i.test(ua) && !/chrome|crios|android/i.test(ua))
    browser = "Safari";
  else if (/firefox|fxios/i.test(ua)) browser = "Firefox";
  else if (/msie|trident/i.test(ua)) browser = "Internet Explorer";

  return { device, os, browser };
}
