<<<<<<< HEAD
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
   The application will be running at ``.

3. **Production build**:
   ```bash
   npm run build
   npm start
   ```

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, React Router v7
- **Backend**: Node.js, Express, Multer, JWT, BcryptJS, Mongoose / Local DB adapter
- **Build Tool**: Vite 6, tsx, esbuild
http://localhost:3000
=======
# Event-Management-System
>>>>>>> e013a1ab7a328b29ce148e871c4be839f6f2e913
