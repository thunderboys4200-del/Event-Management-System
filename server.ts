import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { config } from './server/config';
import { connectDB, db } from './server/db';
import authRoutes from './server/routes/auth';
import eventRoutes from './server/routes/events';
import registrationRoutes from './server/routes/registrations';
import statsRoutes from './server/routes/stats';
import { authenticateToken, requireStaff, AuthRequest } from './server/middleware/auth';

const escapeSpreadsheetXml = (value: unknown) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

async function startServer() {
  const app = express();
  const PORT = config.port || 3000;

  // Global Middlewares
  app.use(cors());
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // Static uploads serving
  app.use('/uploads', express.static(config.uploadsDir));

  // Initialize Database
  await connectDB();

  // API Health Check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'College Event Portal API'
    });
  });

  // Event registrations by event ID (satisfying requirement: GET /api/events/:id/registrations)
  app.get('/api/events/:id/registrations', authenticateToken, requireStaff, async (req: AuthRequest, res) => {
    try {
      const registrations = await db.getEventRegistrations(req.params.id);
      res.status(200).json({
        success: true,
        data: registrations,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve registrations for event',
      });
    }
  });

  app.get('/api/events/:id/registrations/export', authenticateToken, requireStaff, async (req: AuthRequest, res) => {
    try {
      const event = await db.getEventById(req.params.id);
      if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
      const registrations = await db.getEventRegistrations(req.params.id);
      const headers = ['Student Name', 'Student ID', 'Department', 'Year', 'Mobile Number', 'Registered At'];
      const rows = registrations.map((registration: any) => [
        registration.student?.name,
        registration.student?.loginId,
        registration.student?.department,
        registration.student?.year,
        registration.student?.mobileNumber,
        registration.registeredAt ? new Date(registration.registeredAt).toLocaleString() : '',
      ]);
      const tableRows = [headers, ...rows].map((row, index) => `<Row>${row.map((cell) => `<Cell${index === 0 ? ' ss:StyleID="header"' : ''}><Data ss:Type="String">${escapeSpreadsheetXml(cell)}</Data></Cell>`).join('')}</Row>`).join('');
      const workbook = `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Styles><Style ss:ID="header"><Font ss:Bold="1"/><Interior ss:Color="#FDE68A" ss:Pattern="Solid"/></Style></Styles><Worksheet ss:Name="Registrations"><Table>${tableRows}</Table></Worksheet></Workbook>`;
      const safeName = event.title.replace(/[^a-z0-9]+/gi, '-').replace(/(^-|-$)/g, '') || 'event';
      res.setHeader('Content-Type', 'application/vnd.ms-excel; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${safeName}-registrations.xls"`);
      return res.send(`\uFEFF${workbook}`);
    } catch (err) {
      console.error('Registration export error:', err);
      return res.status(500).json({ success: false, message: 'Failed to export registrations' });
    }
  });

  // Mount API Routers
  app.use('/api/auth', authRoutes);
  app.use('/api/events', eventRoutes);
  app.use('/api/registrations', registrationRoutes);
  app.use('/api/stats', statsRoutes);

  // Direct download endpoint for project zip
  app.get('/api/download-zip', (req, res) => {
    const zipPath = path.join(process.cwd(), 'public', 'college-event-portal.zip');
    if (fs.existsSync(zipPath)) {
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="college-event-portal.zip"');
      res.sendFile(zipPath);
    } else {
      res.status(404).json({ success: false, message: 'Archive not found' });
    }
  });

  // Vite middleware in dev / Static dist in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`College Event Portal Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
