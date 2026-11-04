import multer from "multer";
import path from "path";
import fs from "fs";
import { env } from "../config/env";

// Ensure upload directory exists
const uploadDir = path.resolve(process.cwd(), env.UPLOAD_STORAGE_PATH);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `doc-${uniqueSuffix}${ext}`);
  },
});

const allowedExtensions = [".pdf", ".docx", ".txt"];
const allowedMimeTypes = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
];

export const documentUpload = multer({
  storage,
  limits: {
    fileSize: env.UPLOAD_MAX_FILE_SIZE_MB * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      return cb(new Error(`Unsupported file extension: ${ext}. Only PDF, DOCX, and TXT files are accepted.`));
    }

    if (!allowedMimeTypes.includes(file.mimetype) && file.mimetype !== "application/octet-stream") {
      return cb(new Error(`Unsupported MIME type: ${file.mimetype}. Only PDF, DOCX, and TXT files are accepted.`));
    }

    cb(null, true);
  },
});

