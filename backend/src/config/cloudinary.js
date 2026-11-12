import dotenv from "dotenv";
import path from "node:path";
import { v2 as cloudinary } from "cloudinary";

dotenv.config({ path: path.resolve(process.cwd(), "backend/.env") });
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;
