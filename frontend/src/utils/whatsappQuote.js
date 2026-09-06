/**
 * Format and open instant WhatsApp quotation / product inquiry with zero-cost Click-to-Chat protocol
 */

const ARCL_SALES_WHATSAPP = "918169695728"; // ARCL Official Sales & Quotation Desk

export const sendProductToWhatsApp = (product, customer = {}) => {
  if (!product) return;

  const standard =
    product.specifications?.Standard ||
    product.specifications?.["Conforming Standard"] ||
    "IS/ASTM Compliant";

  const message = `*Hello ARCL Instruments Team,* 🔬

I am interested in requesting a price quotation & technical specifications for:

*Equipment:* ${product.name}
${product.productCode ? `*SKU Code:* ${product.productCode}` : ""}
*Category:* ${product.category?.name || "Civil Testing Equipment"}
*Standard:* ${standard}
*Link:* https://arcl-1.vercel.app/products/${product.slug || product._id}

${customer.name ? `*Client Name:* ${customer.name}` : ""}
${customer.company ? `*Company/Lab:* ${customer.company}` : ""}
${customer.phone ? `*Phone:* ${customer.phone}` : ""}

Please share the official quotation and lead time. Thank you!`;

  const url = `https://wa.me/${ARCL_SALES_WHATSAPP}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
};

export const sendCartToWhatsApp = (items = [], customer = {}) => {
  if (!items || items.length === 0) return;

  let message = `*Hello ARCL Instruments Sales,* 📋

I would like to request an official formal quotation for the following equipment package:

`;

  items.forEach((item, index) => {
    const prod = item.product || item;
    const qty = item.quantity || 1;
    message += `*${index + 1}. ${prod.name}* (Qty: ${qty})\n`;
    if (prod.productCode) message += `   SKU: ${prod.productCode}\n`;
  });

  if (customer.name) message += `\n*Client Name:* ${customer.name}`;
  if (customer.company) message += `\n*Company/Organization:* ${customer.company}`;
  if (customer.phone) message += `\n*Phone:* ${customer.phone}`;
  if (customer.email) message += `\n*Email:* ${customer.email}`;

  message += `\n\n*Reference:* https://arcl-1.vercel.app/products\nPlease share the formal proforma estimate with GST & freight details.`;

  const url = `https://wa.me/${ARCL_SALES_WHATSAPP}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
};
