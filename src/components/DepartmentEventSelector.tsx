import React from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  Building2,
  Check,
  ChevronRight,
  CircuitBoard,
  Cpu,
  GraduationCap,
  HardHat,
  Sparkles,
  Users,
  Settings2,
  Zap,
} from 'lucide-react';
import {
  CSE_BRANCHES,
  CseBranch,
  getDepartmentSelectionLabel,
  MAIN_EVENT_DEPARTMENTS,
  MainEventDepartment,
  OTHER_EVENT_DEPARTMENTS,
  OtherEventDepartment,
} from '../constants/eventDepartments';

interface DepartmentEventSelectorProps {
  selectedDepartment: MainEventDepartment | null;
  selectedBranch: CseBranch | null;
  selectedOtherDepartment: OtherEventDepartment | null;
  onDepartmentSelect: (department: MainEventDepartment) => void;
  onBranchSelect: (branch: CseBranch) => void;
  onOtherDepartmentSelect: (department: OtherEventDepartment) => void;
  onBackToDepartments: () => void;
  onBackToBranches: () => void;
  onBackToOther: () => void;
}

interface DepartmentTheme {
  icon: React.ComponentType<{ className?: string }>;
  cardClass: string;
  iconClass: string;
  glowClass: string;
}

const departmentThemes: Record<MainEventDepartment, DepartmentTheme> = {
  CSE: {
    icon: Cpu,
    cardClass: 'border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-violet-50 hover:border-indigo-400 dark:border-indigo-900/70 dark:from-indigo-950/60 dark:via-slate-900 dark:to-violet-950/40',
    iconClass: 'bg-indigo-600 text-white shadow-indigo-500/30',
    glowClass: 'bg-indigo-400/20',
  },
  ECE: {
    icon: CircuitBoard,
    cardClass: 'border-cyan-200 bg-gradient-to-br from-cyan-50 via-white to-sky-50 hover:border-cyan-400 dark:border-cyan-900/70 dark:from-cyan-950/60 dark:via-slate-900 dark:to-sky-950/40',
    iconClass: 'bg-cyan-600 text-white shadow-cyan-500/30',
    glowClass: 'bg-cyan-400/20',
  },
  EEE: {
    icon: Zap,
    cardClass: 'border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 hover:border-amber-400 dark:border-amber-900/70 dark:from-amber-950/60 dark:via-slate-900 dark:to-orange-950/40',
    iconClass: 'bg-amber-500 text-white shadow-amber-500/30',
    glowClass: 'bg-amber-400/20',
  },
  MECH: {
    icon: Settings2,
    cardClass: 'border-rose-200 bg-gradient-to-br from-rose-50 via-white to-pink-50 hover:border-rose-400 dark:border-rose-900/70 dark:from-rose-950/60 dark:via-slate-900 dark:to-pink-950/40',
    iconClass: 'bg-rose-600 text-white shadow-rose-500/30',
    glowClass: 'bg-rose-400/20',
  },
  CIVIL: {
    icon: HardHat,
    cardClass: 'border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 hover:border-emerald-400 dark:border-emerald-900/70 dark:from-emerald-950/60 dark:via-slate-900 dark:to-teal-950/40',
    iconClass: 'bg-emerald-600 text-white shadow-emerald-500/30',
    glowClass: 'bg-emerald-400/20',
  },
  Other: {
    icon: Building2,
    cardClass: 'border-fuchsia-200 bg-gradient-to-br from-fuchsia-50 via-white to-purple-50 hover:border-fuchsia-400 dark:border-fuchsia-900/70 dark:from-fuchsia-950/60 dark:via-slate-900 dark:to-purple-950/40',
    iconClass: 'bg-fuchsia-600 text-white shadow-fuchsia-500/30',
    glowClass: 'bg-fuchsia-400/20',
  },
};

const branchThemes = [
  'border-violet-200 bg-violet-50 hover:border-violet-400 dark:border-violet-900/70 dark:bg-violet-950/35',
  'border-fuchsia-200 bg-fuchsia-50 hover:border-fuchsia-400 dark:border-fuchsia-900/70 dark:bg-fuchsia-950/35',
  'border-sky-200 bg-sky-50 hover:border-sky-400 dark:border-sky-900/70 dark:bg-sky-950/35',
  'border-teal-200 bg-teal-50 hover:border-teal-400 dark:border-teal-900/70 dark:bg-teal-950/35',
  'border-indigo-200 bg-indigo-50 hover:border-indigo-400 dark:border-indigo-900/70 dark:bg-indigo-950/35',
];

