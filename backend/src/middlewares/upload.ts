// middlewares/upload.ts
import multer from "multer";
import path from "path";
import fs from "fs";
import { Request } from "express";

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    // Generate a unique hash for this upload session
    const hash = Date.now() + '-' + Math.round(Math.random() * 1E9);
    
    // Create the folder structure: uploads/year/month/day/hash/
    const uploadDir = path.join('uploads', year.toString(), month, day, hash.toString());
    
    // Create directory structure if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log(`📁 Created upload directory: ${uploadDir}`);
    }
    
    // Store the hash in the request for use in filename generation
    (req as any).uploadHash = hash;
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Use the same hash from destination
    const hash = (req as any).uploadHash;
    const filename = `file-${hash}${path.extname(file.originalname)}`;
    console.log(`📄 Saving file as: ${filename}`);
    cb(null, filename);
  }
});

// File filter
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept images and documents
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and documents are allowed.'));
  }
};

// Configure multer
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});
