import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { config } from '../config';

// Ensure uploads directory exists
if (!fs.existsSync(config.uploadsDir)) {
  fs.mkdirSync(config.uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate sanitized unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const cleanExt = path.extname(file.originalname).toLowerCase();
    const fieldName = file.fieldname;
    cb(null, `${fieldName}-${uniqueSuffix}${cleanExt}`);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp4', '.webm', '.mov'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files or MP4, WEBM, MOV video files are allowed.'));
  }
};

export const eventUpload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024,
    files: 18,
  },
  fileFilter,
}).fields([
  { name: 'poster', maxCount: 1 },
  { name: 'photos', maxCount: 12 },
  { name: 'videos', maxCount: 5 },
]);
