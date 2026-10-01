import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Search, Filter, Tag, Building2 } from 'lucide-react';
import { eventsApi, registrationsApi } from '../services/api';
import { EventItem } from '../types';
import { EventCard } from '../components/EventCard';
import { EventGridSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

export const UpcomingEventsPage: React.FC = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [registeringId, setRegisteringId] = useState<string | null>(null);

  const { isAuthenticated, isStudent } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const categories = ['All', 'Technical', 'Cultural','Placement', 'Tech_Teach','Sports', 'Seminar', 'Workshop'];
  const departments = [
    'All',
    'Computer Science & Engineering',
    'Mechanical & Robotics Engineering',
    'Placement & Trainning',
    'Electrical & Electronics Engineering',
    'Artificial Intelligence & Data Science',
    'Fine Arts & Student Council',
    'Physical Education & Athletics'
  ];

  const fetchUpcoming = async () => {
    try {
      setLoading(true);
      const data = await eventsApi.getEvents({ type: 'upcoming' });
      setEvents(data);
    } catch (err) {
      console.error('Error fetching upcoming events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpcoming();
  }, []);

  const handleRegister = async (event: EventItem) => {
    if (!isAuthenticated) {
      navigate('/login?role=student');
      return;
    }
    if (!isStudent) {
      showToast('Only registered students can register for events.', 'info');
      return;
    }

    const eventId = event.id || event._id!;
    setRegisteringId(eventId);
    try {
      await registrationsApi.register(eventId);
      showToast(`Registered for "${event.title}"!`, 'success');
      setEvents((prev) =>
        prev.map((e) =>
          e.id === eventId || e._id === eventId
            ? { ...e, isRegistered: true, registrationCount: (e.registrationCount || 0) + 1 }
            : e
        )
      );
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to register';
      showToast(msg, 'error');
    } finally {
      setRegisteringId(null);
    }
  };

  const filteredEvents = events.filter((ev) => {
    const matchesSearch =
      ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.venue.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCat =
      selectedCategory === 'All' || ev.category.toLowerCase() === selectedCategory.toLowerCase();

    const matchesDept =
      selectedDepartment === 'All' || ev.department.toLowerCase() === selectedDepartment.toLowerCase();

    return matchesSearch && matchesCat && matchesDept;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
              <Calendar className="w-4 h-4" />
              <span>Campus Calendar</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Upcoming College Events
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Discover workshops, hackathons, guest seminars, and athletic matches.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, venue, topic..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 shrink-0">
              <Tag className="w-3.5 h-3.5" /> Category:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Event Cards Grid */}
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
            type="search"
            title="No upcoming events match your filter."
            description="Try changing the category or search keywords."
            onActionClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setSelectedDepartment('All');
            }}
            actionText="Reset Filters"
          />
        )}
      </div>
    </div>
  );
};
