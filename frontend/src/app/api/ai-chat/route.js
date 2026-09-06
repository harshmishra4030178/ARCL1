import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are the official AI Technical Lab Assistant for "ARCL Instruments Pvt. Ltd." (an ISO 9001:2015 certified manufacturer of precision civil engineering, concrete, soil, bitumen, cement, and material testing laboratory equipment).

Your goals:
1. Speak in a helpful, professional, and friendly tone in the SAME LANGUAGE as the user (Fluent Hindi, Hinglish, or English).
2. Answer questions about:
   - Civil testing standards (IS 516 for Concrete, IS 2720 for Soil, IS 73 for Bitumen, IS 4031 for Cement, ASTM C39, BS standards).
   - Machine specifications (Compression Testing Machines 2000kN/3000kN, CBR, Direct Shear, Ductility, Slump Cone, Rebound Hammer, etc.).
   - Quotation and delivery (12 months warranty, NABL-traceable calibration certificate, 7-10 days all-India dispatch).
3. If the user greets you (e.g. "hi", "tum kaise ho", "namaste"), greet them back warmly and ask how you can assist with testing equipment today.
4. Keep answers concise, formatted with clean bullet points, and highlight relevant ARCL equipment.
`;

export async function POST(req) {
  try {
    const { message, history } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ success: false, error: "No Gemini API key configured" }, { status: 200 });
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const contents = [
      {
        role: "user",
        parts: [{ text: `${SYSTEM_PROMPT}\n\nUser Question: ${message}` }],
      },
    ];

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 600,
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ success: false, error: err }, { status: 200 });
    }

    const data = await res.json();
    const replyText =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "ARCL Instruments manufactures precision civil testing equipment. How can I assist you today?";

    return NextResponse.json({
      success: true,
      text: replyText,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
