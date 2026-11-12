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

      {/* Top Company Header (Matching User Image 1) */}
      <div
        style={{
          position: "absolute",
          top: "5.2mm",
          left: "12mm",
          right: "12mm",
          height: "19.2mm",
          display: "flex",
          alignItems: "center",
          gap: "4.5mm",
        }}
      >
        <div
          style={{
            height: "16.8mm",
            padding: "1.2mm 2.2mm",
            backgroundColor: "#ffffff",
            borderRadius: "2.2mm",
            border: "0.35mm solid #CBD5E1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            flexShrink: 0,
          }}
        >
          <img
            src="/assets/LOGO.png"
            onError={(e) => {
              e.currentTarget.src = "/assets/cert_assets/arcl_logo.png";
            }}
            alt="ARCL Instruments Logo"
            style={{
              height: "14.5mm",
              width: "auto",
              maxWidth: "28mm",
              objectFit: "contain",
            }}
          />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: "13.8pt",
              fontWeight: 900,
              color: "#021C57",
              letterSpacing: "0.02em",
              lineHeight: 1.15,
            }}
          >
            {config.headerCompanyName || "ARCL INSTRUMENTS PRIVATE LIMITED"}
          </div>
          {config.showHeaderSubtitle !== false && (
            <div
              style={{
                fontSize: "8.3pt",
                fontWeight: 800,
                color: "#047857",
                marginTop: "1.0mm",
                letterSpacing: "0.015em",
                lineHeight: 1.2,
              }}
            >
              {config.headerSubtitle ||
                "NABL Accredited Calibration Laboratory (CC-4313) • ISO/IEC 17025:2017"}
            </div>
          )}
          <div
            style={{
              fontSize: "7.1pt",
              fontWeight: 500,
              color: "#475569",
              marginTop: "0.8mm",
              letterSpacing: "0.01em",
              lineHeight: 1.2,
            }}
          >
            {config.headerAddress ||
              "Shop No. 6, Siddhivinayak Park CHS, Sector 8A, Airoli, Navi Mumbai - 400708, Maharashtra • GSTIN: 27AATCA7874C1ZB"}
          </div>
        </div>
      </div>

      {/* Header Accent Dividers (Navy + Accent Orange) */}
      <div
        style={{
          position: "absolute",
          top: "24.5mm",
          left: "12mm",
          right: "12mm",
          height: "0.45mm",
          backgroundColor: "#021C57",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "25.3mm",
          left: "12mm",
          right: "12mm",
          height: "0.35mm",
          backgroundColor: "#F58220",
        }}
      />

      {/* LEFT COLUMN: FROM SECTION */}
      <div
        style={{
          position: "absolute",
          top: "30.0mm",
          left: "12mm",
          width: "97mm",
          height: "70mm",
          display: "flex",
          gap: "2.8mm",
          outline: showRulerGuides ? "0.3mm dashed #60a5fa" : "none",
        }}
      >
        <div
          style={{
            width: "1.4mm",
            height: "66mm",
            backgroundColor: "#021C57",
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, fontSize: "8.0pt", color: "#1E293B", lineHeight: 1.35 }}>
          <div
            style={{
              fontSize: "7.5pt",
              fontWeight: 800,
              color: "#1D4ED8",
              letterSpacing: "0.1em",
              marginBottom: "1.2mm",
            }}
          >
            FROM
          </div>
          <div
            style={{
              fontSize: "10.8pt",
              fontWeight: 800,
              color: "#021C57",
              marginBottom: "2.0mm",
            }}
          >
            {config.fromCompanyName}
          </div>

          <div style={{ marginBottom: "2.2mm" }}>
            <div style={{ fontWeight: 700, color: "#021C57", fontSize: "7.8pt" }}>
              Address:
            </div>
            <div style={{ color: "#1E293B", marginTop: "0.4mm" }}>{config.address}</div>
          </div>

          <div style={{ marginBottom: "1.8mm" }}>
            <span style={{ fontWeight: 700, color: "#021C57" }}>Phone: </span>
            <span>{config.phone}</span>
          </div>

          <div style={{ marginBottom: "1.8mm" }}>
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
          top: "30.0mm",
          left: "113mm",
          width: "0.35mm",
          height: "69mm",
          backgroundColor: "#CBD5E1",
        }}
      />

      {/* CENTER COLUMN: TO SECTION */}
      <div
        style={{
          position: "absolute",
          top: "30.0mm",
          left: "120mm",
          width: "108mm",
          height: "69mm",
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
          bottom: "8.5mm",
          left: "12mm",
          right: "12mm",
          height: "9.4mm",
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
          : ["Calibration", "Service", "Sales", "Spares", "Manufacturing"]
        ).map((svc, idx, arr) => (
          <React.Fragment key={svc}>
            <div
              style={{
                flex: 1,
                textAlign: "center",
                fontSize: "9.2pt",
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
                  height: "5.8mm",
                  backgroundColor: "#F58220",
                  flexShrink: 0,
                }}
              />
            )}
          </React.Fragment>
        ))}
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
