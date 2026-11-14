import { jsPDF } from "jspdf";
import QRCode from "qrcode";

export const ENVELOPE_SPECS = {
  widthCm: 28,
  heightCm: 12.4,
  widthMm: 280,
  heightMm: 124,
  qrSizeCm: 3.2,
  qrSizeMm: 32,
  orientation: "landscape",
};

export const ENVELOPE_PRESETS = [
  {
    id: "custom_arcl",
    label: "ARCL Standard (280 × 124 mm)",
    widthMm: 280,
    heightMm: 124,
    widthCm: 28.0,
    heightCm: 12.4,
    description: "Official ARCL Custom Envelope",
  },
  {
    id: "dl",
    label: "DL Commercial (220 × 110 mm)",
    widthMm: 220,
    heightMm: 110,
    widthCm: 22.0,
    heightCm: 11.0,
    description: "Standard Business Envelope (1/3 A4)",
  },
  {
    id: "c5",
    label: "C5 Medium (229 × 162 mm)",
    widthMm: 229,
    heightMm: 162,
    widthCm: 22.9,
    heightCm: 16.2,
    description: "Fits folded A4 (A5 size)",
  },
  {
    id: "c4",
    label: "C4 Large (324 × 229 mm)",
    widthMm: 324,
    heightMm: 229,
    widthCm: 32.4,
    heightCm: 22.9,
    description: "Full A4 Unfolded Sheets",
  },
  {
    id: "c6_5",
    label: "C6/C5 Standard (229 × 114 mm)",
    widthMm: 229,
    heightMm: 114,
    widthCm: 22.9,
    heightCm: 11.4,
    description: "General Mailing Envelope",
  },
  {
    id: "no10",
    label: "#10 Business (241 × 105 mm)",
    widthMm: 241,
    heightMm: 105,
    widthCm: 24.1,
    heightCm: 10.5,
    description: "Standard #10 Commercial Envelope",
  },
  {
    id: "custom",
    label: "Custom Dimensions (Specify W × H)",
    widthMm: 280,
    heightMm: 124,
    widthCm: 28.0,
    heightCm: 12.4,
    description: "Enter any width & height in mm",
  },
];

export const DEFAULT_ENVELOPE_CONFIG = {
  headerCompanyName: "ARCL INSTRUMENTS PRIVATE LIMITED",
  headerSubtitle: "NABL Accredited Calibration Laboratory (CC-4313) • ISO/IEC 17025:2017",
  headerAddress: "Shop No. 6, Siddhivinayak Park CHS, Sector 8A, Airoli, Navi Mumbai - 400708, Maharashtra • GSTIN: 27AATCA7874C1ZB",
  phone: "+91 81696 95728",
  email: "info@arclinstruments.com",
  emailPrimary: "info@arclinstruments.com",
  emailSecondary: "arclinstruments@gmail.com",
  website: "https://arclinstruments.com/",
  showHeaderSubtitle: true,
  fromCompanyName: "ARCL INSTRUMENTS",
  address: "Shop No. 6, Siddhivinayak Park CHS, Sector-8A, Airoli, Navi Mumbai, Maharashtra 400708, India",
  footerServices: [
    "Calibration",
    "Manufacturing",
    "Sales",
    "Service",
    "Spares",
  ],
  footerThankYouTitle: "Thank You for Choosing ARCL Instruments! We Greatly Value Your Trust & Association.",
  footerThankYouSubtitle: "For any new requirements, calibration, servicing, spares, or technical support, please feel free to contact us.",
  backgroundTheme: "classic_white", // 'classic_white' (Original) | 'amber_emerald_vibrant' | 'amber_emerald_soft' | 'custom'
  customBgMode: "gradient", // 'gradient' | 'solid'
  customColorStart: "#F59E0B",
  customColorEnd: "#10B981",
  customColorSolid: "#FFFFFF",
};

/**
 * Parses 3 or 6 hex digits into RGB object for jsPDF fill rendering
 */
export const hexToRgb = (hex, fallback = { r: 255, g: 255, b: 255 }) => {
  if (!hex || typeof hex !== "string") return fallback;
  let c = hex.replace("#", "").trim();
  if (c.length === 3) {
    c = c.split("").map((ch) => ch + ch).join("");
  }
  if (c.length !== 6) return fallback;
  const num = parseInt(c, 16);
  if (isNaN(num)) return fallback;
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
};

/**
 * Computes perceived luminance (0 - 255) of a hex color
 */
export const getHexLuminance = (hex, fallback = 255) => {
  const rgb = hexToRgb(hex, null);
  if (!rgb) return fallback;
  return 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
};

/**
 * Curated Preset Themes for Envelope Backgrounds (Classic White, Button Style, Pastels, and Executive Gradients)
 */
