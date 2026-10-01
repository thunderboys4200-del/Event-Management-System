import { Router, Response } from 'express';
import {
  db,
  IEvent,
  IRegistration,
  QR_TOKEN_PATTERN,
  getBranchCode,
  computeAttendanceStats,
} from '../db';
import { authenticateToken, requireStaff, AuthRequest } from '../middleware/auth';

const router = Router();

// Every attendance endpoint is staff-only. Students receive 403 from requireStaff.
router.use(authenticateToken, requireStaff);

const TIMEZONE = process.env.APP_TIMEZONE || 'Asia/Kolkata';

const escapeSpreadsheetXml = (value: unknown) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

type ScanFailure = {
  ok: false;
  httpStatus: number;
  code: string;
  message: string;
  data?: Record<string, unknown>;
};

type ScanSuccess = {
  ok: true;
  registration: IRegistration;
  event: IEvent;
  student: {
    id: string;
    name: string;
    studentId: string;
    department: string;
    branch: string;
    year?: string;
    section?: string;
  };
};

/**
 * Server-side validation shared by /validate and /check-in.
 * Nothing supplied by the client is trusted except the opaque token and the event
 * staff selected; all student/registration data is looked up from the database.
 */
async function resolveScan(token: unknown, eventId: unknown): Promise<ScanFailure | ScanSuccess> {
  if (typeof eventId !== 'string' || !eventId.trim()) {
    return { ok: false, httpStatus: 400, code: 'EVENT_REQUIRED', message: 'Please select an event before scanning.' };
  }

  // Malformed tokens are rejected before touching the database
  if (typeof token !== 'string' || !QR_TOKEN_PATTERN.test(token.trim())) {
    return { ok: false, httpStatus: 400, code: 'INVALID_QR', message: 'This QR code is not valid.' };
  }

  const selectedEvent = await db.getEventById(eventId.trim());
  if (!selectedEvent) {
    return { ok: false, httpStatus: 404, code: 'EVENT_NOT_FOUND', message: 'Selected event was not found.' };
  }
  const selectedEventId = selectedEvent._id || selectedEvent.id!;

  const registration = await db.findRegistrationByQrToken(token.trim());
  if (!registration) {
    return { ok: false, httpStatus: 404, code: 'INVALID_QR', message: 'This QR code is not valid.' };
  }

  // QR token + registration + event must all agree
  if (String(registration.event) !== String(selectedEventId)) {
    const otherEvent = await db.getEventById(String(registration.event));
    return {
      ok: false,
      httpStatus: 409,
      code: 'WRONG_EVENT',
      message: 'This registration belongs to another event.',
      data: otherEvent ? { otherEventTitle: otherEvent.title } : undefined,
    };
  }

  if ((registration.status || 'confirmed') === 'cancelled') {
    return { ok: false, httpStatus: 409, code: 'REGISTRATION_CANCELLED', message: 'This registration has been cancelled.' };
  }

  if (selectedEvent.status === 'cancelled') {
    return { ok: false, httpStatus: 409, code: 'EVENT_CANCELLED', message: 'This event has been cancelled.' };
  }

  const studentRecord = await db.findUserById(String(registration.student));
  if (!studentRecord || studentRecord.role !== 'student') {
    return { ok: false, httpStatus: 404, code: 'STUDENT_NOT_FOUND', message: 'No student record was found for this registration.' };
  }

  return {
    ok: true,
    registration,
    event: selectedEvent,
    student: {
      id: studentRecord.id || studentRecord._id!,
      name: studentRecord.name,
      studentId: studentRecord.loginId,
      department: studentRecord.department,
      branch: getBranchCode(studentRecord.department),
      year: studentRecord.year,
      section: studentRecord.section,
    },
  };
}

function sendFailure(res: Response, f: ScanFailure) {
  return res.status(f.httpStatus).json({ success: false, code: f.code, message: f.message, data: f.data });
}

// POST /api/attendance/validate — checks a QR token against an event without marking attendance
router.post('/validate', async (req: AuthRequest, res: Response) => {
  try {
    const scan = await resolveScan(req.body?.token, req.body?.eventId);
    if (scan.ok === false) return sendFailure(res, scan);

    return res.status(200).json({
      success: true,
      code: 'VALID_QR',
      message: 'QR code is valid.',
      data: {
        student: scan.student,
        event: { id: scan.event._id || scan.event.id, title: scan.event.title },
        registrationId: scan.registration.registrationId,
        attendanceStatus: scan.registration.attendanceStatus,
        checkedInAt: scan.registration.checkedInAt,
      },
    });
  } catch (err) {
    console.error('QR validation error:', err);
    return res.status(500).json({ success: false, code: 'SERVER_ERROR', message: 'Something went wrong while validating the QR code.' });
  }
});

