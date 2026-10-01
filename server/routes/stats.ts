import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/stats
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const stats = await db.getOverallStats(req.user?.id, req.user?.role);
    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (err: any) {
    console.error('Error fetching stats:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve portal statistics',
    });
  }
});

export default router;
