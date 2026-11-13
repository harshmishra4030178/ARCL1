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
          backgroundColor: "#F58220",
        }}
      />

      {/* Top Company Header (Matching User Request) */}
      <div
        style={{
          position: "absolute",
          top: "4.8mm",
          left: "12mm",
          right: "12mm",
          height: "21.5mm",
          display: "flex",
          alignItems: "center",
          gap: "4.5mm",
          zIndex: 2,
        }}
      >
        <div
          style={{
            height: "20.8mm",
            width: "29mm",
            padding: "1.2mm 2.2mm",
            backgroundColor: "#ffffff",
            borderRadius: "2.2mm",
            border: "0.35mm solid #CBD5E1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            flexShrink: 0,
            boxSizing: "border-box",
          }}
        >
          <img
            src="/assets/LOGO.png"
            onError={(e) => {
              e.currentTarget.src = "/assets/cert_assets/arcl_logo.png";
            }}
            alt="ARCL Instruments Logo"
            style={{
              height: "17.5mm",
              width: "auto",
              maxWidth: "26mm",
              objectFit: "contain",
            }}
          />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: "20.5pt",
              fontWeight: 900,
              color: "#021C57",
              letterSpacing: "0.015em",
              lineHeight: 1.12,
            }}
          >
            {config.headerCompanyName || "ARCL INSTRUMENTS PRIVATE LIMITED"}
          </div>
          {config.showHeaderSubtitle !== false && (
            <div
              style={{
                fontSize: "9.8pt",
                fontWeight: 800,
                color: "#047857",
                marginTop: "0.6mm",
                letterSpacing: "0.012em",
                lineHeight: 1.15,
              }}
            >
              {config.headerSubtitle ||
                "NABL Accredited Calibration Laboratory (CC-4313) • ISO/IEC 17025:2017"}
            </div>
          )}
          <div
            style={{
              fontSize: "8.6pt",
              fontWeight: 500,
              color: "#334155",
              marginTop: "0.6mm",
              letterSpacing: "0.006em",
              lineHeight: 1.15,
            }}
          >
            {config.headerAddress ||
              "Shop No. 6, Siddhivinayak Park CHS, Sector 8A, Airoli, Navi Mumbai - 400708, Maharashtra • GSTIN: 27AATCA7874C1ZB"}
          </div>
          {/* Header Contact Row with Phone, Mail and Web Icons */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "2.4mm",
              marginTop: "0.8mm",
              fontSize: "8.0pt",
              lineHeight: 1.15,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1.2mm", color: "#021C57", fontWeight: 700 }}>
              <img
                src="/assets/cert_assets/icon_phone.png"
                alt="Phone"
                style={{ width: "2.8mm", height: "2.8mm", objectFit: "contain" }}
              />
              <span>{config.phone || "+91 81696 95728"}</span>
            </div>
            <span style={{ color: "#F58220", fontWeight: 700 }}>|</span>
            <div style={{ display: "flex", alignItems: "center", gap: "1.2mm", color: "#021C57", fontWeight: 700 }}>
              <img
                src="/assets/cert_assets/icon_mail.png"
                alt="Email"
                style={{ width: "2.8mm", height: "2.8mm", objectFit: "contain" }}
              />
              <span>{config.email || config.emailPrimary || "info@arclinstruments.com"}</span>
            </div>
            <span style={{ color: "#F58220", fontWeight: 700 }}>|</span>
            <div style={{ display: "flex", alignItems: "center", gap: "1.2mm", color: "#1D4ED8", fontWeight: 700 }}>
              <img
                src="/assets/cert_assets/icon_web.png"
                alt="Website"
                style={{ width: "2.8mm", height: "2.8mm", objectFit: "contain" }}
              />
              <span>{config.website || "https://arclinstruments.com/"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Header Accent Dividers (Navy + Accent Orange) */}
      <div
        style={{
          position: "absolute",
          top: "26.8mm",
          left: "12mm",
          right: "12mm",
          height: "0.45mm",
          backgroundColor: "#021C57",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "27.6mm",
          left: "12mm",
          right: "12mm",
          height: "0.35mm",
          backgroundColor: "#F58220",
        }}
      />

      {/* Background Watermark (ARCL Logo Faint Centered Behind Recipient Area) */}
      <div
        style={{
          position: "absolute",
          top: "27mm",
          left: "71mm",
          width: "138mm",
          height: "79mm",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
          zIndex: 1,
        }}
      >
        <img
          src="/assets/cert_assets/arcl_watermark.png"
          alt="ARCL Watermark"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
        />
      </div>

      {/* CENTER/LEFT ZONE: TO SECTION (ONLY SECTION IN BODY - FROM REMOVED) */}
      <div
        style={{
          position: "absolute",
          top: "32.5mm",
          left: "18mm",
          width: "205mm",
          height: "65mm",
          outline: showRulerGuides ? "0.3mm dashed #60a5fa" : "none",
          zIndex: 2,
        }}
      >
        <div
          style={{
            fontSize: "10pt",
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
                  fontSize: "13pt",
                  fontWeight: 800,
                  color: "#021C57",
                  marginBottom: "1.8mm",
                }}
              >
                {recCompany}
              </div>
            )}
            {recContact && recContact.toLowerCase() !== recCompany.toLowerCase() && (
              <div
                style={{
                  fontSize: "10pt",
                  fontWeight: 700,
                  color: "#334155",
                  marginBottom: "1.6mm",
                }}
              >
                Attn: {recContact}
              </div>
            )}
            {recAddress && (
              <div
                style={{
                  fontSize: "10.2pt",
                  color: "#1E293B",
                  marginBottom: "2.4mm",
                  whiteSpace: "pre-line",
                  lineHeight: 1.4,
                }}
              >
                {recAddress}
              </div>
            )}
            {recPhone && (
              <div style={{ fontSize: "9.8pt" }}>
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
            top: "43.5mm",
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
          top: "47.5mm",
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
          top: "82.5mm",
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
            marginTop: "0.5mm",
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

      {/* FOOTER SERVICES SECTION (Matching User Image 2) */}
      <div
        style={{
          position: "absolute",
          bottom: "14.5mm",
          left: "12mm",
          right: "12mm",
          height: "8.8mm",
          border: "0.65mm solid #F58220",
          borderRadius: "1.8mm",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#ffffff",
          boxSizing: "border-box",
        }}
      >
        {(Array.isArray(config.footerServices) && config.footerServices.length > 0
          ? config.footerServices
          : ["Calibration", "Manufacturing", "Sales", "Service", "Spares"]
        ).map((svc, idx, arr) => (
          <React.Fragment key={svc}>
            <div
              style={{
                flex: 1,
                textAlign: "center",
                fontSize: "9.0pt",
                fontWeight: 800,
                color: "#021C57",
                letterSpacing: "0.02em",
              }}
            >
              {svc}
            </div>
            {idx < arr.length - 1 && (
              <div
                style={{
                  width: "0.55mm",
                  height: "5.5mm",
                  backgroundColor: "#F58220",
                  flexShrink: 0,
                }}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Thank You & Customer Courtesy Strip (Below Services Box - User Marked Area) */}
      <div
        style={{
          position: "absolute",
          bottom: "4.5mm",
          left: "12mm",
          right: "12mm",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.5mm",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            fontSize: "6.9pt",
            fontWeight: 800,
            color: "#021C57",
            letterSpacing: "0.02em",
            lineHeight: 1.15,
          }}
        >
          {config.footerThankYouTitle ||
            "Thank You for Choosing ARCL Instruments! We Greatly Value Your Trust & Association."}
        </div>
        <div
          style={{
            fontSize: "5.8pt",
            fontWeight: 500,
            color: "#475569",
            letterSpacing: "0.01em",
            lineHeight: 1.15,
          }}
        >
          {config.footerThankYouSubtitle ||
            "For any new requirements, calibration, servicing, spares, or technical support, please feel free to contact us."}
        </div>
      </div>

      {/* Bottom Corporate Framing Strip */}
      <div
        style={{
          position: "absolute",
          bottom: "2.6mm",
          left: 0,
          right: 0,
          height: "0.8mm",
          backgroundColor: "#F58220",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "2.6mm",
          backgroundColor: "#021C57",
        }}
      />
    </div>
  );
}
