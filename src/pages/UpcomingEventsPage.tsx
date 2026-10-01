import React, { useEffect, useState } from 'react';
import { Calendar, Search, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { eventsApi, registrationsApi } from '../services/api';
import { EventItem } from '../types';
import { EventCard } from '../components/EventCard';
import { EventGridSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { DepartmentEventSelector } from '../components/DepartmentEventSelector';
import {
  CseBranch,
  MainEventDepartment,
  matchesDepartmentSelection,
  OtherEventDepartment,
} from '../constants/eventDepartments';

export const UpcomingEventsPage: React.FC = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDepartment, setSelectedDepartment] = useState<MainEventDepartment | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<CseBranch | null>(null);
  const [selectedOtherDepartment, setSelectedOtherDepartment] = useState<OtherEventDepartment | null>(null);
  const [registeringId, setRegisteringId] = useState<string | null>(null);

  const { isAuthenticated, isStudent } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const categories = ['All', 'Technical', 'Cultural', 'Placement', 'Tech_Teach', 'Sports', 'Seminar', 'Workshop'];
  const hasCompletedDepartmentSelection = Boolean(
    selectedDepartment &&
      (selectedDepartment === 'CSE'
        ? selectedBranch
        : selectedDepartment === 'Other'
          ? selectedOtherDepartment
          : true),
  );

  useEffect(() => {
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

    fetchUpcoming();
  }, []);

  const handleDepartmentSelect = (department: MainEventDepartment) => {
    setSelectedDepartment(department);
    setSelectedBranch(null);
    setSelectedOtherDepartment(null);
  };

  const handleBackToDepartments = () => {
    setSelectedDepartment(null);
    setSelectedBranch(null);
    setSelectedOtherDepartment(null);
  };

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
      setEvents((previousEvents) =>
        previousEvents.map((currentEvent) =>
          currentEvent.id === eventId || currentEvent._id === eventId
            ? { ...currentEvent, isRegistered: true, registrationCount: (currentEvent.registrationCount || 0) + 1 }
            : currentEvent,
        ),
      );
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to register';
      showToast(message, 'error');
    } finally {
      setRegisteringId(null);
    }
  };

  const filteredEvents = events.filter((event) => {
    const normalizedSearch = searchQuery.toLowerCase();
    const matchesSearch =
      event.title.toLowerCase().includes(normalizedSearch) ||
      event.description.toLowerCase().includes(normalizedSearch) ||
      event.venue.toLowerCase().includes(normalizedSearch);
    const matchesCategory = selectedCategory === 'All' || event.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesDepartment = matchesDepartmentSelection(event.department, selectedDepartment, selectedBranch, selectedOtherDepartment);

    return matchesSearch && matchesCategory && matchesDepartment;
  });

  return (
    <div className="page-canvas min-h-screen bg-slate-50/80 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-violet-700 to-fuchsia-700 px-5 py-7 sm:px-8 sm:py-9 shadow-xl shadow-indigo-950/15">
          <div className="absolute -right-10 -top-16 h-52 w-52 rounded-full bg-fuchsia-300/25 blur-3xl" />
          <div className="absolute -bottom-20 left-8 h-48 w-48 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="relative max-w-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-indigo-50 backdrop-blur-sm">
              <Calendar className="w-3.5 h-3.5" />
              <span>Campus Calendar</span>
            </div>
            <h1 className="mt-4 text-3xl sm:text-4xl font-black tracking-tight text-white">Your next campus story starts here.</h1>
            <p className="mt-2 text-sm sm:text-base leading-relaxed text-indigo-100">Discover workshops, hackathons, guest seminars, and athletic matches—one department at a time.</p>
          </div>
        </div>

        <DepartmentEventSelector
          selectedDepartment={selectedDepartment}
          selectedBranch={selectedBranch}
          selectedOtherDepartment={selectedOtherDepartment}
          onDepartmentSelect={handleDepartmentSelect}
          onBranchSelect={setSelectedBranch}
          onOtherDepartmentSelect={setSelectedOtherDepartment}
          onBackToDepartments={handleBackToDepartments}
          onBackToBranches={() => setSelectedBranch(null)}
          onBackToOther={() => setSelectedOtherDepartment(null)}
        />

        {!selectedDepartment && (
          <EmptyState
            type="upcoming-events"
            title="Select a department to explore events"
            description="Choose CSE, ECE, EEE, MECH, CIVIL, or Other above to see the upcoming events for that department."
          />
        )}

        {hasCompletedDepartmentSelection && (
          <>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 shrink-0">
                  <Tag className="w-3.5 h-3.5" /> Category:
                </span>
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                      selectedCategory === category
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div className="relative w-full lg:w-72 shrink-0">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search title, venue, topic..."
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

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
                }}
                actionText="Reset Filters"
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};