export const BACKGROUND_THEMES = [
  {
    id: "classic_white",
    category: "standard",
    title: "Classic Pure White (Pehle Wala)",
    subtitle: "Original standard design with faint ARCL logo watermark",
    type: "white",
    gradientCss: "#ffffff",
    badge: "Pehle Wala / Standard",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-300",
  },
  {
    id: "amber_emerald_vibrant",
    category: "vibrant",
    title: "Amber → Emerald Gradient",
    subtitle: "Vibrant button gradient (#F59E0B → #10B981)",
    type: "gradient_multi",
    gradientCss: "linear-gradient(90deg, #F59E0B 0%, #84CC16 45%, #10B981 100%)",
    badge: "Punch-In Style",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
  },
  {
    id: "amber_emerald_soft",
    category: "ink_saver",
    title: "Soft Pastel Amber-Emerald",
    subtitle: "Light ink-saver pastel tint for office printing",
    type: "gradient",
    startColor: "#FEF3C7",
    endColor: "#D1FAE5",
    gradientCss: "linear-gradient(90deg, #FEF3C7 0%, #ECFCCB 45%, #D1FAE5 100%)",
    badge: "Ink Saver",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
  },
  {
    id: "executive_navy_cyan",
    category: "executive",
    title: "Executive Royal Navy → Sky Cyan",
    subtitle: "ARCL signature corporate navy & sky cyan",
    type: "gradient",
    startColor: "#021C57",
    endColor: "#0284C7",
    gradientCss: "linear-gradient(90deg, #021C57 0%, #0284C7 100%)",
    badge: "Corporate Elite",
    badgeClass: "bg-sky-100 text-sky-800 border-sky-300",
  },
  {
    id: "nabl_emerald_mint",
    category: "executive",
    title: "NABL Laboratory Emerald → Mint",
    subtitle: "Deep calibration lab green & precision mint",
    type: "gradient",
    startColor: "#064E3B",
    endColor: "#10B981",
    gradientCss: "linear-gradient(90deg, #064E3B 0%, #10B981 100%)",
    badge: "Lab Special",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
  },
  {
    id: "imperial_purple_violet",
    category: "vibrant",
    title: "Imperial Royal Purple → Violet",
    subtitle: "Prestigious deep violet luxury presentation",
    type: "gradient",
    startColor: "#4C1D95",
    endColor: "#8B5CF6",
    gradientCss: "linear-gradient(90deg, #4C1D95 0%, #8B5CF6 100%)",
    badge: "Royal Luxury",
    badgeClass: "bg-purple-100 text-purple-800 border-purple-300",
  },
  {
    id: "sunset_crimson_coral",
    category: "vibrant",
    title: "Sunset Crimson → Vibrant Coral",
    subtitle: "Warm energetic gradient from crimson to coral",
    type: "gradient",
    startColor: "#9F1239",
    endColor: "#FB923C",
    gradientCss: "linear-gradient(90deg, #9F1239 0%, #FB923C 100%)",
    badge: "Warm Vibrant",
    badgeClass: "bg-rose-100 text-rose-800 border-rose-300",
  },
  {
    id: "champagne_gold_bronze",
    category: "executive",
    title: "Champagne Gold → Metallic Bronze",
    subtitle: "Prestigious warm gold & bronze executive theme",
    type: "gradient",
    startColor: "#78350F",
    endColor: "#F59E0B",
    gradientCss: "linear-gradient(90deg, #78350F 0%, #F59E0B 100%)",
    badge: "Gold Edition",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
  },
  {
    id: "ocean_teal_marine",
    category: "executive",
    title: "Deep Ocean Teal → Marine Cyan",
    subtitle: "Fresh modern scientific calibration teal",
    type: "gradient",
    startColor: "#0F766E",
    endColor: "#06B6D4",
    gradientCss: "linear-gradient(90deg, #0F766E 0%, #06B6D4 100%)",
    badge: "Tech Modern",
    badgeClass: "bg-teal-100 text-teal-800 border-teal-300",
  },
  {
    id: "charcoal_slate_silver",
    category: "executive",
    title: "Charcoal Slate → Platinum Silver",
    subtitle: "High-contrast sleek monochrome corporate look",
    type: "gradient",
    startColor: "#1E293B",
    endColor: "#64748B",
    gradientCss: "linear-gradient(90deg, #1E293B 0%, #64748B 100%)",
    badge: "Sleek Carbon",
    badgeClass: "bg-slate-200 text-slate-800 border-slate-400",
  },
  {
    id: "pastel_glacier_sky",
    category: "ink_saver",
    title: "Glacier Ice → Sky Mist (Ink Saver)",
    subtitle: "Ultra-light cooling pastel for economical office printing",
    type: "gradient",
    startColor: "#E0F2FE",
    endColor: "#E0E7FF",
    gradientCss: "linear-gradient(90deg, #E0F2FE 0%, #E0E7FF 100%)",
    badge: "Ink Saver",
    badgeClass: "bg-sky-100 text-sky-800 border-sky-300",
  },
  {
    id: "pastel_rose_peach",
    category: "ink_saver",
    title: "Soft Rose → Peach Blossom (Ink Saver)",
    subtitle: "Gentle warm tint keeping printer ink usage minimal",
    type: "gradient",
    startColor: "#FFE4E6",
    endColor: "#FFEDD5",
    gradientCss: "linear-gradient(90deg, #FFE4E6 0%, #FFEDD5 100%)",
    badge: "Ink Saver",
    badgeClass: "bg-pink-100 text-pink-800 border-pink-300",
  },
  {
    id: "custom",
    category: "custom",
    title: "Custom (Apne Hisab Se Color / Gradient)",
    subtitle: "Pick any 2-color gradient or solid single color",
    type: "custom",
    badge: "Full Control",
    badgeClass: "bg-purple-100 text-purple-800 border-purple-300",
  },
];

