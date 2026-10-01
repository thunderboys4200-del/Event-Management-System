import React, { useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, Building2, Tag, CheckCircle, ArrowRight, Image as ImageIcon, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { EventItem } from '../types';

interface EventCardProps {
  event: EventItem;
  variant?: 'upcoming' | 'past' | 'dashboard';
  onRegister?: (event: EventItem) => void;
  isRegistering?: boolean;
}

/**
 * Calculates 3D tilt rotation and glow position based on mouse coordinates
 * relative to the card element. Returns CSS custom property values.
 */
function computeTilt(
  e: React.MouseEvent<HTMLDivElement>,
  cardEl: HTMLDivElement,
  maxTilt: number = 12
) {
  const rect = cardEl.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;

  // rotateY: positive when cursor is right of center, rotateX: negative when cursor is below center
  const ry = ((x - centerX) / centerX) * maxTilt;
  const rx = ((centerY - y) / centerY) * maxTilt;

  // Glow position as percentage
  const glowX = `${(x / rect.width) * 100}%`;
  const glowY = `${(y / rect.height) * 100}%`;

  return { rx, ry, glowX, glowY };
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  variant = 'upcoming',
  onRegister,
  isRegistering = false,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const isPast = event.isPast || new Date(event.date) < new Date(new Date().toISOString().split('T')[0]);

  // Format date nicely
  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString + 'T00:00:00');
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'technical':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/80';
      case 'cultural':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/80';
      case 'sports':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/80';
      case 'seminar':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/80';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  // ── Mouse-tracking 3D tilt handlers ──
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const { rx, ry, glowX, glowY } = computeTilt(e, card);
    card.style.setProperty('--rx', `${rx}deg`);
    card.style.setProperty('--ry', `${ry}deg`);
    card.style.setProperty('--glow-x', glowX);
    card.style.setProperty('--glow-y', glowY);
    card.style.setProperty('--glow-opacity', '1');
  }, []);

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    card.style.setProperty('--rx', '0deg');
    card.style.setProperty('--ry', '0deg');
    card.style.setProperty('--glow-opacity', '0');
  }, []);

  // PAST EVENT DISPLAY (Poster as main/front display as specified in Section 11)
  if (variant === 'past' || isPast) {
    return (
      <div className="perspective-container">
        <motion.div
          ref={cardRef}
          id={`past-event-card-${event.id || event._id}`}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          initial={{ opacity: 0, y: 20, rotateX: 6 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="card-3d group relative flex flex-col bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800/80 shadow-sm"
        >
          {/* Glowing edge highlight */}
          <div className="card-3d-glow" />

          {/* Main/Front Event Poster */}
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
            <img
              src={event.posterUrl}
              alt={event.title}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80';
              }}
            />
            {/* Shimmer sweep */}
            <div className="card-3d-shimmer" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-black/20" />

            {/* Badge: Past Event */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-900/85 text-slate-200 backdrop-blur-md border border-white/10">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              Concluded
            </div>

            {/* Photos count pill */}
            {event.photoUrls && event.photoUrls.length > 0 && (
              <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-950/80 text-indigo-200 backdrop-blur-md border border-indigo-500/30 shadow-sm">
                <ImageIcon className="w-3.5 h-3.5" />
                <span>{event.photoUrls.length} Photos</span>
              </div>
            )}

            {/* Poster Overlay Text */}
            <div className="absolute bottom-3 left-3.5 right-3.5 text-white">
              <span className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider block mb-0.5">
                {event.department}
              </span>
              <h3 className="text-base sm:text-lg font-bold line-clamp-1 group-hover:text-indigo-200 transition-colors">
                {event.title}
              </h3>
            </div>
          </div>

          {/* Content Footer */}
          <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-3">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
                <span className="font-medium text-slate-700 dark:text-slate-300">{formatDate(event.date)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="line-clamp-1">{event.venue}</span>
              </div>
            </div>

            {/* View Memories Action */}
            <Link
              id={`view-memories-btn-${event.id || event._id}`}
              to={`/events/${event.id || event._id}/memories`}
              className="btn-3d-press w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-500 transition-colors shadow-sm"
            >
              <ImageIcon className="w-4 h-4" />
              <span>View Memories ({event.photoUrls?.length || 0})</span>
              <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // UPCOMING / DASHBOARD EVENT CARD (Section 8 requirements)
  return (
    <div className="perspective-container">
      <motion.div
        ref={cardRef}
        id={`event-card-${event.id || event._id}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        initial={{ opacity: 0, y: 20, rotateX: 6 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="card-3d group relative flex flex-col overflow-hidden rounded-[1.35rem] border border-slate-200/90 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900"
      >
        {/* Glowing edge highlight */}
        <div className="card-3d-glow" />

        {/* Event Poster Header */}
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
          <img
            src={event.posterUrl}
            alt={event.title}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80';
            }}
          />
          {/* Shimmer sweep */}
          <div className="card-3d-shimmer" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/20" />

          {/* Registered status indicator */}
          {event.isRegistered && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-md shadow-emerald-600/30">
              <CheckCircle className="w-3.5 h-3.5" />
              Registered
            </div>
          )}

          {/* Registration count if available */}
          {typeof event.registrationCount === 'number' && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-black/60 text-white backdrop-blur-md border border-white/10">
              <Users className="w-3.5 h-3.5 text-indigo-300" />
              <span>{event.registrationCount} Registered</span>
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="p-5 flex flex-col flex-1 justify-between gap-4">
          <div className="space-y-2.5">
            {/* Category follows the poster so event cards retain a consistent reading order. */}
            <span className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${getCategoryColor(event.category)}`}>
              <Tag className="w-3 h-3" />
              {event.category}
            </span>

            {/* Event Title */}
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
              {event.title}
            </h3>

            {/* Department badge */}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              <Building2 className="w-3.5 h-3.5 shrink-0" />
              <span className="line-clamp-1">{event.department}</span>
            </div>

            {/* Short Description */}
            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
              {event.description}
            </p>

            {/* Date, Time, Venue Meta Grid */}
            <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
                <span className="font-semibold text-slate-700 dark:text-slate-200">{formatDate(event.date)}</span>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{event.time}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="line-clamp-1">{event.venue}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons: View Details & Register Now */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2.5">
            <Link
              id={`view-details-btn-${event.id || event._id}`}
              to={`/events/${event.id || event._id}`}
              className="btn-3d-press flex-1 text-center py-2.5 px-3 rounded-xl border border-slate-300/80 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              View Details
            </Link>

            {event.isRegistered ? (
              <button
                disabled
                className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-bold cursor-default flex items-center justify-center gap-1.5"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Already Registered
              </button>
            ) : (
              <button
                id={`register-now-btn-${event.id || event._id}`}
                onClick={() => onRegister && onRegister(event)}
                disabled={isRegistering}
                className="btn-3d-press flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm hover:shadow-md hover:shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-1 cursor-pointer"
              >
                {isRegistering ? 'Registering...' : 'Register Now'}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
