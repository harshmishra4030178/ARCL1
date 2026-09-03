import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

let isConnected = false;

export const connectDB = async () => {
  if (isConnected || mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  try {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error(
        "MONGO_URI is missing in environment variables. Please add your connection string."
      );
    }

    const connectionInstance = await mongoose.connect(mongoUri, {
      dbName: DB_NAME,
      serverSelectionTimeoutMS: 15000,
    });

    isConnected = true;
    console.log(
      `MongoDB Connected Successfully! Host: ${connectionInstance.connection.host}, DB: ${connectionInstance.connection.name}`
    );
    return connectionInstance;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    throw error;
  }
};