import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import Subscriber from "../models/subscriberModel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOGO_PATH = path.resolve(__dirname, "../../public/assets/LOGO.png");

/**
 * Creates and returns a Nodemailer transporter.
 * Supports custom SMTP (Host, Port, User, Pass) or Gmail App Password.
 */
const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  if (!user || !pass) {
    return null;
  }

  if (host) {
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  // Default to Gmail service if host not specified
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
};

const getFromEmail = () => {
  return process.env.EMAIL_FROM || process.env.SMTP_USER || process.env.EMAIL_USER || "arclinstruments@gmail.com";
};

const getFromName = () => {
  return process.env.EMAIL_FROM_NAME || "ARCL Instruments";
};

const getFromAddress = () => {
  return `"${getFromName()}" <${getFromEmail()}>`;
};

const getFrontendUrl = () => {
  return process.env.FRONTEND_URL || "https://arcl-1.vercel.app";
};

const getLogoAttachment = () => {
  if (fs.existsSync(LOGO_PATH)) {
    return {
      filename: "logo.png",
      path: LOGO_PATH,
      cid: "arclCompanyLogo",
    };
  }
  return null;
};

/**
 * Send Welcome Email to a newly registered subscriber
 */
export const sendSubscriberWelcomeEmail = async (email) => {
  try {
    const transporter = getTransporter();
    if (!transporter) {
      console.log(`[EmailService] SMTP credentials not configured. Skipped welcome email to ${email}`);
      return;
    }

    const frontendUrl = getFrontendUrl();
    const fromEmail = getFromEmail();
    const logoAttachment = getLogoAttachment();

    const attachments = [];
    if (logoAttachment) {
      attachments.push(logoAttachment);
    }

    const mailOptions = {
      from: getFromAddress(),
      to: email,
      replyTo: fromEmail,
      subject: "Welcome to ARCL Equipment Updates & Technical Alerts!",
      text: `Welcome to ARCL Instruments!\n\nThank you for subscribing with ${email}.\nYou will now receive updates on newly launched Civil, Mechanical & Medical equipment, calibration updates, technical specifications, and industrial announcements.\n\nBrowse catalog: ${frontendUrl}/catalog\n\n---\nARCL Equipment & Calibration Services\nLucknow, India | Support: +91 8009559900\nTo unsubscribe, reply with UNSUBSCRIBE.`,
      headers: {
        "X-Mailer": "ARCL Instruments Mailer",
        "List-Unsubscribe": `<mailto:${fromEmail}?subject=Unsubscribe>, <${frontendUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
      attachments,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to ARCL Instruments</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #1e293b;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 32px 10px;">
            <tr>
              <td align="center">
                <table width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
                  <!-- Header with Logo -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #021C57 0%, #0a2e7a 100%); padding: 28px 24px; text-align: center;">
                      ${
                        logoAttachment
                          ? `<div style="text-align: center; margin-bottom: 12px;"><img src="cid:arclCompanyLogo" alt="ARCL Instruments Logo" style="max-height: 46px; max-width: 180px; object-fit: contain; display: inline-block; vertical-align: middle;" /></div>`
                          : ""
                      }
                      <h1 style="color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: 0.5px; margin: 0; text-transform: uppercase;">
                        ARCL <span style="color: #38bdf8;">INSTRUMENTS</span>
                      </h1>
                      <p style="color: #93c5fd; font-size: 11px; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 1.2px; font-weight: 600;">
                        Engineering, Calibration & Scientific Solutions
                      </p>
                    </td>
                  </tr>

                  <!-- Body -->
                  <tr>
                    <td style="padding: 32px 28px;">
                      <div style="display: inline-block; background-color: #ecfdf5; color: #059669; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; margin-bottom: 16px; letter-spacing: 0.5px;">
                        Subscription Confirmed ✓
                      </div>
                      
                      <h2 style="color: #0f172a; font-size: 19px; font-weight: 700; margin: 0 0 14px 0;">
                        Thank you for subscribing!
                      </h2>
                      
                      <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
                        You have successfully subscribed with <strong>${email}</strong>. You will now be among the first to receive updates on:
                      </p>

                      <ul style="color: #334155; font-size: 14px; line-height: 1.7; padding-left: 20px; margin: 0 0 24px 0;">
                        <li>Newly launched Civil, Mechanical & Medical equipment</li>
                        <li>NABL accredited calibration & testing updates</li>
                        <li>Technical specifications, product catalogs & manuals</li>
                        <li>Exclusive industrial announcements</li>
                      </ul>

                      <div style="text-align: center; margin: 28px 0;">
                        <a href="${frontendUrl}/catalog" style="display: inline-block; background: #021C57; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 14px; padding: 13px 28px; border-radius: 8px; box-shadow: 0 3px 10px rgba(2,28,87,0.2);">
                          Browse Full Product Catalog →
                        </a>
                      </div>

                      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 28px 0;">

                      <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 0;">
                        Need urgent equipment assistance or custom calibration? Call our technical desk or reply directly to this email.
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                      <p style="color: #94a3b8; font-size: 11px; margin: 0 0 4px 0;">
                        © ${new Date().getFullYear()} ARCL Equipment & Calibration Services. All rights reserved.
                      </p>
                      <p style="color: #94a3b8; font-size: 11px; margin: 0;">
                        Lucknow / Pan India | Contact: +91 8009559900
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`[EmailService] Welcome email sent successfully to ${email}`);
  } catch (error) {
    console.error(`[EmailService] Error sending welcome email to ${email}:`, error.message);
  }
};

/**
 * Broadcast New Product Announcement to all active subscribers
 */
export const notifySubscribersNewProduct = async (product, categoryName = "") => {
  try {
    const transporter = getTransporter();
    if (!transporter) {
      console.log("[EmailService] SMTP credentials not configured. Skipped broadcasting new product notification.");
      return;
    }

    const activeSubscribers = await Subscriber.find({ isActive: true }).select("email");
    if (!activeSubscribers || activeSubscribers.length === 0) {
      console.log("[EmailService] No active subscribers found for new product broadcast.");
      return;
    }

    const subscriberEmails = activeSubscribers.map((s) => s.email).filter(Boolean);
    if (subscriberEmails.length === 0) return;

    const frontendUrl = getFrontendUrl();
    const fromEmail = getFromEmail();
    const logoAttachment = getLogoAttachment();

    const productSlug = product.slug || "";
    const productUrl = `${frontendUrl}/products/${productSlug}`;
    const productImage = (product.images && product.images.length > 0)
      ? (typeof product.images[0] === "string" ? product.images[0] : product.images[0]?.url)
      : "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80";

    const productTitle = product.title || "Advanced Testing Equipment";
    const productDesc = product.description
      ? (product.description.length > 220 ? product.description.substring(0, 220) + "..." : product.description)
      : "High-precision laboratory and industrial equipment designed for accurate testing, inspection, and research standards.";

    console.log(`[EmailService] Broadcasting new product "${productTitle}" to ${subscriberEmails.length} subscriber(s)...`);

    const attachments = [];
    if (logoAttachment) {
      attachments.push(logoAttachment);
    }

    const BATCH_SIZE = 50;
    for (let i = 0; i < subscriberEmails.length; i += BATCH_SIZE) {
      const batch = subscriberEmails.slice(i, i + BATCH_SIZE);

      const mailOptions = {
        from: getFromAddress(),
        to: fromEmail,
        bcc: batch,
        replyTo: fromEmail,
        subject: `New Equipment Alert: ${productTitle} | ARCL`,
        text: `New Equipment Launch: ${productTitle}\n\n${productDesc}\n\nView Technical Specs & Inquire: ${productUrl}\n\n---\nARCL Equipment & Calibration Services\nLucknow, India | Support: +91 8009559900`,
        headers: {
          "X-Mailer": "ARCL Instruments Mailer",
          "List-Unsubscribe": `<mailto:${fromEmail}?subject=Unsubscribe>, <${frontendUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
        attachments,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Product Alert - ${productTitle}</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b132b; color: #1e293b;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0b132b; padding: 30px 10px;">
              <tr>
                <td align="center">
                  <table width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.35); border: 1px solid #1e293b;">
                    
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #021C57 0%, #0a2e7a 100%); padding: 26px 24px; text-align: center;">
                        ${
                          logoAttachment
                            ? `<div style="text-align: center; margin-bottom: 10px;"><img src="cid:arclCompanyLogo" alt="ARCL Logo" style="max-height: 44px; max-width: 180px; object-fit: contain; display: inline-block; vertical-align: middle;" /></div>`
                            : ""
                        }
                        <span style="background: #38bdf8; color: #021C57; font-size: 10px; font-weight: 800; letter-spacing: 1px; padding: 3px 10px; border-radius: 12px; text-transform: uppercase;">
                          NEW EQUIPMENT LAUNCH
                        </span>
                        <h1 style="color: #ffffff; font-size: 20px; font-weight: 800; margin: 10px 0 4px 0;">
                          ARCL <span style="color: #38bdf8;">INSTRUMENTS</span>
                        </h1>
                        <p style="color: #bfdbfe; font-size: 12px; margin: 0; text-transform: uppercase; letter-spacing: 1px;">
                          Advanced Testing & Engineering Equipment
                        </p>
                      </td>
                    </tr>

                    <!-- Product Image -->
                    <tr>
                      <td style="padding: 0; background-color: #f8fafc; text-align: center;">
                        <a href="${productUrl}" style="text-decoration: none; display: block;">
                          <img src="${productImage}" alt="${productTitle}" style="width: 100%; max-height: 320px; object-fit: cover; display: block; border-bottom: 1px solid #e2e8f0;" />
                        </a>
                      </td>
                    </tr>

                    <!-- Product Details -->
                    <tr>
                      <td style="padding: 30px 28px;">
                        ${categoryName ? `
                          <div style="color: #0284c7; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 6px;">
                            Category: ${categoryName}
                          </div>
                        ` : ""}
                        
                        <h2 style="color: #0f172a; font-size: 20px; font-weight: 800; line-height: 1.3; margin: 0 0 12px 0;">
                          ${productTitle}
                        </h2>

                        <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
                          ${productDesc}
                        </p>

                        <!-- Action Button -->
                        <div style="text-align: center; margin: 28px 0 10px 0;">
                          <a href="${productUrl}" style="display: inline-block; background: #021C57; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 13px 32px; border-radius: 8px; box-shadow: 0 4px 14px rgba(2,28,87,0.3); letter-spacing: 0.3px;">
                            View Technical Specs & Inquire →
                          </a>
                        </div>
                      </td>
                    </tr>

                    <!-- Features Highlight Box -->
                    <tr>
                      <td style="padding: 0 28px 24px 28px;">
                        <table width="100%" style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; padding: 14px;">
                          <tr>
                            <td style="font-size: 12px; color: #64748b; line-height: 1.5;">
                              <strong style="color: #0f172a;">Why ARCL Equipments?</strong><br>
                              ✓ Factory Calibrated with Standard Compliance<br>
                              ✓ Direct Technical Support & Documentation<br>
                              ✓ Pan-India Delivery & Maintenance Assistance
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #0f172a; padding: 22px 20px; text-align: center; color: #94a3b8;">
                        <p style="font-size: 12px; margin: 0 0 6px 0; color: #cbd5e1;">
                          You are receiving this email because you subscribed to equipment alerts at ARCL.
                        </p>
                        <p style="font-size: 11px; margin: 0; color: #64748b;">
                          © ${new Date().getFullYear()} ARCL. Lucknow, India | <a href="${frontendUrl}" style="color: #38bdf8; text-decoration: none;">Visit Website</a>
                        </p>
                      </td>
                    </tr>

                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
      };

      await transporter.sendMail(mailOptions);
    }

    console.log(`[EmailService] New product broadcast sent successfully for "${productTitle}"`);
  } catch (error) {
    console.error("[EmailService] Error broadcasting new product email:", error.message);
  }
};

