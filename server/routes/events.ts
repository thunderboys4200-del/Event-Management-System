import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { db, IEvent } from '../db';
import { authenticateToken, requireStaff, optionalAuth, AuthRequest } from '../middleware/auth';
import { eventUpload } from '../middleware/upload';

const router = Router();

// Helper to get relative URL for uploaded file
function getFileUrl(file: Express.Multer.File): string {
  return `/uploads/${file.filename}`;
}

// GET /api/events
router.get('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { type, department, category, search } = req.query;
    const today = new Date().toISOString().split('T')[0];

    let events = await db.getAllEvents();

    // Calculate isPast and filter by type
    events = events.map(e => ({
      ...e,
      isPast: e.date < today,
    })) as any;

    if (type === 'upcoming') {
      events = events.filter((e: any) => !e.isPast);
    } else if (type === 'past') {
      events = events.filter((e: any) => e.isPast);
    }

    // Filter by department
    if (department && department !== 'All') {
      events = events.filter(e => e.department.toLowerCase() === (department as string).toLowerCase());
    }

    // Filter by category
    if (category && category !== 'All') {
      events = events.filter(e => e.category.toLowerCase() === (category as string).toLowerCase());
    }

    // Search query
    if (search) {
      const q = (search as string).toLowerCase();
      events = events.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.venue.toLowerCase().includes(q) ||
        e.department.toLowerCase().includes(q)
      );
    }

    // Attach counts & student registration flags
    const enrichedEvents = await Promise.all(events.map(async (ev) => {
      const regCount = await db.getRegistrationCountForEvent(ev._id || ev.id!);
      let isRegistered = false;
      if (req.user && req.user.role === 'student') {
        isRegistered = await db.isStudentRegistered(req.user.id, ev._id || ev.id!);
      }
      return {
        ...ev,
        registrationCount: regCount,
        isRegistered,
      };
    }));

    return res.status(200).json({
      success: true,
      data: enrichedEvents,
    });
  } catch (err: any) {
    console.error('Error fetching events:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve events',
    });
  }
});

// GET /api/events/:id
router.get('/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const event = await db.getEventById(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    const today = new Date().toISOString().split('T')[0];
    const isPast = event.date < today;
    const registrationCount = await db.getRegistrationCountForEvent(event._id || event.id!);

    let isRegistered = false;
    if (req.user && req.user.role === 'student') {
      isRegistered = await db.isStudentRegistered(req.user.id, event._id || event.id!);
    }

    return res.status(200).json({
      success: true,
      data: {
        ...event,
        isPast,
        registrationCount,
        isRegistered,
      }
    });
  } catch (err: any) {
    console.error('Error fetching single event:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve event details',
    });
  }
});

// POST /api/events (Staff only)
router.post('/', authenticateToken, requireStaff, (req: AuthRequest, res: Response) => {
  eventUpload(req, res, async (err: any) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload error',
      });
    }

    try {
      const {
        title,
        description,
        department,
        category,
        date,
        time,
        venue,
        registrationDeadline,
        posterUrl: providedPosterUrl,
      } = req.body;

      // Validate required fields
      if (!title || !description || !department || !category || !date || !time || !venue || !registrationDeadline) {
        return res.status(400).json({
          success: false,
          message: 'All fields (title, description, department, category, date, time, venue, registration deadline) are required.',
        });
      }

      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      let posterUrl = providedPosterUrl || '';

      if (files && files['poster'] && files['poster'].length > 0) {
        posterUrl = getFileUrl(files['poster'][0]);
      }

      // If no poster provided, fallback to standard high-res college event poster
      if (!posterUrl) {
        posterUrl = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80';
      }

      const photoUrls: string[] = [];
      if (files && files['photos']) {
        files['photos'].forEach(f => {
          photoUrls.push(getFileUrl(f));
        });
      }

      const videoUrls: string[] = [];
      if (files && files['videos']) {
        files['videos'].forEach(f => videoUrls.push(getFileUrl(f)));
      }

      // Also allow JSON/comma-separated external photo URLs
      if (req.body.additionalPhotoUrls) {
        try {
          const parsed = typeof req.body.additionalPhotoUrls === 'string'
            ? JSON.parse(req.body.additionalPhotoUrls)
            : req.body.additionalPhotoUrls;
          if (Array.isArray(parsed)) {
            photoUrls.push(...parsed);
          }
        } catch {
          // ignore
        }
      }

      const newEvent = await db.createEvent({
        title,
        description,
        department,
        category,
        date,
        time,
        venue,
        registrationDeadline,
        posterUrl,
        photoUrls,
        videoUrls,
        createdBy: req.user?.id,
      });

      return res.status(201).json({
        success: true,
        message: 'Event created successfully',
        data: newEvent,
      });
    } catch (createErr: any) {
      console.error('Error creating event:', createErr);
      return res.status(500).json({
        success: false,
        message: 'Failed to create event',
      });
    }
  });
});

// PUT /api/events/:id (Staff only)
router.put('/:id', authenticateToken, requireStaff, (req: AuthRequest, res: Response) => {
  eventUpload(req, res, async (err: any) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload error',
      });
    }

    try {
      const eventId = req.params.id;
      const existing = await db.getEventById(eventId);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Event not found',
        });
      }

      const {
        title,
        description,
        department,
        category,
        date,
        time,
        venue,
        registrationDeadline,
        posterUrl: providedPosterUrl,
        existingPhotos,
      } = req.body;

      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      let posterUrl = existing.posterUrl;

      if (files && files['poster'] && files['poster'].length > 0) {
        posterUrl = getFileUrl(files['poster'][0]);
      } else if (providedPosterUrl) {
        posterUrl = providedPosterUrl;
      }

      // Maintain existing photos unless specified
      let photoUrls: string[] = [];
      let videoUrls: string[] = [...(existing.videoUrls || [])];
      if (existingPhotos) {
        try {
          const parsed = typeof existingPhotos === 'string' ? JSON.parse(existingPhotos) : existingPhotos;
          if (Array.isArray(parsed)) {
            photoUrls = parsed;
          }
        } catch {
          photoUrls = [...existing.photoUrls];
        }
      } else {
        photoUrls = [...existing.photoUrls];
      }

      // Append newly uploaded photos
      if (files && files['photos']) {
        files['photos'].forEach(f => {
          photoUrls.push(getFileUrl(f));
        });
      }
      if (files && files['videos']) {
        files['videos'].forEach(f => videoUrls.push(getFileUrl(f)));
      }

      const updatePayload: Partial<IEvent> = {
        ...(title && { title }),
        ...(description && { description }),
        ...(department && { department }),
        ...(category && { category }),
        ...(date && { date }),
        ...(time && { time }),
        ...(venue && { venue }),
        ...(registrationDeadline && { registrationDeadline }),
        posterUrl,
        photoUrls,
        videoUrls,
      };

      const updated = await db.updateEvent(eventId, updatePayload);

      return res.status(200).json({
        success: true,
        message: 'Event updated successfully',
        data: updated,
      });
    } catch (updateErr: any) {
      console.error('Error updating event:', updateErr);
      return res.status(500).json({
        success: false,
        message: 'Failed to update event',
      });
    }
  });
});

// DELETE /api/events/:id (Staff only)
router.delete('/:id', authenticateToken, requireStaff, async (req: AuthRequest, res: Response) => {
  try {
    const eventId = req.params.id;
    const existing = await db.getEventById(eventId);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    const success = await db.deleteEvent(eventId);
    if (!success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete event',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (err: any) {
    console.error('Error deleting event:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete event',
    });
  }
});

export default router;
