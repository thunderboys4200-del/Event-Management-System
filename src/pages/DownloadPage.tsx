import React, { useState } from 'react';
import { Download, FileArchive, CheckCircle2, Terminal, Copy, Check, ExternalLink, ShieldCheck, Database, FolderCode, Sparkles } from 'lucide-react';
import { useToast } from '../components/Toast';

export const DownloadPage: React.FC = () => {
  const { showToast } = useToast();
  const [downloading, setDownloading] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    showToast('Starting download for college-event-portal.zip...', 'info');

    try {
      const response = await fetch('/api/download-zip');
      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'college-event-portal.zip';
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setDownloading(false);
        showToast('Download complete! Extract the zip and run npm install.', 'success');
      }, 500);
    } catch (err) {
      console.error(err);
      setDownloading(false);
      // Fallback: direct browser link
      window.open('/api/download-zip', '_blank');
      showToast('Opening download link...', 'info');
    }
  };

  const copyBashCommand = () => {
    navigator.clipboard.writeText('unzip college-event-portal.zip -d college-event-portal && cd college-event-portal && npm install && npm run dev');
    setCopiedCmd(true);
    showToast('Terminal commands copied to clipboard!', 'success');
    setTimeout(() => setCopiedCmd(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl border border-indigo-700/50 mb-10 relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            Complete Project Package
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">
            Download SVCET EVENT HUG
          </h1>
          <p className="text-indigo-200 text-base sm:text-lg leading-relaxed mb-6">
            Get the full production-ready application bundle including React frontend, Express.js backend, authentication engine, seed databases, and styling assets.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <button
              id="main-download-button"
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center gap-3 px-7 py-3.5 bg-white text-indigo-950 font-bold rounded-xl shadow-lg hover:bg-indigo-50 active:scale-98 transition-all text-base cursor-pointer disabled:opacity-75"
            >
              <Download className={`w-5 h-5 text-indigo-600 ${downloading ? 'animate-bounce' : ''}`} />
              {downloading ? 'Preparing Archive...' : 'Download Project (.ZIP)'}
            </button>

            <a
              id="direct-archive-link"
              href="/api/download-zip"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3.5 bg-indigo-950/60 hover:bg-indigo-950 text-indigo-200 border border-indigo-400/30 font-medium rounded-xl transition-colors text-sm"
            >
              <span>Direct Link</span>
              <ExternalLink className="w-4 h-4 text-indigo-300" />
            </a>
          </div>
        </div>
      </div>

      {/* Package Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-3">
            <FileArchive className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">Archive Details</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">college-event-portal.zip</p>
          <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span>Size:</span>
              <span className="font-semibold">~110 KB (compressed)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span>Files:</span>
              <span className="font-semibold">46 source files</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Format:</span>
              <span className="font-semibold">Standard ZIP</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">Role-Based Access</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Dedicated student & staff portals</p>
          <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="font-bold text-slate-900 dark:text-white">Student:</span> Dedicated Student Sign-In
            </div>
            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="font-bold text-slate-900 dark:text-white">Staff:</span> Protected Staff Console
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-3">
            <Database className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">Self-Contained DB</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Zero external configuration needed</p>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Runs out-of-the-box using the embedded JSON store, with automatic migration support for MongoDB Atlas when <code className="text-purple-600 dark:text-purple-400 font-mono">MONGODB_URI</code> is specified.
          </p>
        </div>
      </div>

      {/* Quick Setup Instructions */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs mb-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Quick Start (Local Machine)</h2>
          </div>
          <button
            onClick={copyBashCommand}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCmd ? 'Copied!' : 'Copy Commands'}</span>
          </button>
        </div>

        <div className="p-4 bg-slate-950 text-slate-200 rounded-xl font-mono text-xs sm:text-sm overflow-x-auto space-y-2 mb-6">
          <div className="text-slate-500"># 1. Unzip the downloaded file</div>
          <div className="text-emerald-400">unzip college-event-portal.zip -d college-event-portal</div>
          <div className="text-emerald-400">cd college-event-portal</div>
          <div className="text-slate-500 mt-2"># 2. Install all dependencies</div>
          <div className="text-emerald-400">npm install</div>
          <div className="text-slate-500 mt-2"># 3. Start development server</div>
          <div className="text-emerald-400">npm run dev</div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 dark:text-white">Port 3000:</strong> The Express API server & Vite development server run simultaneously on <span className="font-mono">http://localhost:3000</span>.
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 dark:text-white">Persistent State:</strong> Registrations and newly created events are automatically saved in the local <span className="font-mono">data/</span> directory.
            </div>
          </div>
        </div>
      </div>

      {/* Directory Structure Breakdown */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <FolderCode className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Project File Tree</h2>
        </div>

        <pre className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs font-mono text-slate-700 dark:text-slate-300 overflow-x-auto leading-relaxed border border-slate-200 dark:border-slate-800">
{`college-event-portal/
├── README.md               # Quick-start setup & documentation
├── package.json            # Scripts & project dependencies
├── server.ts               # Express.js backend & Vite middleware
├── server/
│   ├── config.ts           # Self-generating 512-bit JWT & env config
│   ├── db.ts               # Local persistence & MongoDB Atlas adapter
│   ├── middleware/auth.ts  # JWT & role verification (Student/Staff)
│   └── routes/             # Auth, Events, Registrations, Stats endpoints
├── src/
│   ├── App.tsx             # Route declarations
│   ├── components/         # Navbar, Footer, EventCard, RosterModal
│   ├── context/            # AuthContext with token handling
│   ├── pages/              # Student/Staff dashboards, gallery, forms
│   └── types/              # TypeScript interfaces
└── public/                 # Static assets & zip archive`}
        </pre>
      </div>
    </div>
  );
};
