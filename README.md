# College Event Portal

A full-stack web application for college event management, student registration, event posters, past event vertical photo memories, and staff administration.

## Features

- **Role-Based Authentication**:
  - **Student Login**: Register for events, view upcoming & past events, browse event photo galleries, and access verified event passes in "My Registrations".
  - **Staff / Faculty Login**: Create events with custom posters & gallery photos, edit/delete events, and view real-time student registration rosters.
- **Event Management**:
  - Upcoming events with real-time countdown, category filtering, search, venue details, and registration deadline validation.
  - Concluded past events with poster-first display and vertical photo gallery view.
  - Multi-file image uploads with Multer for posters and vertical memory galleries.
- **Database & Storage**:
  - Built-in embedded persistence store (no extra setup required).
  - Optional seamless MongoDB Atlas connection via `MONGODB_URI`.
  - Self-generating, persistent 512-bit JWT secret.

## Pre-Configured Test Accounts

- **Student Account**:
  - Login ID: `STU001`
  - Password: `Student@123`
- **Staff / Faculty Account**:
  - Login ID: `STF001`
  - Password: `Staff@123`

## Quick Start (Local Setup)

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```
   The application will be running at `http://localhost:3000`.

3. **Production build**:
   ```bash
   npm run build
   npm start
   ```

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, React Router v7
- **Backend**: Node.js, Express, Multer, JWT, BcryptJS, Mongoose / Local DB adapter
- **Build Tool**: Vite 6, tsx, esbuild

## QR Event Check-In & Attendance

- **Students**: *My Registrations* → **View Event Pass** shows a digital pass with a QR code. The QR holds only a random 192-bit token (no name, ID or event data). The card and pass flip to **CHECKED IN** automatically after the scan.
- **Staff**: **QR Check-In** (Staff Dashboard button, per-event row action, or navbar) → choose an event → **Start Camera** → scan. Results: Check-in successful, Already checked in (original time kept), Wrong event, Invalid QR, Cancelled registration/event. A manual-entry field is provided as a fallback. Live counts, recent check-ins, a searchable/filterable attendance list and **Download Attendance** (Excel) are on the same page.
- **API** (all staff-only except the pass): `GET /api/registrations/:id/pass`, `POST /api/attendance/validate`, `POST /api/attendance/check-in`, `GET /api/attendance/events/:eventId`, `.../stats`, `.../export`.
- **Existing data**: on startup, registrations created before this upgrade are backfilled with a registration ID (`REG-YYYY-00001`), a QR token and `NOT_CHECKED_IN`. Nothing is removed.
- **Camera note**: browsers only allow camera access on `https://` or `localhost`. Serve the site over HTTPS for phones on your network/hosting.
- Optional `APP_TIMEZONE` (default `Asia/Kolkata`) sets the time zone used in the Excel export.
