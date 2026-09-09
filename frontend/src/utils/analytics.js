/**
 * Google Analytics 4 (GA4) Event Tracking Helper for ARCL Instruments
 * Ensures zero blocking of main thread, safe checking for window.gtag.
 */

export const trackEvent = (action, category, label, value) => {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    try {
      window.gtag("event", action, {
        event_category: category,
        event_label: label,
        value: value,
      });
    } catch (e) {
      // fail gracefully without interrupting UI
    }
  }
};

/**
 * Track B2B Product Inquiry
 */
export const trackProductInquiry = (productName, categoryName) => {
  trackEvent("product_inquiry_submit", "Lead Generation", `${productName} (${categoryName || "General"})`);
};

/**
 * Track Contact Form Submission
 */
export const trackContactForm = (subject = "General Contact") => {
  trackEvent("contact_form_submit", "Lead Generation", subject);
};

/**
 * Track Direct Call / Phone Click
 */
export const trackPhoneClick = (phoneNumber) => {
  trackEvent("phone_call_click", "Contact", phoneNumber);
};

/**
 * Track WhatsApp Chat Click
 */
export const trackWhatsAppClick = (context = "Header/Product") => {
  trackEvent("whatsapp_click", "Contact", context);
};

/**
 * Track PDF Catalog Download
 */
export const trackCatalogDownload = (catalogName = "ARCL Instruments Master Catalog") => {
  trackEvent("catalog_download", "Downloads", catalogName);
};
