import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "domeeznqa",
  api_key: process.env.CLOUDINARY_API_KEY || "897712785116113",
  api_secret: process.env.CLOUDINARY_API_SECRET || "GAEU437GUaxx_v2nr9TJyln2eZ8",
});

export default cloudinary;