/**
 * Computes proportional width/height and centered x/y offset to fit an image
 * strictly inside a bounding box without stretching, distorting, or cropping.
 */
export const computeAspectFitBox = (imgWidth, imgHeight, boxX, boxY, boxW, boxH) => {
  const w = Number(imgWidth) || 0;
  const h = Number(imgHeight) || 0;
  if (w <= 0 || h <= 0) {
    return { x: boxX, y: boxY, width: boxW, height: boxH };
  }
  const scale = Math.min(boxW / w, boxH / h);
  const drawW = w * scale;
  const drawH = h * scale;
  return {
    x: boxX + (boxW - drawW) / 2,
    y: boxY + (boxH - drawH) / 2,
    width: drawW,
    height: drawH,
  };
};

export const generateCustomerEnvelopeQrPng = async (verifyUrl) => {
  if (!verifyUrl) return null;
  const dataUrl = await QRCode.toDataURL(verifyUrl, {
    errorCorrectionLevel: "H",
    width: 340,
    margin: 1,
    color: { dark: "#021C57", light: "#ffffff" },
  });
  return {
    dataUrl,
    width: 340,
    height: 340,
    fileName: "Customer_Envelope_QR.png",
    fileSizeKb: Math.max(1, Math.round((dataUrl.length * 3) / 4 / 1024)),
  };
};

export const loadImageDetails = (src) =>
  new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }
    if (typeof src === "string" && src.startsWith("data:image/")) {
      resolve({
        dataUrl: src,
        width: 320,
        height: 180,
      });
      return;
    }
    if (typeof window === "undefined") {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve({
          dataUrl: canvas.toDataURL("image/png"),
          width: canvas.width,
          height: canvas.height,
        });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });

/**
 * Generates an exact 280 mm x 124 mm (28 cm x 12.4 cm) landscape print-ready PDF.
 * When `recipient` is omitted/empty, TO stays completely blank for handwritten addressing.
 * When `recipient` is provided, customer Name, Contact, Address & Phone auto-fill cleanly.
 */
