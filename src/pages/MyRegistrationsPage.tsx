import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, Ticket, ArrowRight, CheckCircle2, QrCode } from 'lucide-react';
import { registrationsApi } from '../services/api';
import { Registration } from '../types';
import { EmptyState } from '../components/EmptyState';
import { EventCardSkeleton } from '../components/LoadingSkeleton';

export const MyRegistrationsPage: React.FC = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        setLoading(true);
        const data = await registrationsApi.getMyRegistrations();
        setRegistrations(data);
      } catch (err) {
        console.error('Error fetching registrations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRegistrations();
  }, []);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="page-canvas min-h-screen bg-slate-50/80 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
              <Ticket className="w-4 h-4" />
              <span>Student Passports</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              My Event Registrations
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Your confirmed event entry passes and campus activity records
            </p>
          </div>

          <Link
            to="/events/upcoming"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors self-start sm:self-auto"
          >
            <span>Explore More Events</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Registrations List */}
        {loading ? (
          <div className="space-y-4">
            <EventCardSkeleton />
            <EventCardSkeleton />
          </div>
        ) : registrations.length > 0 ? (
          <div className="space-y-4">
            {registrations.map((reg) => {
              const ev = reg.event;
              if (!ev) return null;
              const eventId = ev.id || ev._id;

              return (
                <div
                  key={reg.id || reg._id}
                  id={`registration-item-${reg.id || reg._id}`}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col sm:flex-row items-stretch"
                >
                  {/* Event Poster Thumbnail */}
                  <div className="sm:w-56 h-48 sm:h-auto relative shrink-0 bg-slate-900 overflow-hidden">
                    <img
                      src={ev.posterUrl}
                      alt={ev.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent sm:hidden" />
                    <div className="absolute bottom-2 left-2 sm:hidden px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                      {ev.category}
                    </div>
                  </div>

                  {/* Pass Body */}
                  <div className="p-6 flex flex-col justify-between flex-1 gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                          {ev.category} • {ev.department}
                        </span>

                        {/* Registration Status Badge */}
                        <div className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Pass Active • Confirmed</span>
                        </div>
                      </div>

                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                        {ev.title}
                      </h3>

                      {/* Schedule details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400 pt-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span className="font-medium text-slate-700 dark:text-slate-300">{ev.date}</span>
                          <span>•</span>
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{ev.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          <span className="line-clamp-1">{ev.venue}</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer: Registration Date & Action */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="text-slate-400">
                        Registered on: <span className="text-slate-700 dark:text-slate-300 font-medium">{formatDate(reg.registeredAt || reg.createdAt)}</span>
                      </div>

                      <Link
                        to={`/events/${eventId}`}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <span>View Event Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            type="registrations"
            actionHref="/events/upcoming"
            actionText="Discover Upcoming Events"
          />
        )}
      </div>
    </div>
  );
};
