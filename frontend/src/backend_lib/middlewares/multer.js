import multer from "multer";

// Use memory storage for reliable buffer handling across all platforms
const storage = multer.memoryStorage();

// File filter (accept images only)
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "image/webp",
    "image/svg+xml",
    "image/gif",
  ];

  if (allowedTypes.includes(file.mimetype) || file.mimetype?.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only valid image files (PNG, JPG, WEBP, JPEG) are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

export default upload;