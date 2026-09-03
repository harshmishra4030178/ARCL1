import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error(
        "MONGO_URI is missing in backend/.env file. Please add your connection string."
      );
    }

    const connectionInstance = await mongoose.connect(mongoUri, {
      dbName: DB_NAME,
      serverSelectionTimeoutMS: 15000,
    });

    console.log(
      `MongoDB Connected Successfully! Host: ${connectionInstance.connection.host}, DB: ${connectionInstance.connection.name}`
    );
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    throw error;
  }
};