const otherDepartmentThemes = [
  'border-fuchsia-200 bg-fuchsia-50 hover:border-fuchsia-400 dark:border-fuchsia-900/70 dark:bg-fuchsia-950/35',
  'border-blue-200 bg-blue-50 hover:border-blue-400 dark:border-blue-900/70 dark:bg-blue-950/35',
  'border-amber-200 bg-amber-50 hover:border-amber-400 dark:border-amber-900/70 dark:bg-amber-950/35',
  'border-teal-200 bg-teal-50 hover:border-teal-400 dark:border-teal-900/70 dark:bg-teal-950/35',
  'border-violet-200 bg-violet-50 hover:border-violet-400 dark:border-violet-900/70 dark:bg-violet-950/35',
];

export const DepartmentEventSelector: React.FC<DepartmentEventSelectorProps> = ({
  selectedDepartment,
  selectedBranch,
  selectedOtherDepartment,
  onDepartmentSelect,
  onBranchSelect,
  onOtherDepartmentSelect,
  onBackToDepartments,
  onBackToBranches,
  onBackToOther,
}) => {
  const isChoosingCseBranch = selectedDepartment === 'CSE' && !selectedBranch;
  const isChoosingOtherDepartment = selectedDepartment === 'Other' && !selectedOtherDepartment;
  const isShowingEvents = Boolean(
    selectedDepartment &&
      (selectedDepartment === 'CSE'
        ? selectedBranch
        : selectedDepartment === 'Other'
          ? selectedOtherDepartment
          : true),
  );

  if (isShowingEvents && selectedDepartment) {
    const isCseSelection = selectedDepartment === 'CSE';
    const isOtherSelection = selectedDepartment === 'Other';
    const onBack = isCseSelection ? onBackToBranches : isOtherSelection ? onBackToOther : onBackToDepartments;
    const backLabel = isCseSelection ? 'Back to CSE Branches' : isOtherSelection ? 'Back to Other' : 'Back to Departments';

    return (
      <section className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 p-[1px] shadow-lg shadow-indigo-950/10">
        <div className="relative overflow-hidden rounded-[23px] bg-slate-950 px-5 py-4 sm:px-6 sm:py-5">
          <div className="absolute -right-10 -top-16 w-44 h-44 rounded-full bg-fuchsia-400/20 blur-3xl" />
          <div className="absolute -left-10 -bottom-16 w-40 h-40 rounded-full bg-cyan-400/15 blur-3xl" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/20 text-white flex items-center justify-center shadow-lg shadow-indigo-950/30">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-200">Your event feed</p>
                <p className="text-base sm:text-lg font-extrabold text-white mt-0.5">
                  {getDepartmentSelectionLabel(selectedDepartment, selectedBranch, selectedOtherDepartment)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onBack}
              className="inline-flex w-fit items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-50 transition-colors cursor-pointer shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {backLabel}
            </button>
          </div>
        </div>
      </section>
    );
  }

  const renderBackToDepartments = () => (
    <button
      type="button"
      onClick={onBackToDepartments}
      className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors cursor-pointer mb-4"
    >
      <ArrowLeft className="w-3.5 h-3.5" />
      Back to Departments
    </button>
  );

  return (
    <section className="relative isolate overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none">
      <div className="absolute -top-24 -right-16 w-64 h-64 rounded-full bg-indigo-200/40 dark:bg-indigo-800/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-16 w-56 h-56 rounded-full bg-fuchsia-200/30 dark:bg-fuchsia-900/20 blur-3xl pointer-events-none" />
      <div className="relative p-5 sm:p-7">
        {isChoosingCseBranch ? (
          <>
            <div className="flex flex-col gap-4 border-b border-slate-100 dark:border-slate-800 pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                {renderBackToDepartments()}
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 dark:bg-indigo-950 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                    <Check className="w-3 h-3" /> CSE selected
                  </span>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Choose a branch</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white mt-3">Pick your CSE branch</h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5">Choose a branch to reveal its matching events.</p>
              </div>
              <div className="hidden sm:flex w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white items-center justify-center shadow-lg shadow-indigo-500/25">
                <Cpu className="w-5 h-5" />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-5">
              {CSE_BRANCHES.map((branch, index) => (
                <button
                  key={branch}
                  type="button"
                  onClick={() => onBranchSelect(branch)}
                  className={`group relative overflow-hidden min-h-28 rounded-2xl border p-4 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ${branchThemes[index]}`}
                >
                  <span className="absolute right-3 top-3 w-7 h-7 rounded-full bg-white/65 dark:bg-slate-900/50 flex items-center justify-center text-slate-500 dark:text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                  <span className="inline-flex h-7 items-center rounded-full bg-white/80 dark:bg-slate-900/60 px-2 text-[10px] font-extrabold tracking-wide text-slate-500 dark:text-slate-300">CSE</span>
                  <span className="block mt-3 text-base font-black text-slate-900 dark:text-white">{branch}</span>
                  <span className="block mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">Explore events</span>
                </button>
              ))}
            </div>
          </>
        ) : isChoosingOtherDepartment ? (
          <>
            <div className="flex flex-col gap-4 border-b border-slate-100 dark:border-slate-800 pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                {renderBackToDepartments()}
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-fuchsia-100 dark:bg-fuchsia-950 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-fuchsia-700 dark:text-fuchsia-300">
                    <Check className="w-3 h-3" /> Other selected
                  </span>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Choose a department</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white mt-3">Choose an Other department</h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5">Select a department to see only its matching events.</p>
              </div>
              <div className="hidden sm:flex w-12 h-12 rounded-2xl bg-gradient-to-br from-fuchsia-600 to-violet-600 text-white items-center justify-center shadow-lg shadow-fuchsia-500/25">
                <Building2 className="w-5 h-5" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-5">
              {OTHER_EVENT_DEPARTMENTS.map((department, index) => (
                <button
                  key={department}
                  type="button"
                  onClick={() => onOtherDepartmentSelect(department)}
                  className={`group relative min-h-32 overflow-hidden rounded-2xl border p-4 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-fuchsia-500 ${otherDepartmentThemes[index]}`}
                >
                  <span className="absolute right-3 top-3 w-7 h-7 rounded-full bg-white/65 dark:bg-slate-900/50 flex items-center justify-center text-slate-500 dark:text-slate-300 group-hover:bg-fuchsia-600 group-hover:text-white transition-colors">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                  <span className="inline-flex h-7 items-center rounded-full bg-white/80 dark:bg-slate-900/60 px-2 text-[10px] font-extrabold tracking-wide text-slate-500 dark:text-slate-300">OTHER</span>
                  <span className="block max-w-[11rem] mt-3 text-sm font-black leading-snug text-slate-900 dark:text-white">{department}</span>
                  <span className="block mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">Explore events</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-4 border-b border-slate-100 dark:border-slate-800 pb-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-100 to-violet-100 dark:from-indigo-950 dark:to-violet-950 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                  <Sparkles className="w-3 h-3" /> Campus event finder
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white mt-3">What’s your department?</h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5">Select a department to explore events.</p>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-indigo-100 dark:border-indigo-900/60 bg-indigo-50/70 dark:bg-indigo-950/30 p-3 lg:max-w-60">
                <span className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/25">
                  <Users className="w-4 h-4" />
                </span>
                <p className="text-[11px] leading-relaxed font-semibold text-slate-600 dark:text-slate-300">Pick a department, then find your next campus moment.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-5">
              {MAIN_EVENT_DEPARTMENTS.map((department) => {
                const theme = departmentThemes[department];
                const Icon = theme.icon;
                return (
                  <button
                    key={department}
                    type="button"
                    onClick={() => onDepartmentSelect(department)}
                    className={`group relative isolate overflow-hidden min-h-36 rounded-2xl border p-4 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ${theme.cardClass}`}
                  >
                    <span className={`absolute -right-8 -bottom-10 w-28 h-28 rounded-full blur-2xl ${theme.glowClass}`} />
                    <span className={`relative w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${theme.iconClass}`}>
                      <Icon className="w-4.5 h-4.5" />
                    </span>
                    <span className="relative block mt-5 text-base font-black tracking-tight text-slate-900 dark:text-white">{department}</span>
                    <span className="relative mt-1.5 flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white transition-colors">
                      {department === 'CSE' ? 'Choose your branch' : department === 'Other' ? 'Choose a department' : 'Browse events'} <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </section>
  );
};
