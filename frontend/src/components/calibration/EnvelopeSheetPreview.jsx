"use client";

import React from "react";
import { DEFAULT_ENVELOPE_CONFIG } from "../../utils/envelopePdfGenerator.js";

export default function EnvelopeSheetPreview({
  config = DEFAULT_ENVELOPE_CONFIG,
  recipient = null,
  qrImage = null,
  scale = 1,
  showRulerGuides = false,
  elementId = "arcl-envelope-print-sheet",
}) {
  const recCompany = String(recipient?.companyName || "").trim();
  const recContact = String(recipient?.contactPerson || "").trim();
  const recAddress = String(recipient?.address || "").trim();
  const recPhone = String(recipient?.phone || "").trim();
  const hasRecipient = Boolean(recCompany || recContact || recAddress || recPhone);

  return (
    <div
      id={elementId}
      style={{
        width: "280mm",
        height: "124mm",
        transform: `scale(${scale})`,
        transformOrigin: "top left",
        backgroundColor: "#ffffff",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        boxShadow: "0 18px 40px -12px rgba(2, 28, 87, 0.22)",
        border: "0.25mm solid #cbd5e1",
      }}
    >
      {/* Top Corporate Accent Bars */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "3.2mm",
          backgroundColor: "#021C57",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "3.2mm",
          left: 0,
          right: 0,
          height: "0.9mm",
          backgroundColor: "#1D4ED8",
        }}
      />

      {/* Top Company Header: Logo + Full Company Name */}
      <div
        style={{
          position: "absolute",
          top: "5.8mm",
          left: "12mm",
          right: "12mm",
          height: "19.2mm",
          display: "flex",
          alignItems: "center",
          gap: "4.5mm",
          borderBottom: "0.55mm solid #021C57",
          paddingBottom: "2.2mm",
        }}
      >
        <img
          src="/assets/cert_assets/arcl_logo.png"
          onError={(e) => {
            e.currentTarget.src = "/assets/LOGO.png";
          }}
          alt="ARCL Instruments Logo"
          style={{
            height: "15.5mm",
            width: "auto",
            maxWidth: "30mm",
            objectFit: "contain",
            flexShrink: 0,
          }}
        />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: "15.5pt",
              fontWeight: 800,
              color: "#021C57",
              letterSpacing: "0.03em",
              lineHeight: 1.15,
            }}
          >
            {config.headerCompanyName}
          </div>
          {config.showHeaderSubtitle !== false && config.headerSubtitle?.trim() && (
            <div
              style={{
                fontSize: "8.2pt",
                fontWeight: 600,
                color: "#1D4ED8",
                marginTop: "1.1mm",
                letterSpacing: "0.02em",
              }}
            >
              {config.headerSubtitle}
            </div>
          )}
        </div>
      </div>

      {/* Subtle Secondary Blue Accent Rule Under Header */}
      <div
        style={{
          position: "absolute",
          top: "26.4mm",
          left: "12mm",
          right: "12mm",
          height: "0.3mm",
          backgroundColor: "#BFDBFE",
        }}
      />

      {/* LEFT COLUMN: FROM SECTION */}
      <div
        style={{
          position: "absolute",
          top: "31.5mm",
          left: "12mm",
          width: "97mm",
          height: "83mm",
          display: "flex",
          gap: "2.8mm",
          outline: showRulerGuides ? "0.3mm dashed #60a5fa" : "none",
        }}
      >
        <div
          style={{
            width: "1.4mm",
            height: "78mm",
            backgroundColor: "#021C57",
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, fontSize: "8.1pt", color: "#1E293B", lineHeight: 1.35 }}>
          <div
            style={{
              fontSize: "7.5pt",
              fontWeight: 800,
              color: "#1D4ED8",
              letterSpacing: "0.1em",
              marginBottom: "1.4mm",
            }}
          >
            FROM
          </div>
          <div
            style={{
              fontSize: "11pt",
              fontWeight: 800,
              color: "#021C57",
              marginBottom: "2.2mm",
            }}
          >
            {config.fromCompanyName}
          </div>

          <div style={{ marginBottom: "2.4mm" }}>
            <div style={{ fontWeight: 700, color: "#021C57", fontSize: "8pt" }}>
              Address:
            </div>
            <div style={{ color: "#1E293B", marginTop: "0.5mm" }}>{config.address}</div>
          </div>

          <div style={{ marginBottom: "2.0mm" }}>
            <span style={{ fontWeight: 700, color: "#021C57" }}>Phone: </span>
            <span>{config.phone}</span>
          </div>

          <div style={{ marginBottom: "2.0mm" }}>
            <div style={{ fontWeight: 700, color: "#021C57" }}>Email:</div>
            {config.emailPrimary && <div>{config.emailPrimary}</div>}
            {config.emailSecondary && <div>{config.emailSecondary}</div>}
          </div>

          <div>
            <span style={{ fontWeight: 700, color: "#021C57" }}>Website: </span>
            <span style={{ color: "#1D4ED8", fontWeight: 600 }}>{config.website}</span>
          </div>
        </div>
      </div>

      {/* Vertical Divider Between FROM and TO */}
      <div
        style={{
          position: "absolute",
          top: "31.5mm",
          left: "113mm",
          width: "0.35mm",
          height: "83mm",
          backgroundColor: "#CBD5E1",
        }}
      />

      {/* CENTER COLUMN: TO SECTION */}
      <div
        style={{
          position: "absolute",
          top: "31.5mm",
          left: "120mm",
          width: "108mm",
          height: "83mm",
          outline: showRulerGuides ? "0.3mm dashed #60a5fa" : "none",
        }}
      >
        <div
          style={{
            fontSize: "8pt",
            fontWeight: 800,
            color: "#1D4ED8",
            letterSpacing: "0.1em",
            marginBottom: hasRecipient ? "2.4mm" : 0,
          }}
        >
          TO
        </div>

        {hasRecipient && (
          <div style={{ color: "#1E293B", lineHeight: 1.4 }}>
            {recCompany && (
              <div
                style={{
                  fontSize: "11pt",
                  fontWeight: 800,
                  color: "#021C57",
                  marginBottom: "1.6mm",
                }}
              >
                {recCompany}
              </div>
            )}
            {recContact && recContact.toLowerCase() !== recCompany.toLowerCase() && (
              <div
                style={{
                  fontSize: "8.8pt",
                  fontWeight: 700,
                  color: "#334155",
                  marginBottom: "1.4mm",
                }}
              >
                Attn: {recContact}
              </div>
            )}
            {recAddress && (
              <div
                style={{
                  fontSize: "9.2pt",
                  color: "#1E293B",
                  marginBottom: "2.2mm",
                  whiteSpace: "pre-line",
                }}
              >
                {recAddress}
              </div>
            )}
            {recPhone && (
              <div style={{ fontSize: "8.8pt" }}>
                <span style={{ fontWeight: 700, color: "#021C57" }}>Phone: </span>
                <span>{recPhone}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: DEDICATED 32mm x 32mm QR CODE AREA */}
      {showRulerGuides && (
        <div
          className="arcl-no-print"
          style={{
            position: "absolute",
            top: "49mm",
            right: "12mm",
            width: "32mm",
            textAlign: "center",
            fontSize: "6.5pt",
            color: "#64748B",
            fontFamily: "monospace",
          }}
        >
          3.2 × 3.2 cm QR
        </div>
      )}

      <div
        style={{
          position: "absolute",
          top: "53mm",
          right: "12mm",
          width: "32mm",
          height: "32mm",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#ffffff",
          border: qrImage?.dataUrl ? "none" : "0.35mm dotted #94A3B8",
          boxSizing: "border-box",
        }}
      >
        {qrImage?.dataUrl ? (
          <img
            src={qrImage.dataUrl}
            alt="Customer Verification QR Code"
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              width: "auto",
              height: "auto",
              objectFit: "contain",
              display: "block",
            }}
          />
        ) : null}
      </div>

      {/* Permanent Descriptive Caption Under QR Code */}
      <div
        style={{
          position: "absolute",
          top: "86.5mm",
          right: "8mm",
          width: "40mm",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            fontSize: "7.2pt",
            fontWeight: 800,
            color: "#021C57",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            lineHeight: 1.15,
          }}
        >
          SCAN TO VERIFY
        </div>
        <div
          style={{
            fontSize: "6.2pt",
            fontWeight: 700,
            color: "#1D4ED8",
            letterSpacing: "0.03em",
            textTransform: "uppercase",
            marginTop: "0.4mm",
            lineHeight: 1.15,
          }}
        >
          CALIBRATION CERTIFICATES
        </div>
        <div
          style={{
            fontSize: "5.2pt",
            fontWeight: 600,
            color: "#475569",
            marginTop: "0.6mm",
            letterSpacing: "0.02em",
            lineHeight: 1.15,
          }}
        >
          NABL CC-4313 • ISO/IEC 17025
        </div>
        <div
          style={{
            fontSize: "4.8pt",
            fontWeight: 500,
            color: "#64748B",
            marginTop: "0.3mm",
            lineHeight: 1.15,
          }}
        >
          ARCL Instruments Pvt. Ltd.
        </div>
      </div>

      {/* Bottom Corporate Framing Strip */}
      <div
        style={{
          position: "absolute",
          bottom: "2.8mm",
          left: 0,
          right: 0,
          height: "0.8mm",
          backgroundColor: "#1D4ED8",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "2.8mm",
          backgroundColor: "#021C57",
        }}
      />
    </div>
  );
}
