import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, requireStudent, requireStaff, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/registrations (Student only)
router.post('/', authenticateToken, requireStudent, async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    const { eventId } = req.body;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: 'Event ID is required',
      });
    }

    const event = await db.getEventById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    const today = new Date().toISOString().split('T')[0];

    // Check if event is in the past
    if (event.date < today) {
      return res.status(400).json({
        success: false,
        message: 'Cannot register for past events',
      });
    }

    // Check registration deadline
    if (event.registrationDeadline && event.registrationDeadline < today) {
      return res.status(400).json({
        success: false,
        message: `Registration deadline was on ${event.registrationDeadline}. Registrations are closed.`,
      });
    }

    // Check duplicate
    const alreadyRegistered = await db.isStudentRegistered(studentId, eventId);
    if (alreadyRegistered) {
      return res.status(400).json({
        success: false,
        message: 'Already registered for this event',
      });
    }

    const registration = await db.createRegistration(studentId, eventId);

    return res.status(201).json({
      success: true,
      message: 'Event registered successfully!',
      data: registration,
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    if (err.message && err.message.includes('Already registered')) {
      return res.status(400).json({
        success: false,
        message: 'Already registered for this event',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to process registration',
    });
  }
});

// GET /api/registrations/my (Student only)
router.get('/my', authenticateToken, requireStudent, async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    const registrations = await db.getStudentRegistrations(studentId);

    return res.status(200).json({
      success: true,
      data: registrations,
    });
  } catch (err: any) {
    console.error('Error fetching student registrations:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve registrations',
    });
  }
});

// GET /api/events/:id/registrations (Staff only)
// Note: We mount this on `/api/events` or directly here as helper
router.get('/event/:eventId', authenticateToken, requireStaff, async (req: AuthRequest, res: Response) => {
  try {
    const { eventId } = req.params;
    const registrations = await db.getEventRegistrations(eventId);

    return res.status(200).json({
      success: true,
      data: registrations,
    });
  } catch (err: any) {
    console.error('Error fetching event attendees:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve event registrations',
    });
  }
});

export default router;
