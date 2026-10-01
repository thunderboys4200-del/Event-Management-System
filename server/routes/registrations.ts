import { Router, Response } from 'express';
import { db, getBranchCode } from '../db';
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

    // The QR token is only ever served by the Event Pass endpoint
    const { qrToken: _qrToken, ...safeRegistration } = registration;

    return res.status(201).json({
      success: true,
      message: 'Event registered successfully!',
      data: safeRegistration,
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

// GET /api/registrations/:id/pass (Student only) - QR Event Pass for one of the student's own registrations
router.get('/:id/pass', authenticateToken, requireStudent, async (req: AuthRequest, res: Response) => {
  try {
    const registration = await db.getRegistrationById(req.params.id);

    // Same 404 whether the registration is missing or belongs to someone else (no enumeration)
    if (!registration || String(registration.student) !== String(req.user!.id)) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    if ((registration.status || 'confirmed') === 'cancelled') {
      return res.status(409).json({ success: false, message: 'This registration has been cancelled, so no Event Pass is available.' });
    }

    const [event, student] = await Promise.all([
      db.getEventById(String(registration.event)),
      db.findUserById(String(registration.student)),
    ]);
    if (!event || !student) {
      return res.status(404).json({ success: false, message: 'Event or student record not found' });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: registration._id || registration.id,
        registrationId: registration.registrationId,
        qrToken: registration.qrToken,
        status: registration.status || 'confirmed',
        attendanceStatus: registration.attendanceStatus || 'NOT_CHECKED_IN',
        checkedInAt: registration.checkedInAt,
        event: {
          id: event._id || event.id,
          title: event.title,
          date: event.date,
          time: event.time,
          venue: event.venue,
          posterUrl: event.posterUrl,
          status: event.status || 'active',
        },
        student: {
          name: student.name,
          studentId: student.loginId,
          department: student.department,
          branch: getBranchCode(student.department),
          year: student.year,
          section: student.section,
        },
      },
    });
  } catch (err: any) {
    console.error('Error building event pass:', err);
    return res.status(500).json({ success: false, message: 'Failed to load Event Pass' });
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
