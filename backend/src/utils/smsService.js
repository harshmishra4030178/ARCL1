/**
 * SMS Dispatch Service for ARCL Instruments
 * Supports Twilio, Fast2SMS, custom HTTP SMS Webhooks, and automatic Dev Simulator.
 */

// Format and normalize phone numbers
export function cleanPhoneNumber(rawPhone = "") {
  if (!rawPhone || typeof rawPhone !== "string") return null;

  // Remove whitespace, dashes, parentheses
  let cleaned = rawPhone.replace(/[\s\-\(\)]/g, "").trim();

  // If starts with 0, strip leading 0
  if (cleaned.startsWith("0") && cleaned.length === 11) {
    cleaned = cleaned.substring(1);
  }

  // If standard 10 digit Indian number, prefix with +91
  if (/^\d{10}$/.test(cleaned)) {
    cleaned = `+91${cleaned}`;
  }

  // Ensure minimum valid phone length (e.g. +919876543210 is 13 chars)
  if (cleaned.length < 10) return null;

  return cleaned;
}

/**
 * Send a single SMS to a phone number
 */
export async function sendSingleSms(phone, message) {
  const normalizedPhone = cleanPhoneNumber(phone);
  if (!normalizedPhone) {
    return { success: false, phone, error: "Invalid phone number format" };
  }

  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_PHONE_NUMBER;
  const fast2SmsKey = process.env.FAST2SMS_API_KEY;
  const genericSmsUrl = process.env.SMS_GATEWAY_URL;

  try {
    // 1. FAST2SMS GATEWAY (Common for India)
    if (fast2SmsKey) {
      const numericPhone = normalizedPhone.replace(/^\+91/, "").replace(/\D/g, "");
      const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
        method: "POST",
        headers: {
          authorization: fast2SmsKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          route: "v3",
          sender_id: "TXTIND",
          message,
          language: "english",
          flash: 0,
          numbers: numericPhone,
        }),
      });
      const data = await res.json();
      return { success: data.return === true, phone: normalizedPhone, response: data };
    }

    // 2. TWILIO GATEWAY
    if (twilioSid && twilioToken && twilioFrom) {
      const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64");
      const body = new URLSearchParams({
        To: normalizedPhone,
        From: twilioFrom,
        Body: message,
      });

      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: body.toString(),
        }
      );
      const data = await res.json();
      return { success: !data.error_code, phone: normalizedPhone, response: data };
    }

    // 3. GENERIC HTTP SMS API GATEWAY
    if (genericSmsUrl) {
      const res = await fetch(genericSmsUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalizedPhone, message }),
      });
      const data = await res.json();
      return { success: res.ok, phone: normalizedPhone, response: data };
    }

    // 4. DEVELOPMENT SIMULATOR FALLBACK
    console.log(`[SMS Simulator] Dispatched SMS to ${normalizedPhone}: "${message}"`);
    return {
      success: true,
      phone: normalizedPhone,
      simulated: true,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`SMS send error to ${normalizedPhone}:`, error);
    return { success: false, phone: normalizedPhone, error: error.message };
  }
}

/**
 * Send bulk SMS to a list of phone numbers
 */
export async function sendBulkSms({ numbers = [], message = "" }) {
  if (!Array.isArray(numbers) || numbers.length === 0) {
    return { total: 0, successCount: 0, failedCount: 0, results: [] };
  }

  // Deduplicate and clean numbers
  const uniqueNumbers = Array.from(
    new Set(numbers.map((n) => cleanPhoneNumber(n)).filter(Boolean))
  );

  const results = [];
  let successCount = 0;
  let failedCount = 0;

  // Process in concurrent batches of 10
  const batchSize = 10;
  for (let i = 0; i < uniqueNumbers.length; i += batchSize) {
    const batch = uniqueNumbers.slice(i, i + batchSize);
    const batchPromises = batch.map((phone) => sendSingleSms(phone, message));
    const batchResults = await Promise.all(batchPromises);

    batchResults.forEach((res) => {
      results.push(res);
      if (res.success) successCount++;
      else failedCount++;
    });
  }

  return {
    total: uniqueNumbers.length,
    successCount,
    failedCount,
    results,
    recipients: uniqueNumbers,
  };
}
