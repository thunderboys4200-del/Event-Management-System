import React, { useEffect, useState } from 'react';
import { Image as ImageIcon, Search } from 'lucide-react';
import { eventsApi } from '../services/api';
import { EventItem } from '../types';
import { EventCard } from '../components/EventCard';
import { EventGridSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import { DepartmentEventSelector } from '../components/DepartmentEventSelector';
import {
  CseBranch,
  MainEventDepartment,
  matchesDepartmentSelection,
  OtherEventDepartment,
} from '../constants/eventDepartments';

export const PastEventsPage: React.FC = () => {
  const [pastEvents, setPastEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<MainEventDepartment | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<CseBranch | null>(null);
  const [selectedOtherDepartment, setSelectedOtherDepartment] = useState<OtherEventDepartment | null>(null);
  const hasCompletedDepartmentSelection = Boolean(
    selectedDepartment &&
      (selectedDepartment === 'CSE'
        ? selectedBranch
        : selectedDepartment === 'Other'
          ? selectedOtherDepartment
          : true),
  );

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

  const filteredEvents = pastEvents.filter((event) => {
    const normalizedSearch = searchQuery.toLowerCase();
    const matchesSearch =
      event.title.toLowerCase().includes(normalizedSearch) ||
      event.venue.toLowerCase().includes(normalizedSearch) ||
      event.department.toLowerCase().includes(normalizedSearch);
    const matchesDepartment = matchesDepartmentSelection(event.department, selectedDepartment, selectedBranch, selectedOtherDepartment);

    return matchesSearch && matchesDepartment;
  });

  return (
    <div className="page-canvas min-h-screen bg-slate-50/80 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-900 to-violet-900 px-5 py-7 sm:px-8 sm:py-9 shadow-xl shadow-indigo-950/15">
          <div className="absolute -right-10 -top-16 h-52 w-52 rounded-full bg-fuchsia-300/20 blur-3xl" />
          <div className="absolute -bottom-20 left-8 h-48 w-48 rounded-full bg-cyan-300/15 blur-3xl" />
          <div className="relative max-w-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-indigo-100 backdrop-blur-sm">
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Campus Archive & Highlights</span>
            </div>
            <h1 className="mt-4 text-3xl sm:text-4xl font-black tracking-tight text-white">Relive the moments that made campus buzz.</h1>
            <p className="mt-2 text-sm sm:text-base leading-relaxed text-indigo-100">Browse previous symposiums, competitions, and celebrations. Every poster opens a gallery of memories.</p>
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
            type="past-events"
            title="Select a department to explore events"
            description="Choose CSE, ECE, EEE, MECH, CIVIL, or Other above to browse matching past events."
          />
        )}

        {hasCompletedDepartmentSelection && (
          <>
            <div className="relative w-full sm:w-72 sm:ml-auto">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search past events..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {loading ? (
              <EventGridSkeleton count={6} />
            ) : filteredEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event) => (
                  <EventCard key={event.id || event._id} event={event} variant="past" />
                ))}
              </div>
            ) : (
              <EmptyState
                type="past-events"
                title="No past events found"
                description="No past events match your selected department or search query."
                onActionClick={() => setSearchQuery('')}
                actionText="Clear Search"
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};