/**
 * Send Bulk Broadcast Email with Greeting/Announcement Image Banner
 * Attaches official ARCL Logo and Greeting Banner as CID Inline Attachments for 100% reliable rendering and zero spam flags.
 */
export const sendBulkBroadcastEmail = async ({
  recipients = [],
  subject = "Announcement from ARCL Instruments",
  title = "Important Update from ARCL Instruments",
  message = "",
  imageUrl = "",
  imageBuffer = null,
  imageMime = "image/jpeg",
  ctaLink = "",
  ctaText = "Visit ARCL Instruments",
}) => {
  if (!Array.isArray(recipients) || recipients.length === 0) {
    return { total: 0, successCount: 0, failedCount: 0 };
  }

  const uniqueEmails = Array.from(
    new Set(
      recipients
        .map((e) => (typeof e === "string" ? e.trim().toLowerCase() : ""))
        .filter((e) => /^\S+@\S+\.\S+$/.test(e))
    )
  );

  if (uniqueEmails.length === 0) {
    return { total: 0, successCount: 0, failedCount: 0 };
  }

  const transporter = getTransporter();
  const frontendUrl = getFrontendUrl();
  const fromEmail = getFromEmail();
  const fromAddress = getFromAddress();
  const effectiveCtaLink = ctaLink || frontendUrl;
  const cleanTitle = title || subject || "Announcement from ARCL Instruments";

  if (!transporter) {
    console.warn(
      `[EmailService Warning] SMTP credentials (SMTP_USER/SMTP_PASS) not configured in backend/.env. Simulated broadcast to ${uniqueEmails.length} recipients: "${subject}"`
    );
    return {
      total: uniqueEmails.length,
      successCount: 0,
      failedCount: uniqueEmails.length,
      simulated: true,
      error:
        "SMTP credentials (SMTP_USER & SMTP_PASS) are not set in backend/.env. Please configure your Gmail App Password or SMTP credentials to dispatch real emails.",
    };
  }

  // Handle image buffer extraction if imageUrl is a base64 data URI
  let finalImageBuffer = imageBuffer;
  let finalImageMime = imageMime;
  let externalImageUrl = "";

  if (!finalImageBuffer && imageUrl) {
    if (imageUrl.startsWith("data:")) {
      const match = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        finalImageMime = match[1];
        finalImageBuffer = Buffer.from(match[2], "base64");
      }
    } else if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      externalImageUrl = imageUrl;
    }
  }

  // Prepare attachments (Logo + Banner)
  const attachments = [];
  const logoAttachment = getLogoAttachment();
  if (logoAttachment) {
    attachments.push(logoAttachment);
  }

  let hasBannerCid = false;
  if (finalImageBuffer) {
    hasBannerCid = true;
    attachments.push({
      filename: "announcement-banner.jpg",
      content: finalImageBuffer,
      contentType: finalImageMime || "image/jpeg",
      cid: "campaignBannerImage",
    });
  }

  // Format message text and HTML
  const plainTextMessage = `${cleanTitle}\n\n${message}\n\n${ctaText}: ${effectiveCtaLink}\n\n---\nARCL Equipment & Calibration Services\nLucknow, India | Support: +91 8009559900\nVisit Website: ${frontendUrl}\nTo unsubscribe, reply with UNSUBSCRIBE.`;

  const formattedMessageHtml = message
    .replace(/\n\n/g, "</p><p style='color: #334155; font-size: 14px; line-height: 1.7; margin: 0 0 14px 0;'>")
    .replace(/\n/g, "<br/>");

  let successCount = 0;
  let failedCount = 0;
  const errors = [];

  // Build HTML email layout
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${cleanTitle}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 28px 8px;">
        <tr>
          <td align="center">
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
              
              <!-- Brand Header with Logo -->
              <tr>
                <td style="background: linear-gradient(135deg, #021C57 0%, #0a2e7a 100%); padding: 26px 24px; text-align: center;">
                  ${
                    logoAttachment
                      ? `<div style="text-align: center; margin-bottom: 12px;"><img src="cid:arclCompanyLogo" alt="ARCL Instruments Logo" style="max-height: 48px; max-width: 190px; object-fit: contain; display: inline-block; vertical-align: middle;" /></div>`
                      : ""
                  }
                  <h1 style="color: #ffffff; font-size: 19px; font-weight: 800; margin: 0; letter-spacing: 0.5px; text-transform: uppercase;">
                    ARCL INSTRUMENTS
                  </h1>
                  <p style="color: #93c5fd; font-size: 11px; margin: 4px 0 0 0; text-transform: uppercase; font-weight: 600; letter-spacing: 1.2px;">
                    Precision Laboratory & Industrial Testing Solutions
                  </p>
                </td>
              </tr>

              <!-- Greeting / Announcement Image Banner -->
              ${
                hasBannerCid
                  ? `
              <tr>
                <td style="padding: 0; background-color: #021C57; text-align: center;">
                  <img src="cid:campaignBannerImage" alt="${cleanTitle}" style="width: 100%; max-width: 600px; height: auto; max-height: 380px; object-fit: cover; display: block; margin: 0 auto;" />
                </td>
              </tr>
              `
                  : externalImageUrl
                  ? `
              <tr>
                <td style="padding: 0; background-color: #021C57; text-align: center;">
                  <img src="${externalImageUrl}" alt="${cleanTitle}" style="width: 100%; max-width: 600px; height: auto; max-height: 380px; object-fit: cover; display: block; margin: 0 auto;" />
                </td>
              </tr>
              `
                  : ""
              }

              <!-- Content Body -->
              <tr>
                <td style="padding: 32px 28px;">
                  <h2 style="color: #0f172a; font-size: 19px; font-weight: 700; margin: 0 0 16px 0; line-height: 1.4;">
                    ${cleanTitle}
                  </h2>

                  <div style="color: #334155; font-size: 14px; line-height: 1.7; margin: 0 0 24px 0;">
                    <p style="color: #334155; font-size: 14px; line-height: 1.7; margin: 0 0 14px 0;">
                      ${formattedMessageHtml}
                    </p>
                  </div>

                  <!-- CTA Button -->
                  <div style="text-align: center; margin: 28px 0 12px 0;">
                    <a href="${effectiveCtaLink}" style="display: inline-block; background: #021C57; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 13px 32px; border-radius: 8px; box-shadow: 0 3px 10px rgba(2,28,87,0.25);">
                      ${ctaText} →
                    </a>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="color: #64748b; font-size: 11px; margin: 0 0 6px 0;">
                    © ${new Date().getFullYear()} ARCL Equipment & Calibration Services. All rights reserved.
                  </p>
                  <p style="color: #94a3b8; font-size: 10px; margin: 0 0 6px 0;">
                    Lucknow, India | Support: +91 8009559900 | <a href="${frontendUrl}" style="color: #0284c7; text-decoration: none;">Visit Website</a>
                  </p>
                  <p style="color: #cbd5e1; font-size: 9px; margin: 0;">
                    You are receiving this official message from ARCL Instruments. To unsubscribe, reply with UNSUBSCRIBE.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  // Dispatch directly to each recipient (in batches of 5 concurrent requests) for optimal inbox deliverability
  const CONCURRENCY = 5;
  for (let i = 0; i < uniqueEmails.length; i += CONCURRENCY) {
    const chunk = uniqueEmails.slice(i, i + CONCURRENCY);

    const chunkPromises = chunk.map(async (recipientEmail) => {
      const mailOptions = {
        from: fromAddress,
        to: recipientEmail,
        replyTo: fromEmail,
        subject: subject || cleanTitle,
        text: plainTextMessage,
        html: emailHtml,
        attachments,
        headers: {
          "X-Mailer": "ARCL Instruments Mailer",
          "X-Entity-Ref-ID": `ARCL-CAMPAIGN-${Date.now()}`,
          "List-Unsubscribe": `<mailto:${fromEmail}?subject=Unsubscribe>, <${frontendUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      };

      try {
        await transporter.sendMail(mailOptions);
        return { success: true, email: recipientEmail };
      } catch (err) {
        console.error(`[EmailService] Failed to send email to ${recipientEmail}:`, err.message);
        return { success: false, email: recipientEmail, error: err.message };
      }
    });

    const chunkResults = await Promise.all(chunkPromises);
    chunkResults.forEach((res) => {
      if (res.success) successCount++;
      else {
        failedCount++;
        if (res.error) errors.push(res.error);
      }
    });
  }

  return {
    total: uniqueEmails.length,
    successCount,
    failedCount,
    error: errors.length > 0 ? errors[0] : null,
  };
};

