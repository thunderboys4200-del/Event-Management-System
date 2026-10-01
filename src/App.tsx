import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { UpcomingEventsPage } from './pages/UpcomingEventsPage';
import { PastEventsPage } from './pages/PastEventsPage';
import { EventDetailsPage } from './pages/EventDetailsPage';
import { PhotoGalleryPage } from './pages/PhotoGalleryPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { MyRegistrationsPage } from './pages/MyRegistrationsPage';
import { StaffDashboard } from './pages/StaffDashboard';
import { CreateEventPage } from './pages/CreateEventPage';
import { EditEventPage } from './pages/EditEventPage';

// Loaded on demand: it pulls in the camera/QR-scanning library, which only staff need
const QrCheckInPage = lazy(() => import('./pages/QrCheckInPage').then((m) => ({ default: m.QrCheckInPage })));

export default function App() {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/events/upcoming" element={<UpcomingEventsPage />} />
                <Route path="/events/past" element={<PastEventsPage />} />
                <Route path="/events/:id" element={<EventDetailsPage />} />
                <Route path="/events/:id/memories" element={<PhotoGalleryPage />} />

                {/* Student Routes */}
                <Route
                  path="/student/dashboard"
                  element={
                    <ProtectedRoute allowedRole="student">
                      <StudentDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/student/registrations"
                  element={
                    <ProtectedRoute allowedRole="student">
                      <MyRegistrationsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Staff Routes */}
                <Route
                  path="/staff/dashboard"
                  element={
                    <ProtectedRoute allowedRole="staff">
                      <StaffDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/staff/events/create"
                  element={
                    <ProtectedRoute allowedRole="staff">
                      <CreateEventPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/staff/events/create-past"
                  element={
                    <ProtectedRoute allowedRole="staff">
                      <CreateEventPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/staff/checkin"
                  element={
                    <ProtectedRoute allowedRole="staff">
                      <Suspense
                        fallback={
                          <div className="min-h-[70vh] flex items-center justify-center">
                            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                          </div>
                        }
                      >
                        <QrCheckInPage />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/staff/events/:id/edit"
                  element={
                    <ProtectedRoute allowedRole="staff">
                      <EditEventPage />
                    </ProtectedRoute>
                  }
                />

                {/* Catch-all fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
}
