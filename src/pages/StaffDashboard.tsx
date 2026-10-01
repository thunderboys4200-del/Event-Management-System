import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  PlusCircle,
  Edit,
  Trash2,
  Users,
  Eye,
  Ticket,
  Search,
  Building2,
  CheckCircle2,
  X,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Download,
  BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { eventsApi, statsApi } from '../services/api';
import { EventItem, StaffStats } from '../types';
import { ConfirmModal } from '../components/ConfirmModal';
import { EmptyState } from '../components/EmptyState';
import { EventCardSkeleton } from '../components/LoadingSkeleton';
import { useToast } from '../components/Toast';

export const StaffDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [stats, setStats] = useState<StaffStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'past'>('all');

  // Delete modal state
  const [eventToDelete, setEventToDelete] = useState<EventItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Registrations modal state
  const [viewingRegistrationsEvent, setViewingRegistrationsEvent] = useState<EventItem | null>(null);
  const [registrationsList, setRegistrationsList] = useState<any[]>([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState<boolean>(false);

  const fetchStaffData = async () => {
    try {
      setLoading(true);
      const [allEvents, statsData] = await Promise.all([
        eventsApi.getEvents({ type: 'all' }),
        statsApi.getStats() as Promise<StaffStats>,
      ]);
      setEvents(allEvents);
      setStats(statsData);
    } catch (err) {
      console.error('Error fetching staff dashboard data:', err);
      showToast('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, []);

  const handleDeleteConfirm = async () => {
    if (!eventToDelete) return;
    const eventId = eventToDelete.id || eventToDelete._id!;
    setIsDeleting(true);

    try {
      await eventsApi.deleteEvent(eventId);
      showToast('Event deleted successfully.', 'success');
      setEvents((prev) => prev.filter((e) => (e.id !== eventId && e._id !== eventId)));
      setEventToDelete(null);

      // Refresh stats
      const freshStats = await statsApi.getStats() as StaffStats;
      setStats(freshStats);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to delete event';
      showToast(msg, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenRegistrations = async (event: EventItem) => {
    setViewingRegistrationsEvent(event);
    setLoadingRegistrations(true);
    try {
      const list = await eventsApi.getEventRegistrations(event.id || event._id!);
      setRegistrationsList(list);
    } catch (err) {
      console.error('Error fetching event attendee list:', err);
      showToast('Failed to load attendee list', 'error');
    } finally {
      setLoadingRegistrations(false);
    }
  };

  const handleDownloadRegistrations = async () => {
    if (!viewingRegistrationsEvent) return;
    try {
      const eventId = viewingRegistrationsEvent.id || viewingRegistrationsEvent._id!;
      const file = await eventsApi.downloadRegistrations(eventId);
      const link = document.createElement('a');
      link.href = URL.createObjectURL(file);
      link.download = `${viewingRegistrationsEvent.title.replace(/[^a-z0-9]+/gi, '-').replace(/(^-|-$)/g, '')}-registrations.xls`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(link.href);
      showToast('Registration list downloaded in Excel format.', 'success');
    } catch (err) {
      showToast('Failed to download the registration list.', 'error');
    }
  };

  const today = new Date().toISOString().split('T')[0];

  const filteredEvents = events.filter((ev) => {
    const isPast = ev.date < today;
    if (activeTab === 'upcoming' && isPast) return false;
    if (activeTab === 'past' && !isPast) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        ev.title.toLowerCase().includes(q) ||
        ev.department.toLowerCase().includes(q) ||
        ev.venue.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // The dashboard chart is derived from the events already returned by the API.
  // It deliberately does not introduce sample or fabricated analytics data.
  const departmentActivityTotals = events.reduce<Record<string, number>>((totals, event) => {
    totals[event.department] = (totals[event.department] || 0) + 1;
    return totals;
  }, {});
  const departmentActivity = (Object.entries(departmentActivityTotals) as Array<[string, number]>)
    .sort(([, left], [, right]) => right - left)
    .slice(0, 5);
  const largestDepartmentCount = Math.max(...departmentActivity.map(([, count]) => count), 1);

  return (
    <div className="page-canvas min-h-screen bg-slate-50/80 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800/80 shadow-sm"
        >
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>Staff Administrator Console • {user?.loginId}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Campus Event Operations
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {user?.name} ({user?.department}) • Create, monitor, and manage collegiate events.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 self-start sm:self-auto">
            <Link id="staff-create-event-btn" to="/staff/events/create" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/20 transition-all cursor-pointer">
              <PlusCircle className="w-4 h-4" />
              <span>Create New Event</span>
            </Link>
            <Link id="staff-create-past-event-btn" to="/staff/events/create-past?type=past" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer">
              <Calendar className="w-4 h-4" />
              <span>Create Past Event</span>
            </Link>
          </div>
        </motion.div>

        {/* Statistics Row (Total Events, Upcoming Events, Past Events, Total Registrations) */}
        <div id="staff-stats-grid" className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            whileHover={{ y: -3, transition: { duration: 0.15 } }}
            className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-sm"
          >
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Events</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              {stats ? stats.totalEvents : '...'}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Published campus wide</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            whileHover={{ y: -3, transition: { duration: 0.15 } }}
            className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-sm"
          >
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Upcoming Events</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
              {stats ? stats.upcomingEvents : '...'}
            </h3>
            <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium mt-1">Accepting registrations</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            whileHover={{ y: -3, transition: { duration: 0.15 } }}
            className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-sm"
          >
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Past Events</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-700 dark:text-slate-300 mt-1">
              {stats ? stats.pastEvents : '...'}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Archived with memories</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            whileHover={{ y: -3, transition: { duration: 0.15 } }}
            className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-sm"
          >
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Registrations</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {stats ? stats.totalRegistrations : '...'}
            </h3>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">Student tickets issued</p>
          </motion.div>
        </div>

        <section className="grid grid-cols-1 lg:grid-cols-[1.35fr_0.65fr] gap-5" aria-label="Event activity analytics">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-400">
                  <BarChart3 className="w-3.5 h-3.5" />
                  Live activity
                </div>
                <h2 className="mt-1 text-base font-bold text-slate-900 dark:text-white">Events by department</h2>
              </div>
              <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">{events.length} total</span>
            </div>

            {departmentActivity.length > 0 ? (
              <div className="mt-5 space-y-3.5">
                {departmentActivity.map(([department, count]) => (
                  <div key={department} className="grid grid-cols-[minmax(7rem,1fr)_2rem] items-center gap-3 text-xs">
                    <div className="min-w-0">
                      <div className="mb-1.5 flex items-center justify-between gap-3">
                        <span className="truncate font-semibold text-slate-700 dark:text-slate-200">{department}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 transition-[width] duration-500"
                          style={{ width: `${Math.max((count / largestDepartmentCount) * 100, 9)}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-right font-black tabular-nums text-slate-900 dark:text-white">{count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-5 text-xs text-slate-500 dark:text-slate-400">Department activity will appear as soon as events are published.</p>
            )}
          </div>

          <div className="rounded-3xl border border-indigo-200/70 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-5 text-white shadow-lg shadow-indigo-950/10 sm:p-6">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-indigo-100">Registration pulse</p>
            <p className="mt-3 text-3xl font-black tabular-nums">{stats?.totalRegistrations ?? '—'}</p>
            <p className="mt-1 text-xs leading-relaxed text-indigo-100">Confirmed registrations across all published campus events.</p>
            <div className="mt-5 border-t border-white/20 pt-4 text-xs font-semibold text-white/90">
              {stats?.upcomingEvents ?? 0} upcoming event{stats?.upcomingEvents === 1 ? '' : 's'} accepting registrations
            </div>
          </div>
        </section>

        {/* Management Controls: Tabs & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/80 dark:bg-slate-800 rounded-xl self-start">
            <button
              id="staff-tab-all"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              All Events ({events.length})
            </button>
            <button
              id="staff-tab-upcoming"
              onClick={() => setActiveTab('upcoming')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'upcoming'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Upcoming ({events.filter(e => e.date >= today).length})
            </button>
            <button
              id="staff-tab-past"
              onClick={() => setActiveTab('past')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'past'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Past ({events.filter(e => e.date < today).length})
            </button>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search event title or venue..."
              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* Events Table / Card list */}
        {loading ? (
          <div className="space-y-4">
            <EventCardSkeleton />
            <EventCardSkeleton />
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800/80 text-slate-500 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">Event</th>
                    <th className="py-3.5 px-4 font-semibold">Department & Category</th>
                    <th className="py-3.5 px-4 font-semibold">Schedule</th>
                    <th className="py-3.5 px-4 font-semibold text-center">Registrations</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredEvents.map((ev) => {
                    const eventId = ev.id || ev._id!;
                    const isPast = ev.date < today;

                    return (
                      <tr key={eventId} id={`staff-event-row-${eventId}`} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        {/* Event Title & Poster */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-14 h-10 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                              <img
                                src={ev.posterUrl}
                                alt={ev.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80';
                                }}
                              />
                            </div>
                            <div className="max-w-xs">
                              <Link
                                to={`/events/${eventId}`}
                                className="font-bold text-slate-900 dark:text-white hover:text-indigo-600 line-clamp-1"
                              >
                                {ev.title}
                              </Link>
                              <span className="text-[11px] text-slate-400 block line-clamp-1">
                                {ev.venue}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Dept & Category */}
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                            {ev.department}
                          </span>
                          <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                            {ev.category}
                          </span>
                        </td>

                        {/* Date & Time */}
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                            {ev.date}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {ev.time}
                          </span>
                        </td>

                        {/* Registrations count button */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            id={`view-attendees-btn-${eventId}`}
                            onClick={() => handleOpenRegistrations(ev)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors cursor-pointer"
                          >
                            <Users className="w-3.5 h-3.5" />
                            <span>{ev.registrationCount || 0}</span>
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View Event */}
                            <Link
                              to={`/events/${eventId}`}
                              className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
                              title="View Event Details"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>

                            {/* Edit Event */}
                            <Link
                              id={`edit-event-btn-${eventId}`}
                              to={`/staff/events/${eventId}/edit`}
                              className="p-2 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800 transition-colors"
                              title="Edit Event"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>

                            {/* Delete Event */}
                            <button
                              id={`delete-event-btn-${eventId}`}
                              onClick={() => setEventToDelete(ev)}
                              className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Delete Event"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <EmptyState
            type="staff-events"
            actionHref="/staff/events/create"
            actionText="Create First Event"
          />
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmModal
          isOpen={!!eventToDelete}
          title="Delete College Event"
          message={`Are you sure you want to delete this event: "${eventToDelete?.title}"? All student registration records for this event will also be removed. This action cannot be undone.`}
          confirmText="Delete Event"
          cancelText="Keep Event"
          isDangerous={true}
          isLoading={isDeleting}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setEventToDelete(null)}
        />

        {/* Registrations Drawer/Modal */}
        <AnimatePresence>
          {viewingRegistrationsEvent && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[85vh] flex flex-col"
              >
                {/* Modal Header */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>Registered Students Roster</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {viewingRegistrationsEvent.title}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Total Attendees: {registrationsList.length} students registered
                    </p>
                  </div>
                  <button
                    onClick={() => setViewingRegistrationsEvent(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex justify-end">
                  <button id="download-registrations-excel-btn" onClick={handleDownloadRegistrations} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors">
                    <Download className="w-4 h-4" />
                    Download Excel
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 overflow-y-auto flex-1 space-y-3">
                  {loadingRegistrations ? (
                    <div className="py-12 text-center text-slate-400 text-sm">
                      Loading registered attendees...
                    </div>
                  ) : registrationsList.length > 0 ? (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                      {registrationsList.map((item, idx) => {
                        const student = item.student;
                        return (
                          <div key={item.id || item._id || idx} className="p-3.5 flex items-center justify-between text-xs sm:text-sm bg-white dark:bg-slate-900">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 dark:text-white">
                                  {student?.name || 'Student'}
                                </span>
                                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px] font-semibold text-indigo-600">
                                  {student?.loginId || 'ID'}
                                </span>
                              </div>
                              <span className="text-slate-500 text-[11px] block mt-0.5">
                                {student?.department || 'Department'}
                              </span>
                            </div>
                            <div className="text-right text-[11px] text-slate-400">
                              <span>Registered on</span>
                              <span className="block font-medium text-slate-700 dark:text-slate-300">
                                {item.registeredAt ? new Date(item.registeredAt).toLocaleDateString() : 'Confirmed'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      No students have registered for this event yet.
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                  <button
                    onClick={() => setViewingRegistrationsEvent(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
                  >
                    Close Roster
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
