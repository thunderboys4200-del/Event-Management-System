import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

function getOrGenerateJwtSecret(): string {
  // 1. If explicitly set in environment variables, use it
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.trim().length > 0) {
    return process.env.JWT_SECRET.trim();
  }

  // 2. Otherwise, check or persist an auto-generated cryptographically secure secret
  const dataDir = path.join(process.cwd(), 'data');
  const secretFilePath = path.join(dataDir, '.jwt_secret');

  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    if (fs.existsSync(secretFilePath)) {
      const savedSecret = fs.readFileSync(secretFilePath, 'utf-8').trim();
      if (savedSecret.length >= 32) {
        return savedSecret;
      }
    }

    // Generate a fresh 512-bit cryptographically secure hex secret
    const generatedSecret = crypto.randomBytes(64).toString('hex');
    fs.writeFileSync(secretFilePath, generatedSecret, { encoding: 'utf-8' });
    return generatedSecret;
  } catch {
    // Memory fallback if filesystem is read-only
    return 'cep_secret_' + crypto.randomBytes(32).toString('hex');
  }
}

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  jwtSecret: getOrGenerateJwtSecret(),
  mongoUri: process.env.MONGODB_URI || '',
  isProduction: process.env.NODE_ENV === 'production',
  uploadsDir: path.join(process.cwd(), 'uploads'),
  dataDir: path.join(process.cwd(), 'data'),
};

