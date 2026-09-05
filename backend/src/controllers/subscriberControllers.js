import Subscriber from "../models/subscriberModel.js";
import Inquiry from "../models/inquiryModel.js";
import Contact from "../models/contactModel.js";
import Campaign from "../models/campaignModel.js";
import cloudinary from "../config/cloudinary.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  sendSubscriberWelcomeEmail,
  sendBulkBroadcastEmail,
} from "../utils/emailService.js";
import { sendBulkSms, cleanPhoneNumber } from "../utils/smsService.js";

/**
 * @desc    Subscribe to new equipment email alerts (Client)
 * @route   POST /api/v1/client/subscribers
 * @access  Public
 */
export const subscribe = asyncHandler(async (req, res) => {
  const { email, source } = req.body;

  if (!email || !email.trim()) {
    throw new ApiError(400, "Email address is required.");
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Check if subscriber exists
  let subscriber = await Subscriber.findOne({ email: normalizedEmail });

  if (subscriber) {
    if (!subscriber.isActive) {
      subscriber.isActive = true;
      await subscriber.save();

      // Trigger welcome / reactivation email asynchronously
      sendSubscriberWelcomeEmail(normalizedEmail).catch((err) => {
        console.error("Welcome email error:", err);
      });

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            subscriber,
            "Your subscription has been reactivated successfully! You will receive new equipment alerts."
          )
        );
    }

    throw new ApiError(
      400,
      "This email is already subscribed to equipment alerts. Duplicate registration is not allowed."
    );
  }

  // Create new subscriber
  subscriber = await Subscriber.create({
    email: normalizedEmail,
    source: source || "website_home_subscription",
    isActive: true,
  });

  // Trigger welcome email asynchronously
  sendSubscriberWelcomeEmail(normalizedEmail).catch((err) => {
    console.error("Welcome email error:", err);
  });

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        subscriber,
        "Thank you for subscribing! You will receive alerts whenever new laboratory equipment is launched."
      )
    );
});

/**
 * @desc    Get all subscribers (Admin)
 * @route   GET /api/v1/admin/subscribers
 * @access  Admin
 */
export const getAllSubscribers = asyncHandler(async (req, res) => {
  const subscribers = await Subscriber.find().sort({ createdAt: -1 });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { count: subscribers.length, subscribers },
        "Subscribers retrieved successfully."
      )
    );
});

/**
 * @desc    Delete a subscriber (Admin)
 * @route   DELETE /api/v1/admin/subscribers/:id
 * @access  Admin
 */
export const deleteSubscriber = asyncHandler(async (req, res) => {
  const subscriber = await Subscriber.findByIdAndDelete(req.params.id);

  if (!subscriber) {
    throw new ApiError(404, "Subscriber not found.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Subscriber deleted successfully."));
});

/**
 * Helper: Upload buffer to Cloudinary with safe Data URI fallback
 */
const uploadImageBuffer = async (fileBuffer, mimetype) => {
  try {
    const secureUrl = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "campaigns" },
        (error, result) => {
          if (error) return reject(error);
          resolve(result.secure_url);
        }
      );
      stream.end(fileBuffer);
    });

    return secureUrl;
  } catch (cloudErr) {
    console.warn(
      "Cloudinary upload failed/credentials not set, using Data URI fallback for campaign image:",
      cloudErr.message
    );
    const base64 = fileBuffer.toString("base64");
    return `data:${mimetype || "image/jpeg"};base64,${base64}`;
  }
};

/**
 * @desc    Get audience segments (reachable phones & emails)
 * @route   GET /api/v1/admin/subscribers/audiences
 * @access  Admin
 */
export const getSmsAudiences = asyncHandler(async (req, res) => {
  const [subscribers, inquiries, contacts] = await Promise.all([
    Subscriber.find({ isActive: true }).select("phone email name"),
    Inquiry.find().select("phone customerName email"),
    Contact.find().select("phone name email"),
  ]);

  const subscriberPhones = subscribers
    .map((s) => cleanPhoneNumber(s.phone))
    .filter(Boolean);
  const subscriberEmails = subscribers
    .map((s) => (s.email || "").trim().toLowerCase())
    .filter((e) => /^\S+@\S+\.\S+$/.test(e));

  const inquiryPhones = inquiries
    .map((i) => cleanPhoneNumber(i.phone))
    .filter(Boolean);
  const inquiryEmails = inquiries
    .map((i) => (i.email || "").trim().toLowerCase())
    .filter((e) => /^\S+@\S+\.\S+$/.test(e));

  const contactPhones = contacts
    .map((c) => cleanPhoneNumber(c.phone))
    .filter(Boolean);
  const contactEmails = contacts
    .map((c) => (c.email || "").trim().toLowerCase())
    .filter((e) => /^\S+@\S+\.\S+$/.test(e));

  const allDistinctPhones = Array.from(
    new Set([...subscriberPhones, ...inquiryPhones, ...contactPhones])
  );
  const allDistinctEmails = Array.from(
    new Set([...subscriberEmails, ...inquiryEmails, ...contactEmails])
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalReachablePhones: allDistinctPhones.length,
        totalReachableEmails: allDistinctEmails.length,
        segments: {
          subscribers: {
            phoneCount: new Set(subscriberPhones).size,
            emailCount: new Set(subscriberEmails).size,
            label: "Active Subscribers",
          },
          inquiries: {
            phoneCount: new Set(inquiryPhones).size,
            emailCount: new Set(inquiryEmails).size,
            label: "Product Quotation Customers",
          },
          contacts: {
            phoneCount: new Set(contactPhones).size,
            emailCount: new Set(contactEmails).size,
            label: "Contact Inquiries Leads",
          },
        },
      },
      "Broadcast audience segments retrieved successfully."
    )
  );
});

