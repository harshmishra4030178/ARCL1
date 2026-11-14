import mongoose from "mongoose";

const userBiometricCredentialSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    credentialId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    publicKey: {
      type: String,
      required: true,
    },
    deviceName: {
      type: String,
      default: "Mobile Fingerprint / Biometric Sensor",
    },
    counter: {
      type: Number,
      default: 0,
    },
    transports: {
      type: [String],
      default: ["internal"], // Platform authenticator (fingerprint, Touch ID, Face ID)
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model(
  "UserBiometricCredential",
  userBiometricCredentialSchema
);
