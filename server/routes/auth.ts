import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { config } from '../config';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { loginId, password, role } = req.body;

    if (!loginId || !password) {
      return res.status(400).json({
        success: false,
        message: 'Invalid login details',
      });
    }

    const user = await db.findUserByLoginId(loginId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid login details',
      });
    }

    // Role check if specified
    if (role && user.role !== role) {
      return res.status(401).json({
        success: false,
        message: 'Invalid login details',
      });
    }

    // Password comparison
    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid login details',
      });
    }

    const userId = user.id || user._id!;
    const tokenPayload = {
      id: userId,
      loginId: user.loginId,
      role: user.role,
      name: user.name,
      department: user.department,
    };

    const token = jwt.sign(tokenPayload, config.jwtSecret, { expiresIn: '7d' });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: userId,
          name: user.name,
          loginId: user.loginId,
          role: user.role,
          department: user.department,
        }
      }
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({
      success: false,
      message: 'An unexpected authentication error occurred',
    });
  }
});

// POST /api/auth/student-signin
router.post('/student-signin', async (req: Request, res: Response) => {
  try {
    const { name, department, year, mobileNumber } = req.body;

    if (!name?.trim() || !department?.trim() || !year?.trim() || !mobileNumber?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all details: Name, Department, Year, and Mobile Number',
      });
    }

    const user = await db.findOrCreateStudentUser({
      name: name.trim(),
      department: department.trim(),
      year: year.trim(),
      mobileNumber: mobileNumber.trim(),
    });

    const userId = user.id || user._id!;
    const tokenPayload = {
      id: userId,
      loginId: user.loginId,
      role: 'student',
      name: user.name,
      department: user.department,
    };

    const token = jwt.sign(tokenPayload, config.jwtSecret, { expiresIn: '7d' });

    return res.status(200).json({
      success: true,
      message: 'Student sign-in successful',
      data: {
        token,
        user: {
          id: userId,
          name: user.name,
          loginId: user.loginId,
          role: 'student',
          department: user.department,
          year: user.year || year.trim(),
          mobileNumber: user.mobileNumber || mobileNumber.trim(),
        }
      }
    });
  } catch (err: any) {
    console.error('Student sign-in error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to process student sign-in',
    });
  }
});

// POST /api/auth/student-register
router.post('/student-register', async (req: Request, res: Response) => {
  try {
    const { name, department, year, mobileNumber, loginId, password, confirmPassword } = req.body;

    if (
      !name?.trim() ||
      !department?.trim() ||
      !year?.trim() ||
      !mobileNumber?.trim() ||
      !loginId?.trim() ||
      !password ||
      !confirmPassword
    ) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: Name, Department, Year, Mobile Number, Student ID, and Password.',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.',
      });
    }

    const newUser = await db.registerStudentUser({
      name: name.trim(),
      department: department.trim(),
      year: year.trim(),
      mobileNumber: mobileNumber.trim(),
      loginId: loginId.trim(),
      password,
    });

    return res.status(201).json({
      success: true,
      message: 'Student account created successfully.',
      data: {
        id: newUser.id || newUser._id,
        name: newUser.name,
        loginId: newUser.loginId,
        department: newUser.department,
        year: newUser.year,
        role: 'student',
      }
    });
  } catch (err: any) {
    if (err.statusCode === 409) {
      return res.status(409).json({
        success: false,
        message: err.message,
        field: err.field,
      });
    }
    console.error('Student registration error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to create student account.',
    });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const user = await db.findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: user.id || user._id,
        name: user.name,
        loginId: user.loginId,
        role: user.role,
        department: user.department,
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve profile' });
  }
});

export default router;
