/**
 * High-performance B2B Proforma Quotation PDF generator using clean styled iframe printing
 * Features ARCL ISO 9001:2015 Letterhead, Line Items, GST Preview, Terms & Conditions, and Official Stamp
 */

export const generateQuotationPdf = ({
  items = [],
  customer = {},
  quoteNumber = `ARCL/QT/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
  quoteDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }),
}) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to download your official PDF quotation.");
    return;
  }

  const validItems = Array.isArray(items) ? items : [];

  const itemsHtml = validItems
    .map((item, index) => {
      const prod = item.product || item;
      const qty = item.quantity || 1;
      const sku = prod.productCode ? `(SKU: ${prod.productCode})` : "";
      const standard =
        prod.specifications?.Standard ||
        prod.specifications?.["Conforming Standard"] ||
        "IS / ASTM Standard Compliant";

      return `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 13px;">
        <td style="padding: 10px 8px; text-align: center; color: #64748b; font-weight: 600;">${index + 1}</td>
        <td style="padding: 10px 8px;">
          <strong style="color: #0f172a; font-size: 14px;">${prod.name || "Equipment"}</strong>
          <div style="font-size: 11px; color: #021C57; font-weight: 600; margin-top: 2px;">${sku}</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Standard: ${standard}</div>
        </td>
        <td style="padding: 10px 8px; text-align: center; font-weight: 700; color: #0f172a;">${qty} Unit(s)</td>
        <td style="padding: 10px 8px; text-align: right; color: #021C57; font-weight: 700;">Price on Request</td>
        <td style="padding: 10px 8px; text-align: right; color: #16a34a; font-weight: 700;">Factory Direct</td>
      </tr>
    `;
    })
    .join("");

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Official Quotation - ${quoteNumber} - ARCL Instruments</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
        body { margin: 0; padding: 24px; background: #ffffff; color: #1e293b; }
        @media print {
          body { padding: 0; }
          .no-print { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div style="max-width: 850px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 12px; padding: 32px; background: #fff; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
        
        <!-- Header Bar -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #021C57; padding-bottom: 20px; margin-bottom: 24px;">
          <div>
            <h1 style="margin: 0; font-size: 24px; font-weight: 900; color: #021C57; letter-spacing: -0.5px;">ARCL INSTRUMENTS PVT. LTD.</h1>
            <p style="margin: 4px 0 0 0; font-size: 11px; font-weight: 700; color: #d97706; text-transform: uppercase; letter-spacing: 1px;">An ISO 9001:2015 Certified Manufacturer</p>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #475569;">Precision Civil Engineering & Material Testing Equipment</p>
            <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">Plot No. 4, Industrial Area, Phase II | Web: www.arclinstruments.com</p>
          </div>
          <div style="text-align: right;">
            <div style="display: inline-block; background: #021C57; color: #fff; padding: 6px 14px; border-radius: 6px; font-size: 14px; font-weight: 800; letter-spacing: 0.5px;">
              PROFORMA ESTIMATE
            </div>
            <p style="margin: 8px 0 0 0; font-size: 12px; font-weight: 700; color: #0f172a;">Quote Ref: <span style="font-family: monospace; color: #021C57;">${quoteNumber}</span></p>
            <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">Date: ${quoteDate}</p>
            <p style="margin: 2px 0 0 0; font-size: 11px; color: #16a34a; font-weight: 600;">Valid for: 30 Days</p>
          </div>
        </div>

        <!-- Customer & Vendor Details Block -->
        <div style="display: flex; justify-content: space-between; gap: 20px; margin-bottom: 24px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px;">
          <div style="flex: 1;">
            <div style="font-size: 11px; font-weight: 800; color: #021C57; text-transform: uppercase; margin-bottom: 4px;">QUOTATION PREPARED FOR:</div>
            <div style="font-size: 14px; font-weight: 700; color: #0f172a;">${customer.name || customer.customerName || "Valued Client"}</div>
            ${customer.company ? `<div style="font-size: 12px; color: #475569; font-weight: 600;">${customer.company}</div>` : ""}
            ${customer.phone ? `<div style="font-size: 12px; color: #475569;">Phone: ${customer.phone}</div>` : ""}
            ${customer.email ? `<div style="font-size: 12px; color: #475569;">Email: ${customer.email}</div>` : ""}
          </div>
          <div style="flex: 1; text-align: right; border-left: 1px solid #cbd5e1; padding-left: 18px;">
            <div style="font-size: 11px; font-weight: 800; color: #021C57; text-transform: uppercase; margin-bottom: 4px;">ISSUED BY:</div>
            <div style="font-size: 13px; font-weight: 700; color: #0f172a;">ARCL Technical Sales Division</div>
            <div style="font-size: 12px; color: #475569;">Email: arclinstruments@gmail.com</div>
            <div style="font-size: 12px; color: #475569;">Helpline: +91 81696 95728</div>
            <div style="font-size: 11px; color: #16a34a; font-weight: 600;">GSTIN: 07AAACA1234A1Z5</div>
          </div>
        </div>

        <!-- Line Items Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <thead>
            <tr style="background: #021C57; color: #fff; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
              <th style="padding: 10px 8px; width: 40px; text-align: center;">#</th>
              <th style="padding: 10px 8px; text-align: left;">Equipment & Technical Description</th>
              <th style="padding: 10px 8px; text-align: center; width: 90px;">Quantity</th>
              <th style="padding: 10px 8px; text-align: right; width: 130px;">Unit Estimate</th>
              <th style="padding: 10px 8px; text-align: right; width: 120px;">Terms</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <!-- Commercial Terms & Conditions -->
        <div style="display: flex; justify-content: space-between; gap: 20px; border-top: 1px solid #cbd5e1; padding-top: 16px;">
          <div style="flex: 1.5; font-size: 11px; color: #475569; line-height: 1.6;">
            <strong style="color: #021C57; text-transform: uppercase;">Standard Commercial Terms:</strong>
            <ul style="margin: 4px 0 0 0; padding-left: 16px;">
              <li><strong>Warranty:</strong> 12 Months comprehensive manufacturer warranty against manufacturing defects.</li>
              <li><strong>Calibration:</strong> Traceable Factory Calibration Certificate included with all digital equipment.</li>
              <li><strong>Taxes:</strong> GST @ 18% extra as applicable at the time of invoicing.</li>
              <li><strong>Delivery:</strong> Ex-factory or door delivery as agreed upon order confirmation.</li>
              <li><strong>Dispatch:</strong> Within 7-10 working days from receipt of confirmed purchase order.</li>
            </ul>
          </div>

          <div style="flex: 1; text-align: right; display: flex; flex-direction: column; justify-content: flex-end; align-items: flex-end;">
            <div style="border: 2px dashed #021C57; border-radius: 8px; padding: 12px 18px; text-align: center; background: #f0f9ff; max-width: 220px;">
              <div style="font-size: 10px; font-weight: 800; color: #021C57; text-transform: uppercase;">ARCL INSTRUMENTS PVT. LTD.</div>
              <div style="font-size: 9px; color: #16a34a; font-weight: 700; margin-top: 4px;">✓ OFFICIAL VERIFIED ESTIMATE</div>
              <div style="font-size: 9px; color: #64748b; margin-top: 6px;">Authorized Signatory</div>
            </div>
          </div>
        </div>

        <!-- Print Action Buttons in Viewer -->
        <div class="no-print" style="margin-top: 30px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px;">
          <button onclick="window.print()" style="background: #021C57; color: #fff; border: none; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 14px; cursor: pointer; box-shadow: 0 4px 12px rgba(2,28,87,0.3);">
            🖨️ Print / Save as PDF
          </button>
          <button onclick="window.close()" style="background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; padding: 12px 20px; border-radius: 8px; font-weight: 600; font-size: 14px; cursor: pointer; margin-left: 10px;">
            Close Preview
          </button>
        </div>

      </div>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};
