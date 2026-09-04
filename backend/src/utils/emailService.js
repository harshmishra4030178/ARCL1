import nodemailer from "nodemailer";
import Subscriber from "../models/subscriberModel.js";

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

const getFromAddress = () => {
  const fromName = process.env.EMAIL_FROM_NAME || "ARCL Laboratory Equipment";
  const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER || process.env.EMAIL_USER || "no-reply@arcl.com";
  return `"${fromName}" <${fromEmail}>`;
};

const getFrontendUrl = () => {
  return process.env.FRONTEND_URL || "https://arcl-i34s.vercel.app";
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
    const mailOptions = {
      from: getFromAddress(),
      to: email,
      subject: "Welcome to ARCL Equipment Updates & Technical Alerts!",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to ARCL</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f1f5f9; color: #1e293b;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 30px 10px;">
            <tr>
              <td align="center">
                <table width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #0a192f 0%, #172554 100%); padding: 32px 24px; text-align: center;">
                      <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: 0.5px; margin: 0;">
                        ARCL <span style="color: #38bdf8;">LABORATORY</span>
                      </h1>
                      <p style="color: #93c5fd; font-size: 13px; margin: 6px 0 0 0; text-transform: uppercase; letter-spacing: 1.5px;">
                        Engineering, Calibration & Scientific Solutions
                      </p>
                    </td>
                  </tr>

                  <!-- Body -->
                  <tr>
                    <td style="padding: 32px 28px;">
                      <div style="display: inline-block; background-color: #ecfdf5; color: #059669; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; margin-bottom: 16px;">
                        Subscription Confirmed ✓
                      </div>
                      
                      <h2 style="color: #0f172a; font-size: 20px; font-weight: 700; margin: 0 0 14px 0;">
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
                        <a href="${frontendUrl}/catalog" style="display: inline-block; background: #0284c7; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 14px; padding: 12px 28px; border-radius: 8px; box-shadow: 0 2px 8px rgba(2,132,199,0.3);">
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

    // Fetch all active subscribers
    const activeSubscribers = await Subscriber.find({ isActive: true }).select("email");
    if (!activeSubscribers || activeSubscribers.length === 0) {
      console.log("[EmailService] No active subscribers found for new product broadcast.");
      return;
    }

    const subscriberEmails = activeSubscribers.map((s) => s.email).filter(Boolean);
    if (subscriberEmails.length === 0) return;

    const frontendUrl = getFrontendUrl();
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

    // We send in batches using BCC to respect rate limits and keep subscriber emails private
    const BATCH_SIZE = 50;
    for (let i = 0; i < subscriberEmails.length; i += BATCH_SIZE) {
      const batch = subscriberEmails.slice(i, i + BATCH_SIZE);

      const mailOptions = {
        from: getFromAddress(),
        to: process.env.SMTP_USER || process.env.EMAIL_USER || "info@arcl.com", // Main recipient
        bcc: batch, // Hidden recipients
        subject: `New Equipment Alert: ${productTitle} | ARCL`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Product Alert - ${productTitle}</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #0b132b; color: #1e293b;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0b132b; padding: 30px 10px;">
              <tr>
                <td align="center">
                  <table width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.35); border: 1px solid #1e293b;">
                    
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); padding: 30px 24px; text-align: center;">
                        <span style="background: #38bdf8; color: #0f172a; font-size: 11px; font-weight: 800; letter-spacing: 1px; padding: 3px 10px; border-radius: 12px; text-transform: uppercase;">
                          NEW EQUIPMENT LAUNCH
                        </span>
                        <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 12px 0 4px 0;">
                          ARCL <span style="color: #38bdf8;">LABORATORY</span>
                        </h1>
                        <p style="color: #bfdbfe; font-size: 13px; margin: 0; text-transform: uppercase; letter-spacing: 1px;">
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
                        
                        <h2 style="color: #0f172a; font-size: 22px; font-weight: 800; line-height: 1.3; margin: 0 0 12px 0;">
                          ${productTitle}
                        </h2>

                        <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
                          ${productDesc}
                        </p>

                        <!-- Action Button -->
                        <div style="text-align: center; margin: 28px 0 10px 0;">
                          <a href="${productUrl}" style="display: inline-block; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #ffffff; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 8px; box-shadow: 0 4px 14px rgba(2,132,199,0.35); letter-spacing: 0.3px;">
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
