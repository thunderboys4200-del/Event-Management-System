import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Users,
  Image as ImageIcon,
  CheckCircle2,
  Lock,
  ArrowUpRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { eventsApi } from '../services/api';
import { EventItem } from '../types';
import { EventCard } from '../components/EventCard';
import { EventCardSkeleton } from '../components/LoadingSkeleton';
import { StudentSignInSection } from '../components/StudentSignInSection';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const [upcomingEvents, setUpcomingEvents] = useState<EventItem[]>([]);
  const [pastEvents, setPastEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { isAuthenticated, isStudent, isStaff } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLandingData = async () => {
      try {
        const [upcoming, past] = await Promise.all([
          eventsApi.getEvents({ type: 'upcoming' }),
          eventsApi.getEvents({ type: 'past' }),
        ]);
        setUpcomingEvents(upcoming.slice(0, 3));
        setPastEvents(past.slice(0, 3));
      } catch (err) {
        console.error('Error fetching landing events:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLandingData();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative isolate overflow-hidden pt-14 pb-16 md:pt-24 md:pb-24 bg-slate-950">
        <img
          src="https://content.jdmagicbox.com/comp/tiruvallur/x2/9999pxx44.xx44.130805114320.u7x2/catalogue/sri-venkateswara-college-of-engineering-and-technology-tirupasur-tiruvallur-engineering-colleges-bju783t.jpg"
          alt="Sri Venkateswara College of Engineering and Technology campus"
          className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#3f0d1b]/95 via-[#5b1326]/84 to-[#16223b]/88" />
        <div className="absolute inset-x-0 bottom-0 h-40 -z-10 bg-gradient-to-t from-slate-950/70 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center max-w-4xl mx-auto space-y-6"
          >
            {/* Campus Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-wide bg-white/10 text-amber-100 border border-white/25 shadow-lg backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>SRI VENKATESWARA COLLEGE OF ENGINEERING AND TECHNOLOGY AUTONOMOUS</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.08] drop-shadow-sm">
              Your Campus. Your Moments.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-orange-300 to-amber-100">
                SVCET EVENT HUG
              </span>
            </h1>

            {/* Short Description */}
            <p className="text-base sm:text-lg text-slate-100/90 leading-relaxed font-normal max-w-2xl mx-auto">
              Discover technical symposiums, cultural fests, sports meets, and the memories that make campus life unforgettable.
            </p>

            {/* Action Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              {isAuthenticated ? (
                isStudent ? (
                  <Link
                    id="hero-student-dashboard-btn"
                    to="/student/dashboard"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm text-[#4b1020] bg-amber-300 hover:bg-amber-200 shadow-md shadow-black/20 hover:shadow-lg transition-all duration-200"
                  >
                    <span>Open Student Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <Link
                    id="hero-staff-dashboard-btn"
                    to="/staff/dashboard"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm text-[#4b1020] bg-amber-300 hover:bg-amber-200 shadow-md shadow-black/20 hover:shadow-lg transition-all duration-200"
                  >
                    <span>Open Staff Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )
              ) : (
                <>
                  <a
                    id="hero-student-login-btn"
                    href="#student-signin"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm text-[#4b1020] bg-amber-300 hover:bg-amber-200 shadow-md shadow-black/20 hover:shadow-lg transition-all duration-200"
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>Student Sign In</span>
                  </a>
                  <Link
                    id="hero-staff-login-btn"
                    to="/login?role=staff"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm text-white bg-white/10 border border-white/35 hover:bg-white/20 shadow-xs backdrop-blur-md transition-all duration-200"
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-300" />
                    <span>Staff Login</span>
                  </Link>
                </>
              )}

              <Link
                id="hero-browse-events-btn"
                to="/events/upcoming"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-6 py-3.5 rounded-xl font-semibold text-sm text-white/90 hover:text-amber-200 transition-colors"
              >
                <span>Browse All Events</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-4xl mx-auto text-center">
            <div className="rounded-2xl border border-white/20 bg-white/10 px-5 py-4 backdrop-blur-md">
              <p className="text-amber-200 text-xs font-bold uppercase tracking-[0.16em]">Established</p>
              <p className="mt-1 text-white font-bold">2000</p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 px-5 py-4 backdrop-blur-md">
              <p className="text-amber-200 text-xs font-bold uppercase tracking-[0.16em]">Affiliated to</p>
              <p className="mt-1 text-white font-bold">Anna University, Chennai</p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 px-5 py-4 backdrop-blur-md">
              <p className="text-amber-200 text-xs font-bold uppercase tracking-[0.16em]">Campus</p>
              <p className="mt-1 text-white font-bold">Tiruvallur, Tamil Nadu</p>
            </div>
          </div>
        </div>
      </section>

      {/* Student Sign In / Registration Section */}
      <StudentSignInSection id="student-signin" />

      {/* Feature Highlights Grid */}
      <section className="py-14 border-b border-amber-100 dark:border-slate-800 bg-gradient-to-b from-amber-50/70 to-white dark:from-slate-900 dark:to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-3"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">One-Click Event Discovery</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Filter by technical, cultural, sports, and department seminars. Register instantly with automatic duplicate checks.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-3"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <ImageIcon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Vertical Photo Memories</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Relive past collegiate galas and tournaments through our specialized vertical scrolling photo gallery layout.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-3"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Faculty Management Suite</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Staff can publish upcoming programs, upload posters, manage multi-photo galleries, and monitor attendee rosters.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Upcoming Events Preview Section */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
              <Calendar className="w-4 h-4" />
              <span>Campus Calendar</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Upcoming College Events
            </h2>
          </div>
          <Link
            id="view-all-upcoming-btn"
            to="/events/upcoming"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <span>View All Upcoming</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <EventCardSkeleton />
            <EventCardSkeleton />
            <EventCardSkeleton />
          </div>
        ) : upcomingEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents.map((event) => (
              <EventCard
                key={event.id || event._id}
                event={event}
                variant="upcoming"
                onRegister={() => {
                  if (!isAuthenticated) {
                    navigate('/login?role=student');
                  } else {
                    navigate(`/events/${event.id || event._id}`);
                  }
                }}
              />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 rounded-2xl border border-slate-200 dark:border-slate-800">
            No upcoming events available.
          </div>
        )}
      </section>

      {/* Past Event Memories Preview Section */}
      <section className="py-16 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
                <ImageIcon className="w-4 h-4" />
                <span>Collegiate Archive</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                Past Events & Photo Memories
              </h2>
            </div>
            <Link
              id="view-all-past-btn"
              to="/events/past"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              <span>Explore Photo Memories</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <EventCardSkeleton />
              <EventCardSkeleton />
              <EventCardSkeleton />
            </div>
          ) : pastEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastEvents.map((event) => (
                <EventCard
                  key={event.id || event._id}
                  event={event}
                  variant="past"
                />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 rounded-2xl border border-slate-200 dark:border-slate-800">
              No past events available yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
