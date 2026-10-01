import React from 'react';

export const EventCardSkeleton: React.FC = () => {
  return (
    <div aria-hidden="true" className="flex flex-col overflow-hidden rounded-[1.35rem] border border-slate-200 bg-white shadow-sm animate-pulse dark:border-slate-800 dark:bg-slate-900">
      <div className="aspect-[16/9] w-full bg-slate-200 dark:bg-slate-800" />
      <div className="p-5 space-y-3">
        <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
          <div className="h-9 flex-1 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-9 flex-1 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
      </div>
    </div>
  );
};

export const EventGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  );
};