export const buildEnvelopePdfDocument = async ({
  config = DEFAULT_ENVELOPE_CONFIG,
  recipient = null,
  qrImage = null,
  envelopeSize = null,
  widthMm: paramWidthMm = null,
  heightMm: paramHeightMm = null,
  logoSrc = "/assets/LOGO.png",
  fallbackLogoSrc = "/assets/cert_assets/arcl_logo.png",
  watermarkSrc = "/assets/cert_assets/arcl_watermark.png",
  iconPhoneSrc = "/assets/cert_assets/icon_phone.png",
  iconMailSrc = "/assets/cert_assets/icon_mail.png",
  iconWebSrc = "/assets/cert_assets/icon_web.png",
} = {}) => {
  const widthMm = Number(
    paramWidthMm ||
      envelopeSize?.widthMm ||
      config?.widthMm ||
      ENVELOPE_SPECS.widthMm
  );
  const heightMm = Number(
    paramHeightMm ||
      envelopeSize?.heightMm ||
      config?.heightMm ||
      ENVELOPE_SPECS.heightMm
  );
  const scaleRatio = Math.min(1.25, Math.max(0.72, widthMm / 280));
  const qrSizeMm = Math.min(32, Math.max(20, heightMm * 0.25));

  const doc = new jsPDF({
    orientation: widthMm >= heightMm ? "landscape" : "portrait",
    unit: "mm",
    format: [widthMm, heightMm],
    compress: true,
    putOnlyUsedFonts: true,
  });

  // Background Rendering: Amber-Emerald Gradient, Soft Pastel, Custom, or Classic White
  const theme = config.backgroundTheme || "classic_white";
  const themeObj = BACKGROUND_THEMES.find((t) => t.id === theme) || null;
  const isThemeWhite =
    theme === "classic_white" ||
    (theme === "custom" &&
      config.customBgMode === "solid" &&
      String(config.customColorSolid || "").trim().toLowerCase() === "#ffffff");

  if (theme === "amber_emerald_vibrant") {
    // Smooth Amber-Lime-Emerald vector gradient (from user button colors: #F59E0B to #10B981)
    for (let x = 0; x < widthMm; x += 0.5) {
      const t = x / widthMm;
      let r, g, b;
      if (t < 0.45) {
        const t2 = t / 0.45;
        r = Math.round(245 + (132 - 245) * t2);
        g = Math.round(158 + (204 - 158) * t2);
        b = Math.round(11 + (22 - 11) * t2);
      } else {
        const t2 = (t - 0.45) / 0.55;
        r = Math.round(132 + (16 - 132) * t2);
        g = Math.round(204 + (185 - 204) * t2);
        b = Math.round(22 + (129 - 22) * t2);
      }
      doc.setFillColor(r, g, b);
      doc.rect(x, 0, 0.6, heightMm, "F");
    }
  } else if (theme === "amber_emerald_soft") {
    // Soft Pastel Ink-Saver gradient
    for (let x = 0; x < widthMm; x += 0.5) {
      const t = x / widthMm;
      let r, g, b;
      if (t < 0.5) {
        const t2 = t * 2;
        r = Math.round(254 + (236 - 254) * t2);
        g = Math.round(243 + (252 - 243) * t2);
        b = Math.round(199 + (203 - 199) * t2);
      } else {
        const t2 = (t - 0.5) * 2;
        r = Math.round(236 + (209 - 236) * t2);
        g = Math.round(252 + (250 - 252) * t2);
        b = Math.round(203 + (229 - 203) * t2);
      }
      doc.setFillColor(r, g, b);
      doc.rect(x, 0, 0.6, heightMm, "F");
    }
  } else if (theme === "custom") {
    const isSolid = config.customBgMode === "solid";
    if (isSolid) {
      const rgb = hexToRgb(config.customColorSolid || "#FFFFFF");
      doc.setFillColor(rgb.r, rgb.g, rgb.b);
      doc.rect(0, 0, widthMm, heightMm, "F");
    } else {
      const startRgb = hexToRgb(config.customColorStart || "#F59E0B");
      const endRgb = hexToRgb(config.customColorEnd || "#10B981");
      for (let x = 0; x < widthMm; x += 0.5) {
        const t = x / widthMm;
        const r = Math.round(startRgb.r + (endRgb.r - startRgb.r) * t);
        const g = Math.round(startRgb.g + (endRgb.g - startRgb.g) * t);
        const b = Math.round(startRgb.b + (endRgb.b - startRgb.b) * t);
        doc.setFillColor(r, g, b);
        doc.rect(x, 0, 0.6, heightMm, "F");
      }
    }
  } else if (themeObj?.startColor && themeObj?.endColor) {
    // 2-stop linear gradient for any preset in BACKGROUND_THEMES
    const startRgb = hexToRgb(themeObj.startColor);
    const endRgb = hexToRgb(themeObj.endColor);
    for (let x = 0; x < widthMm; x += 0.5) {
      const t = x / widthMm;
      const r = Math.round(startRgb.r + (endRgb.r - startRgb.r) * t);
      const g = Math.round(startRgb.g + (endRgb.g - startRgb.g) * t);
      const b = Math.round(startRgb.b + (endRgb.b - startRgb.b) * t);
      doc.setFillColor(r, g, b);
      doc.rect(x, 0, 0.6, heightMm, "F");
    }
  } else {
    // Classic white background across full canvas
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, widthMm, heightMm, "F");
  }

  // Load branding assets concurrently
  const [logoImg, watermarkImg, phIconImg, mailIconImg, webIconImg] = await Promise.all([
    (async () => {
      let l = await loadImageDetails(fallbackLogoSrc || logoSrc);
      if (!l && logoSrc) l = await loadImageDetails(logoSrc);
      return l;
    })(),
    loadImageDetails(watermarkSrc),
    loadImageDetails(iconPhoneSrc),
    loadImageDetails(iconMailSrc),
    loadImageDetails(iconWebSrc),
  ]);

  // 1. FAINT BACKGROUND WATERMARK (Centered behind TO writing area - on classic white envelopes)
  if (isThemeWhite && watermarkImg?.dataUrl) {
    const wmW = Math.min(138, widthMm * 0.52);
    const wmH = wmW * (79 / 138);
    const wmX = (widthMm - wmW) / 2;
    const wmY = Math.max(26, (heightMm - wmH) / 2 - 3);
    doc.addImage(watermarkImg.dataUrl, "PNG", wmX, wmY, wmW, wmH, undefined, "FAST");
  }

  // Brand top bars (Dark Navy + Orange corporate accent)
  doc.setFillColor(2, 28, 87);
  doc.rect(0, 0, widthMm, 3.2, "F");
  doc.setFillColor(245, 130, 32);
  doc.rect(0, 3.2, widthMm, 0.9, "F");

  // Header Logo + 4-Line Company Header (Matching User Request)
  const marginX = Math.min(12, widthMm * 0.05);
  const headerBottomY = Math.min(27.5, heightMm * 0.23);

  // Perceived background luminance to ensure high contrast text on both dark & light backgrounds
  let headerLum = 255;
  let footerLum = 255;
  if (theme === "amber_emerald_vibrant") {
    headerLum = 167;
    footerLum = 150;
  } else if (theme === "custom") {
    if (config.customBgMode === "solid") {
      const lum = getHexLuminance(config.customColorSolid || "#FFFFFF");
      headerLum = lum;
      footerLum = lum;
    } else {
      headerLum = getHexLuminance(config.customColorStart || "#F59E0B");
      const startRgb = hexToRgb(config.customColorStart || "#F59E0B");
      const endRgb = hexToRgb(config.customColorEnd || "#10B981");
      const midR = (startRgb.r + endRgb.r) / 2;
      const midG = (startRgb.g + endRgb.g) / 2;
      const midB = (startRgb.b + endRgb.b) / 2;
      footerLum = 0.299 * midR + 0.587 * midG + 0.114 * midB;
    }
  } else if (themeObj?.startColor && themeObj?.endColor) {
    headerLum = getHexLuminance(themeObj.startColor);
    const startRgb = hexToRgb(themeObj.startColor);
    const endRgb = hexToRgb(themeObj.endColor);
    const midR = (startRgb.r + endRgb.r) / 2;
    const midG = (startRgb.g + endRgb.g) / 2;
    const midB = (startRgb.b + endRgb.b) / 2;
    footerLum = 0.299 * midR + 0.587 * midG + 0.114 * midB;
  }

  const isDarkHeader = headerLum < 140;
  const isDarkFooter = footerLum < 140;

  const logoCardX = marginX;
  const logoCardY = 4.8;
  const logoCardW = Math.min(29, 29 * scaleRatio);
  const logoCardH = Math.min(20.8, 20.8 * scaleRatio);

  // Logo Card with subtle rounded border (filled white for gradient / custom themes)
  if (!isThemeWhite) {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.35);
    if (typeof doc.roundedRect === "function") {
      doc.roundedRect(logoCardX, logoCardY, logoCardW, logoCardH, 2.0, 2.0, "FD");
    } else {
      doc.rect(logoCardX, logoCardY, logoCardW, logoCardH, "FD");
    }
  } else {
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.35);
    if (typeof doc.roundedRect === "function") {
      doc.roundedRect(logoCardX, logoCardY, logoCardW, logoCardH, 2.0, 2.0, "S");
    } else {
      doc.rect(logoCardX, logoCardY, logoCardW, logoCardH, "S");
    }
  }

  if (logoImg?.dataUrl) {
    const logoBox = computeAspectFitBox(
      logoImg.width,
      logoImg.height,
      logoCardX + 1.2,
      logoCardY + 1.0,
      logoCardW - 2.4,
      logoCardH - 2.0
    );
    doc.addImage(logoImg.dataUrl, "PNG", logoBox.x, logoBox.y, logoBox.width, logoBox.height, undefined, "FAST");
  }

  const textStartX = logoCardX + logoCardW + 4.0;
  const headerName = String(config.headerCompanyName || DEFAULT_ENVELOPE_CONFIG.headerCompanyName).trim();
  const headerSub = String(config.headerSubtitle || DEFAULT_ENVELOPE_CONFIG.headerSubtitle).trim();
  const headerAddr = String(config.headerAddress || DEFAULT_ENVELOPE_CONFIG.headerAddress).trim();

  // Line 1: Full Company Name - Scaled proportionately
  doc.setFont("helvetica", "bold");
  doc.setFontSize(Math.round(20.5 * scaleRatio * 10) / 10);
  if (isDarkHeader) {
    doc.setTextColor(255, 255, 255);
  } else {
    doc.setTextColor(2, 28, 87);
  }
  doc.text(headerName, textStartX, 10.2);

  // Line 2: NABL Accreditation Laboratory & Standard (Bold Emerald Green #047857 or Light Mint #6EE7B7)
  if (config.showHeaderSubtitle !== false && headerSub) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(Math.round(9.8 * scaleRatio * 10) / 10);
    if (isDarkHeader) {
      doc.setTextColor(110, 231, 183);
    } else {
      doc.setTextColor(4, 120, 87);
    }
    doc.text(headerSub, textStartX, 14.8);
  }

  // Line 3: Official Address & GSTIN - Scaled font size (Slate #334155 or Light Slate #E2E8F0)
  if (headerAddr) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(Math.round(8.6 * scaleRatio * 10) / 10);
    if (isDarkHeader) {
      doc.setTextColor(226, 232, 240);
    } else {
      doc.setTextColor(51, 65, 85);
    }
    doc.text(headerAddr, textStartX, 19.0);
  }

  // Line 4: Contact Strip with Phone, Email & Website Icons (Moved to Header)
  const phoneVal = String(config.phone || DEFAULT_ENVELOPE_CONFIG.phone).trim();
  const emailVal = String(config.email || config.emailPrimary || DEFAULT_ENVELOPE_CONFIG.email).trim();
  const websiteVal = String(config.website || DEFAULT_ENVELOPE_CONFIG.website).trim();
  const iconY = 21.0;
  const line4Y = 23.3;
  let curContactX = textStartX;
  const contactFontSize = Math.round(8.0 * scaleRatio * 10) / 10;

  if (phoneVal) {
    if (phIconImg?.dataUrl) {
      doc.addImage(phIconImg.dataUrl, "PNG", curContactX, iconY, 2.8, 2.8);
      curContactX += 3.6;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(contactFontSize);
    doc.setTextColor(isDarkHeader ? 255 : 2, isDarkHeader ? 255 : 28, isDarkHeader ? 255 : 87);
    doc.text(phoneVal, curContactX, line4Y);
    curContactX += doc.getTextWidth(phoneVal) + 4.0;
  }

  if (emailVal) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(contactFontSize);
    doc.setTextColor(245, 130, 32);
    doc.text("|", curContactX, line4Y);
    curContactX += 4.0;

    if (mailIconImg?.dataUrl) {
      doc.addImage(mailIconImg.dataUrl, "PNG", curContactX, iconY, 2.8, 2.8);
      curContactX += 3.6;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(contactFontSize);
    doc.setTextColor(isDarkHeader ? 255 : 2, isDarkHeader ? 255 : 28, isDarkHeader ? 255 : 87);
    doc.text(emailVal, curContactX, line4Y);
    curContactX += doc.getTextWidth(emailVal) + 4.0;
  }

  if (websiteVal) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(contactFontSize);
    doc.setTextColor(245, 130, 32);
    doc.text("|", curContactX, line4Y);
    curContactX += 4.0;

    if (webIconImg?.dataUrl) {
      doc.addImage(webIconImg.dataUrl, "PNG", curContactX, iconY, 2.8, 2.8);
      curContactX += 3.6;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(contactFontSize);
    if (isDarkHeader) {
      doc.setTextColor(147, 197, 253);
    } else {
      doc.setTextColor(29, 78, 216);
    }
    doc.text(websiteVal, curContactX, line4Y);
  }

  // Clean horizontal header divider rules
  doc.setDrawColor(isDarkHeader ? 255 : 2, isDarkHeader ? 255 : 28, isDarkHeader ? 255 : 87);
  doc.setLineWidth(0.45);
  doc.line(marginX, headerBottomY, widthMm - marginX, headerBottomY);
  doc.setDrawColor(245, 130, 32);
  doc.setLineWidth(0.35);
  doc.line(marginX, headerBottomY + 0.8, widthMm - marginX, headerBottomY + 0.8);

  // Body layout coordinates (mm)
  const bodyTopY = headerBottomY + 5.5;
  const bodyCardH = Math.max(48, heightMm - bodyTopY - 17);

  // ==========================================
  // RIGHT ZONE: QR CODE AREA
  // ==========================================
  const qrX = widthMm - marginX - qrSizeMm;
  const qrY = Math.max(headerBottomY + 6, (heightMm - qrSizeMm) / 2 - 4);

  // If gradient or custom non-white theme, draw white card for QR area to ensure scanner readability
  if (!isThemeWhite) {
    const qrCardX = qrX - 4;
    const qrCardW = qrSizeMm + 8;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(255, 255, 255);
    if (typeof doc.roundedRect === "function") {
      doc.roundedRect(qrCardX, bodyTopY, qrCardW, bodyCardH, 3.0, 3.0, "FD");
    } else {
      doc.rect(qrCardX, bodyTopY, qrCardW, bodyCardH, "FD");
    }
  }

  // ==========================================
  // CENTER/LEFT ZONE: TO SECTION (ONLY SECTION IN BODY - FROM REMOVED)
  // Kept completely blank for handwritten address when no recipient is passed
  // ==========================================
  const toX = 18;
  const toMaxW = Math.max(70, qrX - toX - 14);

  // If gradient or custom non-white theme, draw white card for TO recipient section
  if (!isThemeWhite) {
    const toCardX = toX - 4;
    const toCardW = toMaxW + 8;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(255, 255, 255);
    if (typeof doc.roundedRect === "function") {
      doc.roundedRect(toCardX, bodyTopY, toCardW, bodyCardH, 3.0, 3.0, "FD");
    } else {
      doc.rect(toCardX, bodyTopY, toCardW, bodyCardH, "FD");
    }
  }

  const textLeftX = !isThemeWhite ? toX + 2 : toX;
  let toY = bodyTopY + (!isThemeWhite ? 6.5 : 3.0);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(Math.max(8.5, 10.0 * scaleRatio));
  doc.setTextColor(29, 78, 216);
  doc.text("TO", textLeftX, toY);

  const recCompany = String(recipient?.companyName || "").trim();
  const recContact = String(recipient?.contactPerson || "").trim();
  const recAddress = String(recipient?.address || "").trim();
  const recPhone = String(recipient?.phone || "").trim();

  if (recCompany || recContact || recAddress || recPhone) {
    toY += 7.0;
    if (recCompany) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(Math.max(10.5, 13.0 * scaleRatio));
      doc.setTextColor(2, 28, 87);
      const compLines = doc.splitTextToSize(recCompany, toMaxW);
      doc.text(compLines, textLeftX, toY, { lineHeightFactor: 1.25 });
      toY += compLines.length * 5.6 + 2.0;
    }
    if (recContact && recContact.toLowerCase() !== recCompany.toLowerCase()) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(Math.max(8.5, 10.0 * scaleRatio));
      doc.setTextColor(51, 65, 85);
      doc.text(`Attn: ${recContact}`, textLeftX, toY);
      toY += 5.5;
    }
    if (recAddress) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(Math.max(8.5, 10.2 * scaleRatio));
      doc.setTextColor(30, 41, 59);
      const recAddrLines = doc.splitTextToSize(recAddress, toMaxW);
      doc.text(recAddrLines, textLeftX, toY, { lineHeightFactor: 1.4 });
      toY += recAddrLines.length * 4.8 + 3.0;
    }
    if (recPhone) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(Math.max(8.0, 9.8 * scaleRatio));
      doc.setTextColor(2, 28, 87);
      doc.text("Phone:", textLeftX, toY);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 41, 59);
      doc.text(recPhone, textLeftX + 15, toY);
    }
  }

  // Draw QR Image / Box
  if (qrImage?.dataUrl) {
    const qrFit = computeAspectFitBox(
      qrImage.width,
      qrImage.height,
      qrX,
      qrY,
      qrSizeMm,
      qrSizeMm
    );
    doc.addImage(
      qrImage.dataUrl,
      "PNG",
      qrFit.x,
      qrFit.y,
      qrFit.width,
      qrFit.height,
      undefined,
      "NONE"
    );
  } else {
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.35);
    if (typeof doc.setLineDashPattern === "function") {
      doc.setLineDashPattern([1.2, 1.2], 0);
    }
    doc.rect(qrX, qrY, qrSizeMm, qrSizeMm, "S");
    if (typeof doc.setLineDashPattern === "function") {
      doc.setLineDashPattern([], 0);
    }
  }

  // DESCRIPTIVE CAPTION UNDER QR CODE (What the QR is for)
  const qrCenterX = qrX + qrSizeMm / 2;
  let curQrTextY = qrY + qrSizeMm + 3.0;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(Math.max(6.0, 7.5 * scaleRatio));
  doc.setTextColor(2, 28, 87);
  doc.text("SCAN TO VERIFY", qrCenterX, curQrTextY, { align: "center" });

  curQrTextY += 3.2;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(Math.max(5.2, 6.3 * scaleRatio));
  doc.setTextColor(29, 78, 216);
  doc.text("CALIBRATION CERTIFICATES", qrCenterX, curQrTextY, { align: "center" });

  curQrTextY += 2.8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(Math.max(4.6, 5.4 * scaleRatio));
  doc.setTextColor(71, 85, 105);
  doc.text("NABL CC-4313  \u2022  ISO/IEC 17025", qrCenterX, curQrTextY, { align: "center" });

  curQrTextY += 2.5;
  doc.setFontSize(Math.max(4.2, 4.8 * scaleRatio));
  doc.setTextColor(100, 116, 139);
  doc.text("ARCL Instruments Pvt. Ltd.", qrCenterX, curQrTextY, { align: "center" });

  // ==========================================
  // FOOTER SERVICES SECTION (Matching User Request)
  // Calibration | Manufacturing | Sales | Service | Spares
  // ==========================================
  const footerServices = Array.isArray(config.footerServices) && config.footerServices.length > 0
    ? config.footerServices
    : ["Calibration", "Manufacturing", "Sales", "Service", "Spares"];

  const footerH = Math.min(8.2, Math.max(6.2, heightMm * 0.068));
  const footerY = heightMm - 10.2 - footerH;
  const footerW = widthMm - 2 * marginX;

  doc.setDrawColor(245, 130, 32);
  doc.setLineWidth(0.65);
  if (!isThemeWhite) {
    doc.setFillColor(255, 255, 255);
    if (typeof doc.roundedRect === "function") {
      doc.roundedRect(marginX, footerY, footerW, footerH, 1.8, 1.8, "FD");
    } else {
      doc.rect(marginX, footerY, footerW, footerH, "FD");
    }
  } else {
    if (typeof doc.roundedRect === "function") {
      doc.roundedRect(marginX, footerY, footerW, footerH, 1.8, 1.8, "S");
    } else {
      doc.rect(marginX, footerY, footerW, footerH, "S");
    }
  }

  const slotW = footerW / footerServices.length;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(Math.max(6.8, 8.8 * scaleRatio));
  doc.setTextColor(2, 28, 87);

  footerServices.forEach((svc, i) => {
    const slotCenterX = marginX + i * slotW + slotW / 2;
    doc.text(String(svc), slotCenterX, footerY + footerH * 0.68, { align: "center" });

    if (i < footerServices.length - 1) {
      const divX = marginX + (i + 1) * slotW;
      doc.setDrawColor(245, 130, 32);
      doc.setLineWidth(0.55);
      doc.line(divX, footerY + 1.2, divX, footerY + footerH - 1.2);
    }
  });

  // Customer Courtesy & Thank You Note (Clearly positioned below services box)
  const centerPageX = widthMm / 2;
  const thankTitle = String(
    config.footerThankYouTitle || DEFAULT_ENVELOPE_CONFIG.footerThankYouTitle
  ).trim();
  const thankSub = String(
    config.footerThankYouSubtitle || DEFAULT_ENVELOPE_CONFIG.footerThankYouSubtitle
  ).trim();

  const thankY1 = heightMm - 7.2;
  const thankY2 = heightMm - 4.4;

  if (thankTitle) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(Math.max(5.2, 6.6 * scaleRatio));
    doc.setTextColor(isDarkFooter ? 255 : 2, isDarkFooter ? 255 : 28, isDarkFooter ? 255 : 87);
    doc.text(thankTitle, centerPageX, thankY1, { align: "center" });
  }

  if (thankSub) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(Math.max(4.5, 5.5 * scaleRatio));
    doc.setTextColor(isDarkFooter ? 226 : 71, isDarkFooter ? 232 : 85, isDarkFooter ? 240 : 105);
    doc.text(thankSub, centerPageX, thankY2, { align: "center" });
  }

  // Bottom framing bar (Accent Orange + Corporate Navy)
  doc.setFillColor(245, 130, 32);
  doc.rect(0, heightMm - 3.4, widthMm, 0.8, "F");
  doc.setFillColor(2, 28, 87);
  doc.rect(0, heightMm - 2.6, widthMm, 2.6, "F");

  return doc;
};

