import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Calendar, ShieldCheck, LogOut, Menu, X, User, Ticket, PlusCircle, Compass } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { COLLEGE_BRAND_NAME, COLLEGE_LOGO_URL } from '../constants/branding';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, isStudent, isStaff, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Track scroll position for glassmorphic intensification + gradient border
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll(); // check initial
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header
      id="main-header"
      className={`navbar-glass-border sticky top-0 w-full transition-colors ${scrolled ? 'scrolled' : ''}`}
    >
      <div className={`navbar-glass-surface ${scrolled ? 'scrolled' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo with 3D hover */}
            <Link
              id="nav-brand"
              to="/"
              className="logo-3d focus-ring flex items-center gap-2.5 rounded-xl py-1"
            >
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-white flex items-center justify-center shadow-md shadow-indigo-200/50 dark:shadow-none ring-1 ring-indigo-100 dark:ring-indigo-900">
                <img
                  src={COLLEGE_LOGO_URL}
                  alt="Sri Venkateswara College of Engineering and Technology logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg leading-tight tracking-tight text-slate-900 dark:text-white">
                  <span className="text-[#67152a] dark:text-amber-200">{COLLEGE_BRAND_NAME}</span>
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Campus Life • Events • Memories
                </span>
              </div>
            </Link>

            {/* Desktop Nav Links with 3D micro-tilt + active indicator */}
            <nav id="desktop-nav" className="hidden md:flex items-center gap-1">
              <Link
                id="nav-link-home"
                to="/"
                aria-current={isActive('/') ? 'page' : undefined}
                data-active={isActive('/') ? 'true' : 'false'}
                className={`nav-link-3d nav-active-pill px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive('/')
                    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/50'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/80 dark:hover:bg-slate-800/60'
                }`}
              >
                Home
              </Link>
              <Link
                id="nav-link-upcoming"
                to="/events/upcoming"
                aria-current={isActive('/events/upcoming') ? 'page' : undefined}
                data-active={isActive('/events/upcoming') ? 'true' : 'false'}
                className={`nav-link-3d nav-active-pill px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive('/events/upcoming')
                    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/50'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/80 dark:hover:bg-slate-800/60'
                }`}
              >
                Upcoming Events
              </Link>
              <Link
                id="nav-link-past"
                to="/events/past"
                aria-current={isActive('/events/past') ? 'page' : undefined}
                data-active={isActive('/events/past') ? 'true' : 'false'}
                className={`nav-link-3d nav-active-pill px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive('/events/past')
                    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/50'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/80 dark:hover:bg-slate-800/60'
                }`}
              >
                Past Memories
              </Link>

              {/* Role-Specific Navigation */}
              {isStudent && (
                <>
                  <Link
                    id="nav-link-student-dash"
                    to="/student/dashboard"
                    data-active={isActive('/student/dashboard') ? 'true' : 'false'}
                    className={`nav-link-3d nav-active-pill px-3 py-2 rounded-lg text-sm font-medium ${
                      isActive('/student/dashboard')
                        ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/50'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/80 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    Student Dashboard
                  </Link>
                  <Link
                    id="nav-link-my-reg"
                    to="/student/registrations"
                    data-active={isActive('/student/registrations') ? 'true' : 'false'}
                    className={`nav-link-3d nav-active-pill flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium ${
                      isActive('/student/registrations')
                        ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/50'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/80 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <Ticket className="w-4 h-4 text-indigo-500" />
                    My Registrations
                  </Link>
                </>
              )}

              {isStaff && (
                <>
                  <Link
                    id="nav-link-staff-dash"
                    to="/staff/dashboard"
                    data-active={isActive('/staff/dashboard') ? 'true' : 'false'}
                    className={`nav-link-3d nav-active-pill px-3 py-2 rounded-lg text-sm font-medium ${
                      isActive('/staff/dashboard')
                        ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/50'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/80 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    Staff Console
                  </Link>
                  <Link
                    id="nav-link-create-event"
                    to="/staff/events/create"
                    className="nav-link-3d flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/40 hover:bg-emerald-100 transition-colors"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Create Event
                  </Link>
                </>
              )}
            </nav>

            {/* Desktop Right Actions */}
            <div id="desktop-actions" className="hidden md:flex items-center gap-3">
              {isAuthenticated && user ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 backdrop-blur-sm">
                    <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-semibold">
                      {user.name.charAt(0)}
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white leading-none">
                        {user.name}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {user.loginId} • <span className="uppercase font-bold text-indigo-600 dark:text-indigo-400">{user.role}</span>
                      </span>
                    </div>
                  </div>

                  <button
                    id="nav-logout-btn"
                    onClick={handleLogout}
                    className="nav-link-3d flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/80 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                    title="Log out"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    id="nav-student-login-btn"
                    to="/login?role=student"
                    className="nav-link-3d px-3.5 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100/80 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    Student Sign In
                  </Link>
                  <Link
                    id="nav-staff-login-btn"
                    to="/login?role=staff"
                    className="btn-3d-press px-4 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-lg shadow-sm shadow-indigo-600/20 transition-colors"
                  >
                    Staff Login
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Toggle */}
            <div className="flex md:hidden items-center">
              <button
                id="mobile-menu-toggle"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="focus-ring p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Nav Drawer with spring animation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, height: 0, y: -8 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden border-t border-slate-200/50 dark:border-slate-800/50 mobile-menu-glass px-4 pt-2 pb-6 space-y-2 shadow-xl shadow-slate-950/5 overflow-hidden"
          >
            {isAuthenticated && user && (
              <div className="p-3 mb-3 rounded-lg bg-white/60 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 backdrop-blur-sm flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{user.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {user.loginId} • <span className="uppercase font-bold text-indigo-600">{user.role}</span>
                  </p>
                  <p className="text-[11px] text-slate-400">{user.department}</p>
                </div>
                <button
                  id="mobile-logout-btn"
                  onClick={handleLogout}
                  className="p-2 text-rose-600 hover:bg-rose-50/80 dark:hover:bg-rose-950/40 rounded-lg"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}

            <div className="flex flex-col space-y-1">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/') ? 'text-indigo-600 bg-indigo-50/80' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800'
                }`}
              >
                Home
              </Link>
              <Link
                to="/events/upcoming"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/events/upcoming') ? 'text-indigo-600 bg-indigo-50/80' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800'
                }`}
              >
                Upcoming Events
              </Link>
              <Link
                to="/events/past"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/events/past') ? 'text-indigo-600 bg-indigo-50/80' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800'
                }`}
              >
                Past Events & Memories
              </Link>

              {isStudent && (
                <>
                  <Link
                    to="/student/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2 rounded-lg text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50/80"
                  >
                    Student Dashboard
                  </Link>
                  <Link
                    to="/student/registrations"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2 rounded-lg text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50/80"
                  >
                    My Registrations
                  </Link>
                </>
              )}

              {isStaff && (
                <>
                  <Link
                    to="/staff/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2 rounded-lg text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50/80"
                  >
                    Staff Console
                  </Link>
                  <Link
                    to="/staff/events/create"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2 rounded-lg text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50/80"
                  >
                    Create New Event
                  </Link>
                </>
              )}

              {!isAuthenticated && (
                <div className="pt-3 flex flex-col gap-2 border-t border-slate-200/80 dark:border-slate-800">
                  <Link
                    to="/login?role=student"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2 px-4 rounded-lg border border-slate-300/80 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50/80"
                  >
                    Student Sign In
                  </Link>
                  <Link
                    to="/login?role=staff"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn-3d-press w-full text-center py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-sm font-medium text-white shadow-sm"
                  >
                    Staff Login
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
