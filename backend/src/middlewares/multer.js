import multer from "multer";

// Use memory storage for reliable buffer handling across all platforms
const storage = multer.memoryStorage();

// File filter (accept images, PDFs, Excel XLSX/XLS, and common documents)
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "image/webp",
    "image/svg+xml",
    "image/gif",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/octet-stream",
    "text/csv",
  ];

  const ext = (file.originalname || "").toLowerCase();
  const isAllowedExt = /\.(pdf|xlsx|xls|csv|docx|doc|png|jpe?g|webp|gif|svg)$/i.test(ext);

  if (
    allowedTypes.includes(file.mimetype) ||
    file.mimetype?.startsWith("image/") ||
    file.mimetype === "application/pdf" ||
    isAllowedExt
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only valid image and document files (PDF, XLSX, XLS, PNG, JPG, WEBP) are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
});

export default upload;
