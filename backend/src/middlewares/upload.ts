import multer from "multer";
import path from "path";
import fs from "fs";
import { Request } from "express";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    const hash = Date.now() + '-' + Math.round(Math.random() * 1E9);
    
    const uploadDir = path.join('uploads', year.toString(), month, day, hash.toString());
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    (req as any).uploadHash = hash;
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const hash = (req as any).uploadHash;
    const filename = `file-${hash}${path.extname(file.originalname)}`;
    cb(null, filename);
  }
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/tiff',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/xml',
    'text/xml',
    'application/json',
    'text/csv',
    'application/rtf',
    'audio/mpeg',
    'audio/wav',
    'video/mp4',
    'video/avi'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de arquivo não permitido: ${file.mimetype}. Apenas imagens, documentos, planilhas, PDFs, arquivos compactados e outros formatos comuns são aceitos.`));
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 10,
  }
});

export const uploadSingle = upload.single('file');
export const uploadMultiple = upload.array('files', 10);
export const uploadFields = upload.fields([
  { name: 'files', maxCount: 10 }
]);