// POST /api/attendance/check-in — validates and marks attendance
router.post('/check-in', async (req: AuthRequest, res: Response) => {
  try {
    const scan = await resolveScan(req.body?.token, req.body?.eventId);
    if (scan.ok === false) return sendFailure(res, scan);

    const staff = { id: req.user!.id, name: req.user!.name };
    const result = await db.checkInRegistration(String(scan.registration._id || scan.registration.id), staff);

    if (result.outcome === 'not_found') {
      return res.status(404).json({ success: false, code: 'INVALID_QR', message: 'This QR code is not valid.' });
    }

    const reg = result.registration;
    const payload = {
      student: scan.student,
      event: { id: scan.event._id || scan.event.id, title: scan.event.title },
      registrationId: reg.registrationId,
      attendanceStatus: reg.attendanceStatus,
      checkedInAt: reg.checkedInAt,
      checkedInBy: reg.checkedInByName,
    };

    if (result.outcome === 'cancelled') {
      return res.status(409).json({ success: false, code: 'REGISTRATION_CANCELLED', message: 'This registration has been cancelled.' });
    }

    if (result.outcome === 'already_checked_in') {
      // The original check-in time is preserved; no new attendance record is created
      return res.status(409).json({
        success: false,
        code: 'ALREADY_CHECKED_IN',
        message: 'This student has already been checked in.',
        data: payload,
      });
    }

    return res.status(200).json({
      success: true,
      code: 'CHECKED_IN',
      message: 'Check-in successful.',
      data: payload,
    });
  } catch (err) {
    console.error('QR check-in error:', err);
    return res.status(500).json({ success: false, code: 'SERVER_ERROR', message: 'Something went wrong while checking in. Please try again.' });
  }
});

// GET /api/attendance/events/:eventId — attendance list + statistics + recent check-ins
router.get('/events/:eventId', async (req: AuthRequest, res: Response) => {
  try {
    const event = await db.getEventById(req.params.eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const rows = await db.getEventAttendance(event._id || event.id!);
    return res.status(200).json({
      success: true,
      data: {
        event: { id: event._id || event.id, title: event.title, date: event.date, venue: event.venue, status: event.status || 'active' },
        stats: computeAttendanceStats(rows),
        attendees: rows,
      },
    });
  } catch (err) {
    console.error('Attendance fetch error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve attendance' });
  }
});

// GET /api/attendance/events/:eventId/stats — lightweight statistics only (used for live refresh)
router.get('/events/:eventId/stats', async (req: AuthRequest, res: Response) => {
  try {
    const event = await db.getEventById(req.params.eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const rows = await db.getEventAttendance(event._id || event.id!);
    return res.status(200).json({ success: true, data: computeAttendanceStats(rows) });
  } catch (err) {
    console.error('Attendance stats error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve attendance statistics' });
  }
});

// GET /api/attendance/events/:eventId/export — attendance report (Excel-compatible)
router.get('/events/:eventId/export', async (req: AuthRequest, res: Response) => {
  try {
    const event = await db.getEventById(req.params.eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const rows = await db.getEventAttendance(event._id || event.id!);
    const headers = [
      'Student ID', 'Student Name', 'Department', 'Branch', 'Year',
      'Registration ID', 'Registration Status', 'Attendance Status', 'Check-in Time', 'Checked-in By',
    ];
    const body = rows.map((r) => [
      r.student.loginId,
      r.student.name,
      r.student.department,
      r.student.branch,
      r.student.year,
      r.registrationId,
      r.status === 'cancelled' ? 'Cancelled' : 'Confirmed',
      r.attendanceStatus === 'CHECKED_IN' ? 'Checked In' : 'Not Checked In',
      r.checkedInAt ? new Date(r.checkedInAt).toLocaleString('en-IN', { timeZone: TIMEZONE }) : '',
      r.checkedInBy,
    ]);

    const tableRows = [headers, ...body]
      .map((row, index) =>
        `<Row>${row.map((cell) => `<Cell${index === 0 ? ' ss:StyleID="header"' : ''}><Data ss:Type="String">${escapeSpreadsheetXml(cell)}</Data></Cell>`).join('')}</Row>`
      )
      .join('');
    const workbook = `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Styles><Style ss:ID="header"><Font ss:Bold="1"/><Interior ss:Color="#FDE68A" ss:Pattern="Solid"/></Style></Styles><Worksheet ss:Name="Attendance"><Table>${tableRows}</Table></Worksheet></Workbook>`;

    const safeName = event.title.replace(/[^a-z0-9]+/gi, '-').replace(/(^-|-$)/g, '') || 'event';
    res.setHeader('Content-Type', 'application/vnd.ms-excel; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}-attendance.xls"`);
    return res.send(`\uFEFF${workbook}`);
  } catch (err) {
    console.error('Attendance export error:', err);
    return res.status(500).json({ success: false, message: 'Failed to export attendance' });
  }
});

export default router;
