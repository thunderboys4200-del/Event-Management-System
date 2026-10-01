import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { db, IUser } from '../db';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    loginId: string;
    role: 'student' | 'staff';
    name: string;
    department: string;
  };
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication token required',
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as {
      id: string;
      loginId: string;
      role: 'student' | 'staff';
      name: string;
      department: string;
    };
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired session token',
    });
  }
}

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as {
      id: string;
      loginId: string;
      role: 'student' | 'staff';
      name: string;
      department: string;
    };
    req.user = decoded;
  } catch (err) {
    // Ignore invalid token on optional routes
  }
  next();
}

export function requireStudent(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'student') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Student authorization required.',
    });
  }
  next();
}

export function requireStaff(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'staff') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Staff authorization required.',
    });
  }
  next();
}
