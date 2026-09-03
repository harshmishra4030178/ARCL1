import { NextResponse } from "next/server";
import { connectDB } from "../../../../backend_lib/config/db.js";
import app from "../../../../backend_lib/app.js";
import { IncomingMessage, ServerResponse } from "node:http";
import { Socket } from "node:net";

export const dynamic = "force-dynamic";

async function handler(req) {
  try {
    await connectDB();
  } catch (err) {
    console.error("Database connection error in API route:", err);
    return NextResponse.json(
      { success: false, message: "Database connection failed", error: err.message },
      { status: 500 }
    );
  }

  return new Promise(async (resolve) => {
    const socket = new Socket();
    const httpReq = new IncomingMessage(socket);

    const url = new URL(req.url);
    httpReq.method = req.method;
    httpReq.url = url.pathname + url.search;
    httpReq.headers = Object.fromEntries(req.headers.entries());

    let bodyBuffer = null;
    if (req.method !== "GET" && req.method !== "HEAD") {
      try {
        const arrayBuffer = await req.arrayBuffer();
        bodyBuffer = Buffer.from(arrayBuffer);
      } catch (e) {
        console.warn("Could not parse request body buffer:", e);
      }
    }

    const httpRes = new ServerResponse(httpReq);
    const chunks = [];

    httpRes.write = function (chunk) {
      if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      return true;
    };

    httpRes.end = function (chunk) {
      if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      const body = Buffer.concat(chunks);
      const headers = new Headers();

      for (const [key, val] of Object.entries(httpRes.getHeaders())) {
        if (Array.isArray(val)) {
          val.forEach((v) => headers.append(key, v));
        } else if (val !== undefined) {
          headers.set(key, String(val));
        }
      }

      resolve(
        new NextResponse(body, {
          status: httpRes.statusCode || 200,
          statusText: httpRes.statusMessage || "OK",
          headers,
        })
      );
    };

    app(httpReq, httpRes);

    if (bodyBuffer && bodyBuffer.length > 0) {
      httpReq.push(bodyBuffer);
      httpReq.push(null);
    } else {
      httpReq.push(null);
    }
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
