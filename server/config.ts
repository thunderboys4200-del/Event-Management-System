import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

function sanitizeEnvString(val?: string): string {
  if (!val) return '';
  let cleaned = val.trim();
  // Strip outer quotes if wrapped in single or double quotes
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  return cleaned;
}

function sanitizeMongoUri(val?: string): string {
  let uri = sanitizeEnvString(val);
  if (!uri) return '';

  // Ensure passwords with unencoded special characters like '@', '#', '$', '%', etc. are properly URL-encoded
  const schemeEnd = uri.indexOf('://');
  if (schemeEnd !== -1) {
    const afterScheme = uri.substring(schemeEnd + 3);
    const slashOrQueryIdx = afterScheme.search(/[\/\?]/);
    const hostPart = slashOrQueryIdx !== -1 ? afterScheme.substring(0, slashOrQueryIdx) : afterScheme;
    const lastAtInHostPart = hostPart.lastIndexOf('@');
    if (lastAtInHostPart !== -1) {
      const scheme = uri.substring(0, schemeEnd + 3);
      const creds = hostPart.substring(0, lastAtInHostPart);
      const hostAndPath = afterScheme.substring(lastAtInHostPart + 1);
      const colonIdx = creds.indexOf(':');
      if (colonIdx !== -1) {
        const username = creds.substring(0, colonIdx);
        const rawPassword = creds.substring(colonIdx + 1);
        try {
          let decodedPass = rawPassword;
          try {
            decodedPass = decodeURIComponent(rawPassword);
          } catch {
            // Raw string was not encoded
          }
          const safePassword = encodeURIComponent(decodedPass);
          return `${scheme}${username}:${safePassword}@${hostAndPath}`;
        } catch {
          return uri;
        }
      }
    }
  }

  return uri;
}

function getOrGenerateJwtSecret(): string {
  // 1. If explicitly set in environment variables, use it
  const envSecret = sanitizeEnvString(process.env.JWT_SECRET);
  if (envSecret.length > 0) {
    return envSecret;
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
  mongoUri: sanitizeMongoUri(process.env.MONGODB_URI),
  isProduction: process.env.NODE_ENV === 'production',
  uploadsDir: path.join(process.cwd(), 'uploads'),
  dataDir: path.join(process.cwd(), 'data'),
};

