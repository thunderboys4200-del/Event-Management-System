import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Ticket,
  Clock,
  Search,
  Filter,
  GraduationCap,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Building2,
  Tag
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { eventsApi, registrationsApi, statsApi } from '../services/api';
import { EventItem, StudentStats } from '../types';
import { EventCard } from '../components/EventCard';
import { EventGridSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import { useToast } from '../components/Toast';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [registeringId, setRegisteringId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All');

  const categories = ['All', 'Technical', 'Cultural', 'Placement','Tech_Teach','Sports', 'Seminar'];

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [eventsData, statsData] = await Promise.all([
        eventsApi.getEvents({ type: 'upcoming' }),
        statsApi.getStats() as Promise<StudentStats>,
      ]);
      setEvents(eventsData);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading student dashboard:', err);
      showToast('Failed to load dashboard data. Please refresh.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRegister = async (event: EventItem) => {
    const eventId = event.id || event._id!;
    setRegisteringId(eventId);
    try {
      await registrationsApi.register(eventId);
      showToast(`Successfully registered for "${event.title}"!`, 'success');

      // Update local state to show registered status
      setEvents((prev) =>
        prev.map((e) =>
          (e.id === eventId || e._id === eventId)
            ? { ...e, isRegistered: true, registrationCount: (e.registrationCount || 0) + 1 }
            : e
        )
      );

      // Refresh stats
      const newStats = await statsApi.getStats() as StudentStats;
      setStats(newStats);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to complete registration';
      showToast(msg, 'error');
    } finally {
      setRegisteringId(null);
    }
  };

  // Filtered events
  const filteredEvents = events.filter((ev) => {
    const matchesSearch =
      ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.department.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'All' || ev.category.toLowerCase() === selectedCategory.toLowerCase();

    const matchesDepartment =
      selectedDepartment === 'All' || ev.department.toLowerCase() === selectedDepartment.toLowerCase();

    return matchesSearch && matchesCategory && matchesDepartment;
  });

  return (
    <div className="page-canvas min-h-screen bg-slate-50/80 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Student Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-950/20 relative overflow-hidden border border-indigo-800/40"
        >
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-indigo-200 border border-white/10">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Student Portal • {user?.loginId}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Welcome back, {user?.name}!
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm max-w-xl">
                {user?.department} • Discover upcoming campus activities, manage your confirmed entry passes, and relive photo memories.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/student/registrations"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
              >
                <Ticket className="w-4 h-4 text-indigo-600" />
                <span>My Registrations</span>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Statistics Cards (Upcoming Events, My Registrations, Past Events) */}
        <div id="student-stats-row" className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            whileHover={{ y: -3, transition: { duration: 0.15 } }}
            className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Upcoming Events
              </p>
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                {stats ? stats.upcomingEventsCount : '...'}
              </h3>
              <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium mt-1">Open for registration</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            whileHover={{ y: -3, transition: { duration: 0.15 } }}
          >
            <Link
              to="/student/registrations"
              className="group bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-center justify-between hover:border-emerald-500/50 transition-colors block"
            >
              <div className="flex items-center justify-between w-full">
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    My Registrations
                  </p>
                  <h3 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                    {stats ? stats.myRegistrationsCount : '...'}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors font-medium">
                    View confirmed passes →
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Ticket className="w-6 h-6" />
                </div>
              </div>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            whileHover={{ y: -3, transition: { duration: 0.15 } }}
          >
            <Link
              to="/events/past"
              className="group bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-center justify-between hover:border-indigo-500/50 transition-colors block"
            >
              <div className="flex items-center justify-between w-full">
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Past Events & Memories
                  </p>
                  <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                    {stats ? stats.pastEventsCount : '...'}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors font-medium">
                    Explore photo galleries →
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Clock className="w-6 h-6" />
                </div>
              </div>
            </Link>
          </motion.div>
        </div>

        {/* Section Header & Search/Filter Controls */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Upcoming Events Catalog
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Register early before registration deadlines close.
              </p>
            </div>

            {/* Search Bar */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search title, venue, topic..."
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 shrink-0 mr-1">
              <Filter className="w-3.5 h-3.5" /> Filter:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Events Grid */}
        {loading ? (
          <EventGridSkeleton count={6} />
        ) : filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id || event._id}
                event={event}
                variant="upcoming"
                onRegister={handleRegister}
                isRegistering={registeringId === (event.id || event._id)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            type={searchQuery || selectedCategory !== 'All' ? 'search' : 'upcoming-events'}
            onActionClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
            }}
            actionText="Clear Filters"
          />
        )}
      </div>
    </div>
  );
};
