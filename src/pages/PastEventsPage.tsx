import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Image as ImageIcon, Search, Filter, Calendar } from 'lucide-react';
import { eventsApi } from '../services/api';
import { EventItem } from '../types';
import { EventCard } from '../components/EventCard';
import { EventGridSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';

export const PastEventsPage: React.FC = () => {
  const [pastEvents, setPastEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All');

  useEffect(() => {
    const fetchPastEvents = async () => {
      try {
        setLoading(true);
        const data = await eventsApi.getEvents({ type: 'past' });
        setPastEvents(data);
      } catch (err) {
        console.error('Error fetching past events:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPastEvents();
  }, []);

  const departments = ['All', 'Computer Science & Engineering', 'Physical Education & Athletics', 'Humanities & Social Sciences', 'Fine Arts & Student Council'];

  const filteredEvents = pastEvents.filter((e) => {
    const matchesSearch =
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.department.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept =
      selectedDepartment === 'All' || e.department.toLowerCase() === selectedDepartment.toLowerCase();

    return matchesSearch && matchesDept;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
              <ImageIcon className="w-4 h-4" />
              <span>Campus Archive & Highlights</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Past Events & Memories
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Browse previous campus symposiums, athletic meets, and galas. Click any poster to view full photo galleries.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search past events..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Grid of Past Events with Poster as Main/Front Display */}
        {loading ? (
          <EventGridSkeleton count={6} />
        ) : filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id || event._id}
                event={event}
                variant="past"
              />
            ))}
          </div>
        ) : (
          <EmptyState
            type="past-events"
            title="No past events found"
            description="No past events match your search query."
          />
        )}
      </div>
    </div>
  );
};
