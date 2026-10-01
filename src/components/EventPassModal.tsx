import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'motion/react';
import { X, CheckCircle2, Circle, Calendar, Clock, MapPin, AlertTriangle, RefreshCw } from 'lucide-react';
import { registrationsApi } from '../services/api';
import { EventPassData, Registration } from '../types';
import { formatTime } from '../utils/format';

// Same logo the Navbar uses
const SVCET_LOGO =
  'https://media.collegedekho.com/media/img/institute/logo/20621044_1881964892125805_23869069699565005_n.png';

interface EventPassModalProps {
  // Live registration from the parent list, so attendance status updates while the pass is open
  registration: Registration;
  onClose: () => void;
}

export const EventPassModal: React.FC<EventPassModalProps> = ({ registration, onClose }) => {
  const [pass, setPass] = useState<EventPassData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [reloadKey, setReloadKey] = useState<number>(0);

  const registrationDbId = registration.id || registration._id!;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    registrationsApi
      .getPass(registrationDbId)
      .then((data) => {
        if (!cancelled) setPass(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err?.response?.data?.message ||
            (err?.response ? 'Unable to load your Event Pass.' : 'Network error. Please check your connection and try again.')
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [registrationDbId, reloadKey]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Prefer the parent's live status (kept fresh by polling) over the snapshot loaded with the pass
  const attendanceStatus = registration.attendanceStatus || pass?.attendanceStatus || 'NOT_CHECKED_IN';
  const checkedInAt = registration.checkedInAt || pass?.checkedInAt;
  const isCheckedIn = attendanceStatus === 'CHECKED_IN';

  return (
    <div
      id="event-pass-overlay"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Event Pass"
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-sm max-h-[95vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800"
      >
        {/* Brand header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 bg-[#67152a] text-white">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-white flex items-center justify-center shrink-0 ring-1 ring-amber-200/60">
              <img
                src={SVCET_LOGO}
                alt="Sri Venkateswara College of Engineering and Technology logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm leading-tight tracking-tight text-amber-200 truncate">SVCET EVENT HUB</p>
              <p className="text-[11px] text-white/70 font-medium">Digital Event Pass</p>
            </div>
          </div>
          <button
            id="event-pass-close-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close Event Pass"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center gap-3 text-slate-400 text-sm">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span>Loading your Event Pass...</span>
          </div>
        ) : error || !pass ? (
          <div className="px-6 py-14 flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{error || 'Event Pass unavailable'}</p>
            <button
              onClick={() => setReloadKey((k) => k + 1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try again
            </button>
          </div>
        ) : (
          <>
            {/* Event poster + title */}
            <div className="relative h-32 bg-slate-900 overflow-hidden">
              {pass.event.posterUrl && (
                <img
                  src={pass.event.posterUrl}
                  alt={pass.event.title}
                  className="w-full h-full object-cover opacity-80"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <h2 className="absolute bottom-3 left-5 right-5 text-xl font-extrabold text-white leading-tight line-clamp-2">
                {pass.event.title}
              </h2>
            </div>

            <div className="p-5 space-y-5">
              {/* Student */}
              <div>
                <p className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{pass.student.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {pass.student.branch || pass.student.department}
                  {pass.student.year ? ` • ${pass.student.year}` : ''}
                  {pass.student.section ? ` • Section ${pass.student.section}` : ''}
                </p>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 mt-3 text-xs">
                  <div>
                    <dt className="text-slate-400">Student ID</dt>
                    <dd className="font-mono font-semibold text-slate-800 dark:text-slate-200 break-all">{pass.student.studentId}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Registration ID</dt>
                    <dd className="font-mono font-semibold text-indigo-600 dark:text-indigo-400 break-all">{pass.registrationId}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-slate-400">Department</dt>
                    <dd className="font-semibold text-slate-800 dark:text-slate-200">{pass.student.department}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Branch</dt>
                    <dd className="font-semibold text-slate-800 dark:text-slate-200">{pass.student.branch}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Year</dt>
                    <dd className="font-semibold text-slate-800 dark:text-slate-200">{pass.student.year || '—'}</dd>
                  </div>
                </dl>
              </div>

              {/* Schedule */}
              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 py-3 border-y border-dashed border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-semibold">{pass.event.date}</span>
                  <span>•</span>
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{pass.event.time}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>{pass.event.venue}</span>
                </div>
              </div>

              {/* QR code (always on a white tile so it scans in dark mode too) */}
              <div className="flex flex-col items-center gap-2">
                <div
                  id="event-pass-qr"
                  className={`p-3 bg-white rounded-2xl border border-slate-200 ${isCheckedIn ? 'opacity-60' : ''}`}
                >
                  <QRCodeSVG value={pass.qrToken} size={208} level="M" bgColor="#ffffff" fgColor="#0f172a" />
                </div>
                <p className="text-[11px] text-slate-400 text-center">Show this QR code to the staff at the event entrance</p>
              </div>

              {/* Attendance status */}
              <div
                id="event-pass-attendance"
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border ${
                  isCheckedIn
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                }`}
              >
                {isCheckedIn ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Circle className="w-4 h-4" />}
                <span>
                  Attendance: {isCheckedIn ? 'CHECKED IN' : 'NOT CHECKED IN'}
                  {isCheckedIn && checkedInAt ? ` • ${formatTime(checkedInAt)}` : ''}
                </span>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};
