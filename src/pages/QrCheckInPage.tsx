import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  QrCode,
  ArrowLeft,
  Camera,
  CameraOff,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Users,
  Search,
  Download,
  Clock,
  Keyboard,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { attendanceApi, eventsApi } from '../services/api';
import { AttendanceRow, EventAttendance, EventItem, ScanResponse } from '../types';
import { QrScanner } from '../components/QrScanner';
import { useToast } from '../components/Toast';
import { formatTime, formatDateTime } from '../utils/format';

type ResultTone = 'success' | 'warning' | 'error';

interface ScanResultView {
  tone: ResultTone;
  title: string;
  message?: string;
  response?: ScanResponse;
}

const toneStyles: Record<ResultTone, { box: string; icon: string; title: string }> = {
  success: {
    box: 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40',
    icon: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400',
    title: 'text-emerald-800 dark:text-emerald-300',
  },
  warning: {
    box: 'border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40',
    icon: 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400',
    title: 'text-amber-800 dark:text-amber-300',
  },
  error: {
    box: 'border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40',
    icon: 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400',
    title: 'text-rose-800 dark:text-rose-300',
  },
};

function toResultView(res: ScanResponse): ScanResultView {
  switch (res.code) {
    case 'CHECKED_IN':
      return { tone: 'success', title: 'CHECK-IN SUCCESSFUL', response: res };
    case 'ALREADY_CHECKED_IN':
      return { tone: 'warning', title: 'ALREADY CHECKED IN', response: res };
    case 'WRONG_EVENT':
      return { tone: 'warning', title: 'WRONG EVENT', message: res.message, response: res };
    case 'INVALID_QR':
      return { tone: 'error', title: 'INVALID QR', message: res.message || 'This QR code is not valid.', response: res };
    case 'REGISTRATION_CANCELLED':
      return { tone: 'error', title: 'REGISTRATION CANCELLED', message: res.message, response: res };
    case 'EVENT_CANCELLED':
      return { tone: 'error', title: 'EVENT CANCELLED', message: res.message, response: res };
    case 'STUDENT_NOT_FOUND':
      return { tone: 'error', title: 'STUDENT NOT FOUND', message: res.message, response: res };
    case 'EVENT_REQUIRED':
    case 'EVENT_NOT_FOUND':
      return { tone: 'error', title: 'SELECT AN EVENT', message: res.message, response: res };
    default:
      return { tone: 'error', title: 'CHECK-IN FAILED', message: res.message || 'Something went wrong. Please try again.', response: res };
  }
}

const DetailRow: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
  <div className="flex items-start justify-between gap-4 py-1.5 text-xs sm:text-sm">
    <span className="text-slate-500 dark:text-slate-400 shrink-0">{label}</span>
    <span className="font-semibold text-slate-900 dark:text-white text-right break-words min-w-0">{value || '—'}</span>
  </div>
);

