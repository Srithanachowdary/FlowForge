import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import path from "path";
import fs from "fs";

// Ensure local uploads directory exists
const uploadDir = "./uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 1. Local Storage Engine
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  }
});

// Configure Multer
const upload = multer({
  storage: localStorage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// 2. Cloudinary Upload Helper (called inside routes or controllers)
export const handleUpload = async (file) => {
  const isCloudinaryConfigured =
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_CLOUD_NAME !== "mock_cloud_name";

  if (!isCloudinaryConfigured) {
    // If Cloudinary not configured, return the local file link
    return {
      url: `/uploads/${file.filename}`,
      name: file.originalname,
      size: file.size
    };
  }

  // Configure Cloudinary
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: "zive_attachments"
    });

    // Delete local temporary file after uploading to Cloudinary
    fs.unlinkSync(file.path);

    return {
      url: result.secure_url,
      name: file.originalname,
      size: file.size
    };
  } catch (error) {
    console.error("Cloudinary Upload Failure, returning local path: ", error);
    return {
      url: `/uploads/${file.filename}`,
      name: file.originalname,
      size: file.size
    };
  }
};

export { upload };
export default upload;
