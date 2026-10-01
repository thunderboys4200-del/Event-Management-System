import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Building2,
  Tag,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  Users,
  ShieldAlert,
  Share2,
  Ticket,
  Image as ImageIcon
} from 'lucide-react';
import { eventsApi, registrationsApi } from '../services/api';
import { EventItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

export const EventDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isStudent } = useAuth();
  const { showToast } = useToast();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvent = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await eventsApi.getEventById(id);
      setEvent(data);
    } catch (err: any) {
      console.error('Error loading event:', err);
      setError('Event not found or failed to load.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const handleRegister = async () => {
    if (!isAuthenticated) {
      navigate('/login?role=student');
      return;
    }

    if (!isStudent) {
      showToast('Only registered students can sign up for events.', 'info');
      return;
    }

    if (!event) return;

    setIsRegistering(true);
    try {
      await registrationsApi.register(event.id || event._id!);
      showToast('Registration successful! Your attendee pass is confirmed.', 'success');

      // Refresh event status
      setEvent((prev) =>
        prev
          ? {
              ...prev,
              isRegistered: true,
              registrationCount: (prev.registrationCount || 0) + 1,
            }
          : null
      );
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to complete registration';
      showToast(msg, 'error');
    } finally {
      setIsRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="aspect-[16/9] w-full bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        <div className="h-8 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="h-4 w-5/6 bg-slate-200 dark:bg-slate-800 rounded" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert className="w-12 h-12 text-rose-500 mb-3" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
          {error || 'Event Not Found'}
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          The requested event may have been removed or does not exist.
        </p>
        <Link
          to="/"
          className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          Return to Portal Home
        </Link>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const isPast = event.isPast || event.date < today;
  const isDeadlinePassed = event.registrationDeadline && event.registrationDeadline < today;

  return (
    <div className="page-canvas min-h-screen bg-slate-50/80 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Back navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Events</span>
          </button>

          {isPast && (
            <Link
              to={`/events/${event.id || event._id}/memories`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs hover:bg-indigo-100 transition-colors"
            >
              <ImageIcon className="w-4 h-4" />
              <span>View Photo Memories</span>
            </Link>
          )}
        </div>

        {/* Large Event Poster */}
        <div className="relative aspect-[16/9] w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 bg-slate-900">
          <img
            src={event.posterUrl}
            alt={event.title}
            className="w-full h-full object-cover object-center"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />

          {/* Badges in Poster Header */}
          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-600/90 text-white backdrop-blur-md">
              {event.category}
            </span>
            {isPast ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800/90 text-slate-300 backdrop-blur-md">
                Concluded Event
              </span>
            ) : isDeadlinePassed ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/90 text-white backdrop-blur-md">
                Registration Closed
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-600/90 text-white backdrop-blur-md">
                Registration Open
              </span>
            )}
          </div>

          {/* Title Overlay in Poster bottom */}
          <div className="absolute bottom-6 left-6 right-6 text-white space-y-1">
            <p className="text-xs font-semibold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4" />
              {event.department}
            </p>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight">
              {event.title}
            </h1>
          </div>
        </div>

        {/* Details & Registration Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Column: Description & Program info */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                About the Event
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {event.description}
              </p>
            </div>

            {/* Department & Host info */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Organized by Department of {event.department}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Category: {event.category} • College Verified Host
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar Column: Schedule, Venue & Registration Action */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider">
                Event Logistics
              </h3>

              <div className="space-y-4 text-xs sm:text-sm">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium uppercase">Date</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{event.date}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium uppercase">Time</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{event.time}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium uppercase">Venue</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{event.venue}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium uppercase">Registration Deadline</span>
                    <span className={`font-semibold ${isDeadlinePassed ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'}`}>
                      {event.registrationDeadline}
                      {isDeadlinePassed && ' (Passed)'}
                    </span>
                  </div>
                </div>

                {typeof event.registrationCount === 'number' && (
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-400 block text-[11px] font-medium uppercase">Confirmed Attendees</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {event.registrationCount} students registered
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Registration Action Section */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                {isPast ? (
                  <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-center space-y-2">
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      This event concluded on {event.date}.
                    </p>
                    <Link
                      to={`/events/${event.id || event._id}/memories`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:underline"
                    >
                      <ImageIcon className="w-4 h-4" />
                      <span>Browse Photo Gallery</span>
                    </Link>
                  </div>
                ) : event.isRegistered ? (
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200 text-center space-y-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white mx-auto flex items-center justify-center">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <p className="font-bold text-sm">Already Registered</p>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300">
                      Your attendee pass is active. Review details in My Registrations.
                    </p>
                    <Link
                      to="/student/registrations"
                      className="inline-block pt-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                    >
                      View Registration Pass →
                    </Link>
                  </div>
                ) : isDeadlinePassed ? (
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200 text-center">
                    <p className="font-bold text-xs">Registration Closed</p>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-1">
                      The deadline for this event closed on {event.registrationDeadline}.
                    </p>
                  </div>
                ) : (
                  <button
                    id="details-register-btn"
                    onClick={handleRegister}
                    disabled={isRegistering}
                    className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/25 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isRegistering ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Confirming Registration...</span>
                      </>
                    ) : (
                      <>
                        <Ticket className="w-4 h-4" />
                        <span>Register Now</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
