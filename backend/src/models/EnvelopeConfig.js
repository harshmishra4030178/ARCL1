import mongoose from "mongoose";

const envelopeConfigSchema = new mongoose.Schema(
  {
    configKey: {
      type: String,
      default: "DEFAULT_ARCL_ENVELOPE",
      unique: true,
      trim: true,
    },
    // Background theme styling
    backgroundTheme: {
      type: String,
      default: "classic_white",
      trim: true,
    },
    customBgMode: {
      type: String,
      enum: ["gradient", "solid"],
      default: "gradient",
    },
    customColorStart: {
      type: String,
      default: "#F59E0B",
    },
    customColorEnd: {
      type: String,
      default: "#10B981",
    },
    customColorSolid: {
      type: String,
      default: "#FFFFFF",
    },

    // Dimensions & Presets
    selectedPresetId: {
      type: String,
      default: "custom_arcl",
    },
    widthMm: {
      type: Number,
      default: 280,
    },
    heightMm: {
      type: Number,
      default: 124,
    },

    // Header corporate identity
    headerCompanyName: {
      type: String,
      default: "ARCL INSTRUMENTS PRIVATE LIMITED",
    },
    headerSubtitle: {
      type: String,
      default: "NABL Accredited Calibration Laboratory (CC-4313) • ISO/IEC 17025:2017",
    },
    showHeaderSubtitle: {
      type: Boolean,
      default: true,
    },
    headerAddress: {
      type: String,
      default: "Shop No. 6, Siddhivinayak Park CHS, Sector 8A, Airoli, Navi Mumbai - 400708, Maharashtra • GSTIN: 27AATCA7874C1ZB",
    },
    phone: {
      type: String,
      default: "+91 81696 95728",
    },
    email: {
      type: String,
      default: "info@arclinstruments.com",
    },
    emailPrimary: {
      type: String,
      default: "info@arclinstruments.com",
    },
    emailSecondary: {
      type: String,
      default: "arclinstruments@gmail.com",
    },
    website: {
      type: String,
      default: "https://arclinstruments.com/",
    },

    // Sender details
    fromCompanyName: {
      type: String,
      default: "ARCL INSTRUMENTS",
    },
    address: {
      type: String,
      default: "Shop No. 6, Siddhivinayak Park CHS, Sector-8A, Airoli, Navi Mumbai, Maharashtra 400708, India",
    },

    // Footer details
    footerServices: {
      type: [String],
      default: ["Calibration", "Manufacturing", "Sales", "Service", "Spares"],
    },
    footerThankYouTitle: {
      type: String,
      default: "Thank You for Choosing ARCL Instruments! We Greatly Value Your Trust & Association.",
    },
    footerThankYouSubtitle: {
      type: String,
      default: "For any new requirements, calibration, servicing, spares, or technical support, please feel free to contact us.",
    },

    // Audit Info
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    updatedByEmail: {
      type: String,
      default: "",
    },
    updatedByName: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("EnvelopeConfig", envelopeConfigSchema);
