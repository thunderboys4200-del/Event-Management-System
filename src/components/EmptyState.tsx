import React from 'react';
import { CalendarX2, Ticket, ImageOff, Search, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  type: 'upcoming-events' | 'registrations' | 'photos' | 'search' | 'past-events' | 'staff-events';
  title?: string;
  description?: string;
  actionText?: string;
  actionHref?: string;
  onActionClick?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  title,
  description,
  actionText,
  actionHref,
  onActionClick,
}) => {
  let defaultIcon = <CalendarX2 className="w-10 h-10 text-slate-400" />;
  let defaultTitle = 'No upcoming events available.';
  let defaultDesc = 'Check back soon for new collegiate announcements, workshops, and competitions.';

  switch (type) {
    case 'upcoming-events':
      defaultIcon = <CalendarX2 className="w-10 h-10 text-indigo-400" />;
      defaultTitle = 'No upcoming events available.';
      defaultDesc = 'There are currently no scheduled events matching your criteria. New events are posted regularly by departments.';
      break;
    case 'registrations':
      defaultIcon = <Ticket className="w-10 h-10 text-emerald-400" />;
      defaultTitle = "You haven't registered for any events yet.";
      defaultDesc = 'Discover exciting collegiate competitions, workshops, and cultural fests and secure your attendance.';
      break;
    case 'photos':
      defaultIcon = <ImageOff className="w-10 h-10 text-amber-400" />;
      defaultTitle = 'No photos available for this event.';
      defaultDesc = 'Campus photographers are still compiling memories and highlights for this event. Please check back later.';
      break;
    case 'search':
      defaultIcon = <Search className="w-10 h-10 text-slate-400" />;
      defaultTitle = 'No matching events found.';
      defaultDesc = 'Try refining your search keyword or clearing department and category filters.';
      break;
    case 'past-events':
      defaultIcon = <CalendarX2 className="w-10 h-10 text-slate-400" />;
      defaultTitle = 'No past events found.';
      defaultDesc = 'Previous campus events and memories will appear here after events conclude.';
      break;
    case 'staff-events':
      defaultIcon = <PlusCircle className="w-10 h-10 text-indigo-400" />;
      defaultTitle = 'No events created yet.';
      defaultDesc = 'Create your first college event to start accepting student registrations.';
      break;
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
      <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center mb-4">
        {defaultIcon}
      </div>
      <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white mb-1.5">
        {title || defaultTitle}
      </h3>
      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6 leading-relaxed">
        {description || defaultDesc}
      </p>

      {actionHref && (
        <Link
          to={actionHref}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors"
        >
          {actionText || 'Browse Events'}
        </Link>
      )}

      {onActionClick && !actionHref && (
        <button
          onClick={onActionClick}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors"
        >
          {actionText || 'Take Action'}
        </button>
      )}
    </div>
  );
};