/**
 * @desc    Send Multi-Channel Broadcast (SMS, Email, or Both with Image Banner)
 * @route   POST /api/v1/admin/subscribers/send-bulk-sms
 * @access  Admin
 */
export const sendBulkSmsBroadcast = asyncHandler(async (req, res) => {
  let {
    title = "Broadcast Campaign",
    emailSubject = "",
    message,
    channels = ["SMS"], // e.g. ["SMS"], ["EMAIL"], or ["SMS", "EMAIL"]
    targetAudiences = ["subscribers", "inquiries", "contacts"],
    customNumbers = [],
    customEmails = [],
    imageUrl = "",
    ctaLink = "",
    ctaText = "Visit ARCL Instruments",
  } = req.body;

  if (typeof channels === "string") {
    try {
      channels = JSON.parse(channels);
    } catch (e) {
      channels = [channels];
    }
  }

  if (typeof targetAudiences === "string") {
    try {
      targetAudiences = JSON.parse(targetAudiences);
    } catch (e) {
      targetAudiences = targetAudiences.split(",").map((t) => t.trim());
    }
  }

  if (typeof customNumbers === "string") {
    customNumbers = customNumbers.split(/[\n,;]+/).map((n) => n.trim()).filter(Boolean);
  }

  if (typeof customEmails === "string") {
    customEmails = customEmails.split(/[\n,;]+/).map((e) => e.trim().toLowerCase()).filter(Boolean);
  }

  if (!message || !message.trim()) {
    throw new ApiError(400, "Message content is required.");
  }

  // Handle uploaded image banner file if provided via multipart/form-data
  if (req.file) {
    imageUrl = await uploadImageBuffer(req.file.buffer, req.file.mimetype);
  }

  const phoneNumbersToTarget = [];
  const emailsToTarget = [];

  // 1. GATHER AUDIENCES
  if (targetAudiences.includes("subscribers")) {
    const subList = await Subscriber.find({ isActive: true }).select("phone email");
    subList.forEach((s) => {
      const p = cleanPhoneNumber(s.phone);
      if (p) phoneNumbersToTarget.push(p);
      if (s.email && /^\S+@\S+\.\S+$/.test(s.email)) emailsToTarget.push(s.email.toLowerCase().trim());
    });
  }

  if (targetAudiences.includes("inquiries")) {
    const inqList = await Inquiry.find().select("phone email");
    inqList.forEach((i) => {
      const p = cleanPhoneNumber(i.phone);
      if (p) phoneNumbersToTarget.push(p);
      if (i.email && /^\S+@\S+\.\S+$/.test(i.email)) emailsToTarget.push(i.email.toLowerCase().trim());
    });
  }

  if (targetAudiences.includes("contacts")) {
    const conList = await Contact.find().select("phone email");
    conList.forEach((c) => {
      const p = cleanPhoneNumber(c.phone);
      if (p) phoneNumbersToTarget.push(p);
      if (c.email && /^\S+@\S+\.\S+$/.test(c.email)) emailsToTarget.push(c.email.toLowerCase().trim());
    });
  }

  // 2. ADD CUSTOM RECIPIENTS
  if (Array.isArray(customNumbers)) {
    customNumbers.forEach((n) => {
      const p = cleanPhoneNumber(n);
      if (p) phoneNumbersToTarget.push(p);
    });
  }

  if (Array.isArray(customEmails)) {
    customEmails.forEach((e) => {
      if (e && /^\S+@\S+\.\S+$/.test(e)) emailsToTarget.push(e.toLowerCase().trim());
    });
  }

  const uniquePhones = Array.from(new Set(phoneNumbersToTarget));
  const uniqueEmails = Array.from(new Set(emailsToTarget));

  const shouldSendSms = channels.includes("SMS");
  const shouldSendEmail = channels.includes("EMAIL");

  if (!shouldSendSms && !shouldSendEmail) {
    throw new ApiError(400, "Please select at least one dispatch channel (SMS or Email).");
  }

  if (shouldSendSms && uniquePhones.length === 0 && (!shouldSendEmail || uniqueEmails.length === 0)) {
    throw new ApiError(400, "No valid phone numbers found for the selected audiences.");
  }

  if (shouldSendEmail && uniqueEmails.length === 0 && (!shouldSendSms || uniquePhones.length === 0)) {
    throw new ApiError(400, "No valid email addresses found for the selected audiences.");
  }

  let smsResult = { total: 0, successCount: 0, failedCount: 0 };
  let emailResult = { total: 0, successCount: 0, failedCount: 0 };

  // 3. DISPATCH SMS
  if (shouldSendSms && uniquePhones.length > 0) {
    // If image is present and not a data URI, we can append link if desired
    let smsMessage = message.trim();
    if (imageUrl && !imageUrl.startsWith("data:") && !smsMessage.includes(imageUrl)) {
      smsMessage = `${smsMessage}\n\nView Banner: ${imageUrl}`;
    }

    smsResult = await sendBulkSms({
      numbers: uniquePhones,
      message: smsMessage,
    });
  }

  // 4. DISPATCH EMAIL
  if (shouldSendEmail && uniqueEmails.length > 0) {
    emailResult = await sendBulkBroadcastEmail({
      recipients: uniqueEmails,
      subject: emailSubject?.trim() || title?.trim() || "Announcement from ARCL Instruments",
      title: title?.trim() || "Announcement from ARCL Instruments",
      message: message.trim(),
      imageUrl: imageUrl || "",
      imageBuffer: req.file ? req.file.buffer : null,
      imageMime: req.file ? req.file.mimetype : "image/jpeg",
      ctaLink: ctaLink?.trim() || "",
      ctaText: ctaText?.trim() || "Visit ARCL Instruments",
    });
  }

  // 5. LOG CAMPAIGN RECORD
  const campaignChannel =
    shouldSendSms && shouldSendEmail
      ? "MULTI_CHANNEL"
      : shouldSendEmail
      ? "EMAIL"
      : "SMS";

  const totalRecipients = (shouldSendSms ? uniquePhones.length : 0) + (shouldSendEmail ? uniqueEmails.length : 0);
  const totalSuccess = (smsResult.successCount || 0) + (emailResult.successCount || 0);
  const totalFailed = (smsResult.failedCount || 0) + (emailResult.failedCount || 0);

  const campaign = await Campaign.create({
    title: title.trim(),
    emailSubject: emailSubject?.trim() || title.trim(),
    message: message.trim(),
    imageUrl: imageUrl || "",
    channel: campaignChannel,
    targetAudiences,
    totalRecipients,
    smsSuccessCount: smsResult.successCount || 0,
    smsFailedCount: smsResult.failedCount || 0,
    emailSuccessCount: emailResult.successCount || 0,
    emailFailedCount: emailResult.failedCount || 0,
    recipientNumbers: uniquePhones,
    recipientEmails: uniqueEmails,
    status:
      totalFailed === 0
        ? "sent"
        : totalSuccess > 0
        ? "partial"
        : "failed",
    sentBy: req.user?._id || null,
  });

  let responseMessage = `Broadcast completed! Delivered to ${totalSuccess} recipients (${smsResult.successCount || 0} SMS, ${emailResult.successCount || 0} Emails).`;

  if (emailResult.simulated) {
    responseMessage = `Broadcast processed! Note: SMTP credentials are not configured in backend/.env, so emails were simulated in development. Configure SMTP_USER and SMTP_PASS to send real emails.`;
  } else if (emailResult.error) {
    responseMessage = `Broadcast completed with warnings: ${emailResult.error}`;
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        campaign,
        stats: {
          sms: smsResult,
          email: emailResult,
          totalRecipients,
          totalSuccess,
          totalFailed,
        },
        warning: emailResult.error || (emailResult.simulated ? "SMTP_NOT_CONFIGURED" : null),
      },
      responseMessage
    )
  );
});

/**
 * @desc    Get Bulk campaign broadcast logs
 * @route   GET /api/v1/admin/subscribers/campaigns
 * @access  Admin
 */
export const getSmsCampaigns = asyncHandler(async (req, res) => {
  const campaigns = await Campaign.find()
    .sort({ createdAt: -1 })
    .limit(50);

  return res.status(200).json(
    new ApiResponse(
      200,
      { count: campaigns.length, campaigns },
      "Campaign history retrieved successfully."
    )
  );
});