export const downloadEnvelopePdf = async (opts = {}, fileName = null) => {
  const doc = await buildEnvelopePdfDocument(opts);
  const w = opts.widthMm || opts.envelopeSize?.widthMm || 280;
  const h = opts.heightMm || opts.envelopeSize?.heightMm || 124;
  const outName = fileName || `ARCL_Instruments_Envelope_${w}x${h}mm.pdf`;
  doc.save(outName);
  return doc;
};

export const getEnvelopePdfBlobUrl = async (opts = {}) => {
  const doc = await buildEnvelopePdfDocument(opts);
  const blob = doc.output("blob");
  return URL.createObjectURL(blob);
};

/**
 * Direct 100% Native Print to Printer via Hidden DOM Iframe.
 * Bypasses PDF downloads, file saving dialogs, and Adobe Acrobat completely!
 */
export const printEnvelopeHtmlDirectly = async ({
  elementId = "arcl-envelope-print-sheet",
  widthMm = 280,
  heightMm = 124,
} = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const sourceEl = document.getElementById(elementId);
      if (!sourceEl) {
        throw new Error(`Envelope preview element #${elementId} not found in DOM`);
      }

      const existingFrame = document.getElementById("arcl-direct-envelope-print-frame");
      if (existingFrame) {
        existingFrame.remove();
      }

      const iframe = document.createElement("iframe");
      iframe.id = "arcl-direct-envelope-print-frame";
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "none";
      iframe.style.visibility = "hidden";
      document.body.appendChild(iframe);

      const printDoc = iframe.contentWindow.document;
      printDoc.open();
      printDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>ARCL Instruments Envelope Print (${widthMm} × ${heightMm} mm)</title>
            <style>
              @page {
                size: ${widthMm}mm ${heightMm}mm;
                margin: 0mm !important;
              }
              * {
                box-sizing: border-box;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                width: ${widthMm}mm !important;
                height: ${heightMm}mm !important;
                background: #ffffff !important;
                overflow: hidden !important;
                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
              }
              #${elementId} {
                width: ${widthMm}mm !important;
                height: ${heightMm}mm !important;
                transform: none !important;
                box-shadow: none !important;
                border: none !important;
                position: relative !important;
                overflow: hidden !important;
              }
              .arcl-no-print {
                display: none !important;
              }
            </style>
          </head>
          <body>
            ${sourceEl.outerHTML}
          </body>
        </html>
      `);
      printDoc.close();

      const imgs = Array.from(printDoc.getElementsByTagName("img"));
      const imgLoads = imgs.map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((res) => {
          img.onload = () => res();
          img.onerror = () => res();
        });
      });

      Promise.all(imgLoads).then(() => {
        setTimeout(() => {
          try {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
            resolve(true);
          } catch (err) {
            console.error("Direct print iframe failed:", err);
            reject(err);
          } finally {
            setTimeout(() => {
              try {
                if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
              } catch (cleanupErr) {
                void cleanupErr;
              }
            }, 60000);
          }
        }, 150);
      });
    } catch (err) {
      reject(err);
    }
  });
};
