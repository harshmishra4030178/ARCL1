"use client";

import React from "react";
import {
  BACKGROUND_THEMES,
  DEFAULT_ENVELOPE_CONFIG,
  getHexLuminance,
  hexToRgb,
} from "../../utils/envelopePdfGenerator.js";

export default function EnvelopeSheetPreview({
  config = DEFAULT_ENVELOPE_CONFIG,
  recipient = null,
  qrImage = null,
  scale = 1,
  showRulerGuides = false,
  elementId = "arcl-envelope-print-sheet",
  widthMm = 280,
  heightMm = 124,
}) {
  const actualW = Number(widthMm || config?.widthMm || 280);
  const actualH = Number(heightMm || config?.heightMm || 124);
  const scaleRatio = Math.min(1.25, Math.max(0.72, actualW / 280));
  const qrSizeMm = Math.min(32, Math.max(20, actualH * 0.25));
  const marginX = Math.min(12, actualW * 0.05);
  const headerBottomY = Math.min(27.5, actualH * 0.23);

  const qrX = actualW - marginX - qrSizeMm;
  const qrY = Math.max(headerBottomY + 6, (actualH - qrSizeMm) / 2 - 4);
  const toX = 18;
  const toMaxW = Math.max(70, qrX - toX - 10);

  const wmW = Math.min(138, actualW * 0.52);
  const wmH = wmW * (79 / 138);
  const wmX = (actualW - wmW) / 2;
  const wmY = Math.max(26, (actualH - wmH) / 2 - 3);

  const footerH = Math.min(8.2, Math.max(6.2, actualH * 0.068));
  const footerBottomMm = 10.2;
  const thankBottomMm = 3.6;

  const recCompany = String(recipient?.companyName || "").trim();
  const recContact = String(recipient?.contactPerson || "").trim();
  const recAddress = String(recipient?.address || "").trim();
  const recPhone = String(recipient?.phone || "").trim();
  const hasRecipient = Boolean(recCompany || recContact || recAddress || recPhone);

  const bgTheme = config?.backgroundTheme || "classic_white";
  const themeObj = BACKGROUND_THEMES.find((t) => t.id === bgTheme) || null;
  const isThemeWhite =
    bgTheme === "classic_white" ||
    (bgTheme === "custom" &&
      config?.customBgMode === "solid" &&
      String(config?.customColorSolid || "").trim().toLowerCase() === "#ffffff");

  let bgStyle = "#ffffff";
  if (bgTheme === "classic_white") {
    bgStyle = "#ffffff";
  } else if (bgTheme === "amber_emerald_vibrant") {
    bgStyle = "linear-gradient(135deg, #f59e0b 0%, #84cc16 45%, #10b981 100%)";
  } else if (bgTheme === "custom") {
    if (config?.customBgMode === "solid") {
      bgStyle = config?.customColorSolid || "#ffffff";
    } else {
      const start = config?.customColorStart || "#F59E0B";
      const end = config?.customColorEnd || "#10B981";
      bgStyle = `linear-gradient(135deg, ${start} 0%, ${end} 100%)`;
    }
  } else if (themeObj?.gradientCss) {
    bgStyle = themeObj.gradientCss;
  } else if (themeObj?.startColor && themeObj?.endColor) {
    bgStyle = `linear-gradient(135deg, ${themeObj.startColor} 0%, ${themeObj.endColor} 100%)`;
  }

  let headerLum = 255;
  let footerLum = 255;
  if (bgTheme === "amber_emerald_vibrant") {
    headerLum = 167;
    footerLum = 150;
  } else if (bgTheme === "custom") {
    if (config?.customBgMode === "solid") {
      const lum = getHexLuminance(config?.customColorSolid || "#FFFFFF");
      headerLum = lum;
      footerLum = lum;
    } else {
      headerLum = getHexLuminance(config?.customColorStart || "#F59E0B");
      const startRgb = hexToRgb(config?.customColorStart || "#F59E0B");
      const endRgb = hexToRgb(config?.customColorEnd || "#10B981");
      const midR = (startRgb.r + endRgb.r) / 2;
      const midG = (startRgb.g + endRgb.g) / 2;
      const midB = (startRgb.b + endRgb.b) / 2;
      footerLum = 0.299 * midR + 0.587 * midG + 0.114 * midB;
    }
  } else if (themeObj?.startColor && themeObj?.endColor) {
    headerLum = getHexLuminance(themeObj.startColor);
    const startRgb = hexToRgb(themeObj.startColor);
    const endRgb = hexToRgb(themeObj.endColor);
    const midR = (startRgb.r + endRgb.r) / 2;
    const midG = (startRgb.g + endRgb.g) / 2;
    const midB = (startRgb.b + endRgb.b) / 2;
    footerLum = 0.299 * midR + 0.587 * midG + 0.114 * midB;
  }

  const isDarkHeader = headerLum < 140;
  const isDarkFooter = footerLum < 140;

  return (
    <div
      id={elementId}
      style={{
        width: `${actualW}mm`,
        height: `${actualH}mm`,
        transform: `scale(${scale})`,
        transformOrigin: "top left",
        background: bgStyle,
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
          left: `${marginX}mm`,
          right: `${marginX}mm`,
          height: `${headerBottomY - 5.0}mm`,
          display: "flex",
          alignItems: "center",
          gap: "4.0mm",
          zIndex: 2,
        }}
      >
        <div
          style={{
            height: `${Math.min(20.8, 20.8 * scaleRatio)}mm`,
            width: `${Math.min(29, 29 * scaleRatio)}mm`,
            padding: "1.2mm 2.0mm",
            backgroundColor: "#ffffff",
            borderRadius: "2.0mm",
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
              height: `${Math.min(17.5, 17.5 * scaleRatio)}mm`,
              width: "auto",
              maxWidth: `${Math.min(26, 26 * scaleRatio)}mm`,
              objectFit: "contain",
            }}
          />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: `${Math.max(14, 20.5 * scaleRatio)}pt`,
              fontWeight: 900,
              color: isDarkHeader ? "#FFFFFF" : "#021C57",
              letterSpacing: "0.015em",
              lineHeight: 1.12,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {config.headerCompanyName || "ARCL INSTRUMENTS PRIVATE LIMITED"}
          </div>
          {config.showHeaderSubtitle !== false && (
            <div
              style={{
                fontSize: `${Math.max(7.5, 9.8 * scaleRatio)}pt`,
                fontWeight: 800,
                color: isDarkHeader ? "#6EE7B7" : "#047857",
                marginTop: "0.6mm",
                letterSpacing: "0.012em",
                lineHeight: 1.15,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {config.headerSubtitle ||
                "NABL Accredited Calibration Laboratory (CC-4313) • ISO/IEC 17025:2017"}
            </div>
          )}
          <div
            style={{
              fontSize: `${Math.max(6.8, 8.6 * scaleRatio)}pt`,
              fontWeight: 500,
              color: isDarkHeader ? "#E2E8F0" : "#334155",
              marginTop: "0.6mm",
              letterSpacing: "0.006em",
              lineHeight: 1.15,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
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
              fontSize: `${Math.max(6.5, 8.0 * scaleRatio)}pt`,
              lineHeight: 1.15,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1.2mm", color: isDarkHeader ? "#FFFFFF" : "#021C57", fontWeight: 700 }}>
              <img
                src="/assets/cert_assets/icon_phone.png"
                alt="Phone"
                style={{ width: "2.8mm", height: "2.8mm", objectFit: "contain" }}
              />
              <span>{config.phone || "+91 81696 95728"}</span>
            </div>
            <span style={{ color: "#F58220", fontWeight: 700 }}>|</span>
            <div style={{ display: "flex", alignItems: "center", gap: "1.2mm", color: isDarkHeader ? "#FFFFFF" : "#021C57", fontWeight: 700 }}>
              <img
                src="/assets/cert_assets/icon_mail.png"
                alt="Email"
                style={{ width: "2.8mm", height: "2.8mm", objectFit: "contain" }}
              />
              <span>{config.email || config.emailPrimary || "info@arclinstruments.com"}</span>
            </div>
            <span style={{ color: "#F58220", fontWeight: 700 }}>|</span>
            <div style={{ display: "flex", alignItems: "center", gap: "1.2mm", color: isDarkHeader ? "#93C5FD" : "#1D4ED8", fontWeight: 700 }}>
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
          top: `${headerBottomY}mm`,
          left: `${marginX}mm`,
          right: `${marginX}mm`,
          height: "0.45mm",
          backgroundColor: isDarkHeader ? "rgba(255, 255, 255, 0.7)" : "#021C57",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: `${headerBottomY + 0.8}mm`,
          left: `${marginX}mm`,
          right: `${marginX}mm`,
          height: "0.35mm",
          backgroundColor: "#F58220",
        }}
      />

      {/* Background Watermark (ARCL Logo Faint Centered Behind Recipient Area - on classic white envelopes) */}
      {isThemeWhite && (
        <div
          style={{
            position: "absolute",
            top: `${wmY}mm`,
            left: `${wmX}mm`,
            width: `${wmW}mm`,
            height: `${wmH}mm`,
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
      )}

      {/* CENTER/LEFT ZONE: TO SECTION (ONLY SECTION IN BODY - FROM REMOVED) */}
      <div
        style={{
          position: "absolute",
          top: `${headerBottomY + 5.5}mm`,
          left: `${toX}mm`,
          width: `${toMaxW}mm`,
          height: `${actualH - headerBottomY - footerBottomMm - 10}mm`,
          outline: showRulerGuides ? "0.3mm dashed #60a5fa" : "none",
          backgroundColor: !isThemeWhite ? "#ffffff" : "transparent",
          borderRadius: !isThemeWhite ? "3.0mm" : 0,
          padding: !isThemeWhite ? "3.2mm 4.5mm" : 0,
          boxShadow: !isThemeWhite ? "0 4px 14px rgba(0,0,0,0.06)" : "none",
          boxSizing: "border-box",
          zIndex: 2,
        }}
      >
        <div
          style={{
            fontSize: `${Math.max(8.5, 10.0 * scaleRatio)}pt`,
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
                  fontSize: `${Math.max(10.5, 13.0 * scaleRatio)}pt`,
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
                  fontSize: `${Math.max(8.5, 10.0 * scaleRatio)}pt`,
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
                  fontSize: `${Math.max(8.5, 10.2 * scaleRatio)}pt`,
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
              <div style={{ fontSize: `${Math.max(8.0, 9.8 * scaleRatio)}pt` }}>
                <span style={{ fontWeight: 700, color: "#021C57" }}>Phone: </span>
                <span>{recPhone}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: DEDICATED QR CODE AREA */}
      {!isThemeWhite && (
        <div
          style={{
            position: "absolute",
            top: `${headerBottomY + 5.5}mm`,
            left: `${qrX - 4.0}mm`,
            width: `${qrSizeMm + 8.0}mm`,
            height: `${actualH - headerBottomY - footerBottomMm - 10}mm`,
            backgroundColor: "#ffffff",
            borderRadius: "3.0mm",
            boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
            zIndex: 1,
          }}
        />
      )}

      {showRulerGuides && (
        <div
          className="arcl-no-print"
          style={{
            position: "absolute",
            top: `${qrY - 4.0}mm`,
            left: `${qrX}mm`,
            width: `${qrSizeMm}mm`,
            textAlign: "center",
            fontSize: "6.5pt",
            color: "#64748B",
            fontFamily: "monospace",
          }}
        >
          {(qrSizeMm / 10).toFixed(1)} × {(qrSizeMm / 10).toFixed(1)} cm QR
        </div>
      )}

      <div
        style={{
          position: "absolute",
          top: `${qrY}mm`,
          left: `${qrX}mm`,
          width: `${qrSizeMm}mm`,
          height: `${qrSizeMm}mm`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#ffffff",
          border: qrImage?.dataUrl ? "none" : "0.35mm dotted #94A3B8",
          boxSizing: "border-box",
          zIndex: 2,
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
          top: `${qrY + qrSizeMm + 3.0}mm`,
          left: `${qrX - 4.0}mm`,
          width: `${qrSizeMm + 8.0}mm`,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          pointerEvents: "none",
          zIndex: 2,
        }}
      >
        <div
          style={{
            fontSize: `${Math.max(5.8, 7.2 * scaleRatio)}pt`,
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
            fontSize: `${Math.max(5.0, 6.2 * scaleRatio)}pt`,
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
            fontSize: `${Math.max(4.5, 5.2 * scaleRatio)}pt`,
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
            fontSize: `${Math.max(4.0, 4.8 * scaleRatio)}pt`,
            fontWeight: 500,
            color: "#64748B",
            marginTop: "0.3mm",
            lineHeight: 1.15,
          }}
        >
          ARCL Instruments Pvt. Ltd.
        </div>
      </div>

      {/* FOOTER SERVICES SECTION */}
      <div
        style={{
          position: "absolute",
          bottom: `${footerBottomMm}mm`,
          left: `${marginX}mm`,
          right: `${marginX}mm`,
          height: `${footerH}mm`,
          border: "0.65mm solid #F58220",
          borderRadius: "1.8mm",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#ffffff",
          boxSizing: "border-box",
          zIndex: 2,
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
                fontSize: `${Math.max(6.8, 9.0 * scaleRatio)}pt`,
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
                  height: `${footerH * 0.65}mm`,
                  backgroundColor: "#F58220",
                  flexShrink: 0,
                }}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Thank You & Customer Courtesy Strip */}
      <div
        style={{
          position: "absolute",
          bottom: `${thankBottomMm}mm`,
          left: `${marginX}mm`,
          right: `${marginX}mm`,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.4mm",
          pointerEvents: "none",
          zIndex: 2,
        }}
      >
        <div
          style={{
            fontSize: `${Math.max(5.5, 6.9 * scaleRatio)}pt`,
            fontWeight: 800,
            color: isDarkFooter ? "#FFFFFF" : "#021C57",
            letterSpacing: "0.02em",
            lineHeight: 1.15,
          }}
        >
          {config.footerThankYouTitle ||
            "Thank You for Choosing ARCL Instruments! We Greatly Value Your Trust & Association."}
        </div>
        <div
          style={{
            fontSize: `${Math.max(4.6, 5.8 * scaleRatio)}pt`,
            fontWeight: 500,
            color: isDarkFooter ? "#E2E8F0" : "#475569",
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
