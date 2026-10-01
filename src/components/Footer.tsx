import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Calendar, ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer id="main-footer" className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-sm transition-colors mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Col 1: Brand & Purpose */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-white flex items-center justify-center ring-1 ring-indigo-100 dark:ring-indigo-900">
                <img
                  src="https://media.collegedekho.com/media/img/institute/logo/20621044_1881964892125805_23869069699565005_n.png"
                  alt="Sri Venkateswara College of Engineering and Technology logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="font-bold text-slate-900 dark:text-white text-base">
                SVCET EVENT HUG
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              The official event hub of Sri Venkateswara College of Engineering and Technology.
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900 text-indigo-700 dark:text-indigo-400 text-[11px] font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              AN AUTONOMOUS INSTITUTION
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-3">
              Explore Portal
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/events/upcoming" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Upcoming Events
                </Link>
              </li>
              <li>
                <Link to="/events/past" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Past Event Memories & Gallery
                </Link>
              </li>
              <li>
                <Link to="/login?role=student" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Student Portal Access
                </Link>
              </li>
              <li>
                <Link to="/login?role=staff" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Faculty & Staff Console
                </Link>
              </li>
            </ul>

          </div>

          {/* Col 3: Categories */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-3">
              Event Domains
            </h3>
            <ul className="space-y-2 text-xs">
              <li>Technical Hackathons & Robotics</li>
              <li>Annual Cultural Fests & Arts</li>
              <li>Athletics & Sports Tournaments</li>
              <li>Academic Seminars & Colloquia</li>
              <li>Guest Lectures & TEDx Talks</li>
            </ul>
          </div>

          {/* Col 4: Helpdesk */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-3">
              Campus Helpdesk
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                <span>Thirupachur-631203, Tiruvallur TK &amp; DT</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>principal@sriventech.ac.in</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>+91 9176745678</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-3">
          <p>© {new Date().getFullYear()} SVCET EVENT HUG. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs">
            <span>Created by Gokul M 4th Year AI&amp;DS</span>
            <span>•</span>
            <span className="font-medium text-slate-600 dark:text-slate-300">SRI VENKATESWARA COLLEGE OF ENGINEERING AND TECHNOLOGY</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
