import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

let isConnected = false;

export const connectDB = async () => {
  if (isConnected || mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  try {
    const mongoUri =
      process.env.MONGO_URI ||
      "mongodb://abhishek27501_db_user:Abhi12345@ac-zbzi2lq-shard-00-00.inlbkbb.mongodb.net:27017,ac-zbzi2lq-shard-00-01.inlbkbb.mongodb.net:27017,ac-zbzi2lq-shard-00-02.inlbkbb.mongodb.net:27017/?ssl=true&replicaSet=atlas-13m0xq-shard-0&authSource=admin&appName=ARCL";

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