export const QrCheckInPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [eventsLoading, setEventsLoading] = useState<boolean>(true);
  const selectedEventId = searchParams.get('event') || '';

  const [attendance, setAttendance] = useState<EventAttendance | null>(null);
  const [attendanceLoading, setAttendanceLoading] = useState<boolean>(false);
  const [attendanceError, setAttendanceError] = useState<string>('');

  // Scanner state
  const [cameraOn, setCameraOn] = useState<boolean>(false);
  const [cameraStarting, setCameraStarting] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string>('');
  const [paused, setPaused] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(false);
  const [result, setResult] = useState<ScanResultView | null>(null);
  const [manualCode, setManualCode] = useState<string>('');
  const busyRef = useRef<boolean>(false);

  // Attendance list filters
  const [search, setSearch] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('All');
  const [yearFilter, setYearFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'CHECKED_IN' | 'NOT_CHECKED_IN'>('All');

  // ---- Events ----
  useEffect(() => {
    let cancelled = false;
    eventsApi
      .getEvents({ type: 'all' })
      .then((list) => {
        if (!cancelled) setEvents(list);
      })
      .catch(() => showToast('Failed to load events', 'error'))
      .finally(() => {
        if (!cancelled) setEventsLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sortedEvents = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const upcoming = events.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date));
    const past = events.filter((e) => e.date < today).sort((a, b) => b.date.localeCompare(a.date));
    return [...upcoming, ...past];
  }, [events]);

  const selectedEvent = events.find((e) => (e.id || e._id) === selectedEventId) || null;

  // ---- Attendance data (initial load, post-scan refresh and light polling) ----
  const loadAttendance = useCallback(
    async (silent = false) => {
      if (!selectedEventId) return;
      if (!silent) setAttendanceLoading(true);
      try {
        const data = await attendanceApi.getEventAttendance(selectedEventId);
        setAttendance(data);
        setAttendanceError('');
      } catch (err: any) {
        if (!silent) {
          setAttendanceError(err?.response?.data?.message || 'Failed to load attendance for this event.');
        }
      } finally {
        if (!silent) setAttendanceLoading(false);
      }
    },
    [selectedEventId]
  );

  useEffect(() => {
    setAttendance(null);
    setAttendanceError('');
    setResult(null);
    setPaused(false);
    busyRef.current = false;
    if (selectedEventId) loadAttendance(false);
  }, [selectedEventId, loadAttendance]);

  useEffect(() => {
    if (!selectedEventId) return;
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') loadAttendance(true);
    }, 5000);
    return () => clearInterval(timer);
  }, [selectedEventId, loadAttendance]);

  // ---- Scanning ----
  const scanNext = useCallback(() => {
    busyRef.current = false;
    setResult(null);
    setPaused(false);
  }, []);

  const processToken = useCallback(
    async (rawToken: string) => {
      if (busyRef.current || !selectedEventId) return;
      const token = rawToken.trim();
      if (!token) return;
      busyRef.current = true;
      setPaused(true);
      setChecking(true);
      try {
        const res = await attendanceApi.checkIn(token, selectedEventId);
        const view = toResultView(res);
        setResult(view);
        if (res.code === 'CHECKED_IN') {
          showToast(`${res.data?.student?.name || 'Student'} checked in.`, 'success');
        }
        loadAttendance(true);
      } catch (err: any) {
        const status = err?.response?.status;
        if (!err?.response) {
          setResult({
            tone: 'error',
            title: 'NETWORK ERROR',
            message: 'Could not reach the server. Check your connection and scan again.',
          });
        } else if (status === 401 || status === 403) {
          setResult({
            tone: 'error',
            title: 'NOT AUTHORIZED',
            message: 'Your session has expired or you are not allowed to check in students. Please sign in again as staff.',
          });
        } else {
          setResult({
            tone: 'error',
            title: 'SOMETHING WENT WRONG',
            message: err?.response?.data?.message || 'The server could not process this scan. Please try again.',
          });
        }
      } finally {
        setChecking(false);
      }
    },
    [selectedEventId, loadAttendance, showToast]
  );

  // Successful scans clear themselves so a queue can be processed quickly; problems wait for the staff member
  useEffect(() => {
    if (result?.tone !== 'success') return;
    const timer = setTimeout(scanNext, 3500);
    return () => clearTimeout(timer);
  }, [result, scanNext]);

  const startCamera = () => {
    if (!selectedEventId) {
      showToast('Select an event before starting the camera.', 'info');
      return;
    }
    setCameraError('');
    setCameraStarting(true);
    setCameraOn(true);
  };

  const stopCamera = () => {
    setCameraOn(false);
    setCameraStarting(false);
    setPaused(false);
    busyRef.current = false;
    setResult(null);
  };

  const handleCameraError = useCallback(
    (_kind: string, message: string) => {
      setCameraOn(false);
      setCameraStarting(false);
      setCameraError(message);
      showToast(message, 'error');
    },
    [showToast]
  );

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) {
      showToast('Select an event first.', 'info');
      return;
    }
    processToken(manualCode);
    setManualCode('');
  };

  const handleEventChange = (id: string) => {
    if (id) setSearchParams({ event: id }, { replace: true });
    else setSearchParams({}, { replace: true });
  };

  // ---- Export ----
  const handleDownload = async () => {
    if (!selectedEventId || !selectedEvent) return;
    try {
      const file = await attendanceApi.downloadAttendance(selectedEventId);
      const link = document.createElement('a');
      link.href = URL.createObjectURL(file);
      link.download = `${selectedEvent.title.replace(/[^a-z0-9]+/gi, '-').replace(/(^-|-$)/g, '')}-attendance.xls`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(link.href);
      showToast('Attendance report downloaded in Excel format.', 'success');
    } catch {
      showToast('Failed to download the attendance report.', 'error');
    }
  };

  // ---- Filters ----
  const attendees = attendance?.attendees || [];
  const departments = useMemo(() => Array.from(new Set(attendees.map((a) => a.student.department))).sort(), [attendees]);
  const years = useMemo(
    () => Array.from(new Set(attendees.map((a) => a.student.year).filter(Boolean) as string[])).sort(),
    [attendees]
  );

  const filteredAttendees = useMemo(() => {
    const q = search.trim().toLowerCase();
    return attendees.filter((a: AttendanceRow) => {
      if (departmentFilter !== 'All' && a.student.department !== departmentFilter) return false;
      if (yearFilter !== 'All' && a.student.year !== yearFilter) return false;
      if (statusFilter !== 'All' && a.attendanceStatus !== statusFilter) return false;
      if (q) {
        const hay = `${a.student.name} ${a.student.loginId} ${a.registrationId} ${a.student.branch} ${a.student.department}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [attendees, search, departmentFilter, yearFilter, statusFilter]);

  const stats = attendance?.stats;
  const filtersActive = !!search || departmentFilter !== 'All' || yearFilter !== 'All' || statusFilter !== 'All';
  const clearFilters = () => {
    setSearch('');
    setDepartmentFilter('All');
    setYearFilter('All');
    setStatusFilter('All');
  };

  const selectClass =
    'px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all';

  const statCards = [
    { label: 'Registered', value: stats?.registered, note: 'Confirmed registrations', color: 'text-slate-900 dark:text-white' },
    { label: 'Checked In', value: stats?.checkedIn, note: 'Present at the event', color: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Not Checked In', value: stats?.notCheckedIn, note: 'Yet to arrive', color: 'text-amber-600 dark:text-amber-400' },
    { label: 'Attendance', value: stats ? `${stats.percentage}%` : undefined, note: 'Of registered students', color: 'text-indigo-600 dark:text-indigo-400' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800/80 shadow-sm"
        >
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>QR Check-In & Attendance • {user?.loginId}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">QR Event Check-In</h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Select an event, start the camera and scan student Event Passes to mark attendance.
            </p>
          </div>
          <Link
            id="checkin-back-btn"
            to="/staff/dashboard"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all self-start sm:self-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Console</span>
          </Link>
        </motion.div>

        {/* Event selector */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-2">
          <label htmlFor="checkin-event-select" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Event
          </label>
          <select
            id="checkin-event-select"
            value={selectedEventId}
            onChange={(e) => handleEventChange(e.target.value)}
            disabled={eventsLoading}
            className={`${selectClass} w-full text-sm`}
          >
            <option value="">{eventsLoading ? 'Loading events...' : 'Select an event to begin'}</option>
            {sortedEvents.map((ev) => {
              const id = ev.id || ev._id!;
              return (
                <option key={id} value={id}>
                  {ev.title} — {ev.date}
                  {ev.status === 'cancelled' ? ' (Cancelled)' : ''}
                </option>
              );
            })}
          </select>
          {selectedEvent && (
            <p className="text-[11px] text-slate-400">
              {selectedEvent.venue} • {selectedEvent.time}
            </p>
          )}
        </div>

        {!selectedEventId ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <QrCode className="w-6 h-6" />
            </div>
            <p className="font-bold text-slate-800 dark:text-slate-100">Choose an event to start checking students in</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Attendance figures and the scanner appear here once an event is selected.</p>
          </div>
        ) : (
          <>
            {/* Attendance statistics */}
            <div id="attendance-stats-grid" className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {statCards.map((card, i) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.05 * (i + 1) }}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-sm"
                >
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{card.label}</p>
                  <h3 className={`text-2xl sm:text-3xl font-extrabold mt-1 ${card.color}`}>{card.value ?? '...'}</h3>
                  <p className="text-[11px] text-slate-400 mt-1">{card.note}</p>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Scanner */}
              <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 uppercase tracking-wider">
                    <QrCode className="w-4 h-4" />
                    <span>QR Scanner</span>
                  </div>
                  {cameraOn ? (
                    <button
                      id="checkin-stop-camera-btn"
                      onClick={stopCamera}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      <CameraOff className="w-4 h-4" />
                      Stop Camera
                    </button>
                  ) : (
                    <button
                      id="checkin-start-camera-btn"
                      onClick={startCamera}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-colors cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      Start Camera
                    </button>
                  )}
                </div>

                <div className="relative min-h-[380px] rounded-2xl bg-slate-100 dark:bg-slate-800/60 overflow-hidden">
                  {cameraOn && <QrScanner running={cameraOn} paused={paused} onDecode={processToken} onCameraError={handleCameraError} onStarted={() => setCameraStarting(false)} />}

                  {/* Camera off / starting / error placeholder */}
                  {(!cameraOn || cameraStarting) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                      {cameraStarting ? (
                        <>
                          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                          <p className="text-sm text-slate-500 dark:text-slate-400">Starting camera... allow access if your browser asks.</p>
                        </>
                      ) : cameraError ? (
                        <>
                          <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                            <CameraOff className="w-6 h-6" />
                          </div>
                          <p id="checkin-camera-error" className="text-sm font-semibold text-slate-800 dark:text-slate-100 max-w-sm">
                            {cameraError}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">You can still check students in with manual entry below.</p>
                        </>
                      ) : (
                        <>
                          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                            <Camera className="w-6 h-6" />
                          </div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Camera is off. Press Start Camera to begin scanning.</p>
                        </>
                      )}
                    </div>
                  )}

                  {/* Checking / result overlay */}
                  {(checking || result) && (
                    <div className="absolute inset-0 z-10 bg-white/95 dark:bg-slate-900/95 overflow-y-auto p-4 sm:p-5 flex">
                      {checking ? (
                        <div className="m-auto flex flex-col items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                          <span>Verifying QR code...</span>
                        </div>
                      ) : (
                        result && <ScanResultCard result={result} onNext={scanNext} />
                      )}
                    </div>
                  )}
                </div>

                {/* Manual entry fallback */}
                <form onSubmit={handleManualSubmit} className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Keyboard className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="checkin-manual-input"
                      type="text"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      placeholder="Or paste a QR code value manually..."
                      autoComplete="off"
                      spellCheck={false}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                  <button
                    id="checkin-manual-submit"
                    type="submit"
                    disabled={!manualCode.trim() || checking || !!result}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    Check In
                  </button>
                </form>
              </div>

              {/* Recent check-ins */}
              <div id="recent-checkins" className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    <Clock className="w-4 h-4" />
                    <span>Recent Check-Ins</span>
                  </div>
                  <span className="text-[11px] text-slate-400 inline-flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" />
                    Live
                  </span>
                </div>
                {stats && stats.recentCheckIns.length > 0 ? (
                  <ul className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                    {stats.recentCheckIns.map((c) => (
                      <li key={`${c.registrationId}-${c.checkedInAt}`} className="px-3.5 py-2.5 text-xs sm:text-sm bg-white dark:bg-slate-900 flex items-center gap-2">
                        <span className="font-mono text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">{formatTime(c.checkedInAt)}</span>
                        <span className="text-slate-300 dark:text-slate-600">—</span>
                        <span className="font-bold text-slate-900 dark:text-white truncate">{c.name}</span>
                        <span className="text-slate-300 dark:text-slate-600">—</span>
                        <span className="text-slate-500 dark:text-slate-400 shrink-0">{c.branch || c.department}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex-1 flex items-center justify-center py-12 text-center text-slate-400 text-xs">
                    No students have checked in yet.
                  </div>
                )}
              </div>
            </div>

            {/* Attendance list */}
            <div id="attendance-list" className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden">
              <div className="p-5 sm:p-6 space-y-4 border-b border-slate-200/80 dark:border-slate-800/80">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>Attendance List</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Showing {filteredAttendees.length} of {attendees.length} registered students
                    </p>
                  </div>
                  <button
                    id="download-attendance-btn"
                    onClick={handleDownload}
                    className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    <Download className="w-4 h-4" />
                    Download Attendance
                  </button>
                </div>

                <div className="flex flex-col lg:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="attendance-search"
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search name, student ID, registration ID or branch..."
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                  <select id="attendance-filter-department" value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className={selectClass}>
                    <option value="All">All Departments</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <select id="attendance-filter-year" value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className={selectClass}>
                    <option value="All">All Years</option>
                    {years.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                  <select id="attendance-filter-status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className={selectClass}>
                    <option value="All">All Attendance</option>
                    <option value="CHECKED_IN">Checked In</option>
                    <option value="NOT_CHECKED_IN">Not Checked In</option>
                  </select>
                  {filtersActive && (
                    <button onClick={clearFilters} className="px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {attendanceLoading && !attendance ? (
                <div className="py-14 text-center text-slate-400 text-sm">Loading attendance...</div>
              ) : attendanceError ? (
                <div className="py-14 text-center text-rose-600 dark:text-rose-400 text-sm">{attendanceError}</div>
              ) : filteredAttendees.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800/80 text-slate-500 uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3.5 px-4 font-semibold">Student</th>
                        <th className="py-3.5 px-4 font-semibold">Department</th>
                        <th className="py-3.5 px-4 font-semibold">Branch</th>
                        <th className="py-3.5 px-4 font-semibold">Year</th>
                        <th className="py-3.5 px-4 font-semibold">Registration ID</th>
                        <th className="py-3.5 px-4 font-semibold">Registration</th>
                        <th className="py-3.5 px-4 font-semibold">Attendance</th>
                        <th className="py-3.5 px-4 font-semibold">Check-in Time</th>
                        <th className="py-3.5 px-4 font-semibold">Checked-in By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredAttendees.map((a) => {
                        const isIn = a.attendanceStatus === 'CHECKED_IN';
                        return (
                          <tr key={a.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className="font-bold text-slate-900 dark:text-white block">{a.student.name}</span>
                              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px] font-semibold text-indigo-600">{a.student.loginId}</span>
                            </td>
                            <td className="py-3 px-4 text-slate-700 dark:text-slate-300 min-w-[180px]">{a.student.department}</td>
                            <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">{a.student.branch}</td>
                            <td className="py-3 px-4 whitespace-nowrap text-slate-700 dark:text-slate-300">{a.student.year || '—'}</td>
                            <td className="py-3 px-4 font-mono text-[11px] font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">{a.registrationId}</td>
                            <td className="py-3 px-4">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${a.status === 'cancelled' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'}`}>
                                {a.status === 'cancelled' ? 'Cancelled' : 'Confirmed'}
                              </span>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${isIn ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                                {isIn ? 'Checked In' : 'Not Checked In'}
                              </span>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap text-slate-700 dark:text-slate-300">{isIn ? formatDateTime(a.checkedInAt) : '—'}</td>
                            <td className="py-3 px-4 whitespace-nowrap text-slate-700 dark:text-slate-300">{isIn ? a.checkedInBy || '—' : '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-14 text-center text-slate-400 text-xs">
                  {attendees.length === 0 ? 'No students have registered for this event yet.' : 'No students match the current filters.'}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const ScanResultCard: React.FC<{ result: ScanResultView; onNext: () => void }> = ({ result, onNext }) => {
  const styles = toneStyles[result.tone];
  const data = result.response?.data;
  const student = data?.student;
  const Icon = result.tone === 'success' ? CheckCircle2 : result.tone === 'warning' ? AlertTriangle : XCircle;
  const isSuccess = result.response?.code === 'CHECKED_IN';
  const isDuplicate = result.response?.code === 'ALREADY_CHECKED_IN';

  return (
    <div id="scan-result" data-result-code={result.response?.code || 'CLIENT_ERROR'} className={`m-auto w-full max-w-md rounded-2xl border p-4 sm:p-5 space-y-3 ${styles.box}`}>
      <div className="flex items-center gap-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${styles.icon}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <h3 className={`text-lg font-extrabold leading-tight ${styles.title}`}>{result.title}</h3>
          {result.message && <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{result.message}</p>}
        </div>
      </div>

      {(isSuccess || isDuplicate) && student && (
        <div className="divide-y divide-slate-200/70 dark:divide-slate-700/70">
          <DetailRow label="Student" value={student.name} />
          {isSuccess && <DetailRow label="Student ID" value={student.studentId} />}
          {isSuccess && <DetailRow label="Department" value={student.department} />}
          {isSuccess && <DetailRow label="Year" value={student.year} />}
          {isSuccess && student.section && <DetailRow label="Section" value={student.section} />}
          {data?.event?.title && <DetailRow label="Event" value={data.event.title} />}
          <DetailRow label="Registration ID" value={<span className="font-mono">{data?.registrationId}</span>} />
          <DetailRow label={isSuccess ? 'Checked In' : 'First Checked In'} value={formatTime(data?.checkedInAt)} />
          {isSuccess && <DetailRow label="Attendance" value={<span className="text-emerald-700 dark:text-emerald-400">✓ PRESENT</span>} />}
        </div>
      )}

      {result.response?.code === 'WRONG_EVENT' && data?.otherEventTitle && (
        <DetailRow label="This pass is for" value={data.otherEventTitle} />
      )}

      <button
        id="scan-next-btn"
        onClick={onNext}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
      >
        <QrCode className="w-4 h-4" />
        Scan Next
      </button>
      {isSuccess && <p className="text-center text-[11px] text-slate-500 dark:text-slate-400">Scanning resumes automatically...</p>}
    </div>
  );
};
