import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Building2,
  Tag,
  Upload,
  Image as ImageIcon,
  X,
  Plus,
  AlertCircle,
  CheckCircle2,
  Video
} from 'lucide-react';
import { eventsApi } from '../services/api';
import { useToast } from '../components/Toast';
import { EVENT_DEPARTMENT_GROUPS } from '../constants/eventDepartments';

export const CreateEventPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const isPastEvent = new URLSearchParams(location.search).get('type') === 'past';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('');
  const [category, setCategory] = useState('Technical');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00 AM');
  const [venue, setVenue] = useState('');
  const [registrationDeadline, setRegistrationDeadline] = useState('');

  // Poster state
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string>('');

  // Photos state
  const [photosFiles, setPhotosFiles] = useState<File[]>([]);
  const [photosPreviews, setPhotosPreviews] = useState<string[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const categories = ['Technical', 'Cultural', 'Placement','Tech_Teach','Sports', 'Seminar', 'Workshop', 'Arts'];
  const handlePosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // File validation: type and size (10MB)
      if (!file.type.startsWith('image/')) {
        showToast('Please upload a valid image file (JPEG, PNG, WEBP).', 'error');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        showToast('Poster file size cannot exceed 10MB.', 'error');
        return;
      }
      setPosterFile(file);
      setPosterPreview(URL.createObjectURL(file));
    }
  };

  const handlePhotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files) as File[];
      const validFiles: File[] = [];
      const newPreviews: string[] = [];

      for (const file of selected) {
        if (!file.type.startsWith('image/')) {
          showToast(`Skipped ${file.name}: Not an image.`, 'error');
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          showToast(`Skipped ${file.name}: Exceeds 10MB limit.`, 'error');
          continue;
        }
        validFiles.push(file);
        newPreviews.push(URL.createObjectURL(file));
      }

      setPhotosFiles((prev) => [...prev, ...validFiles]);
      setPhotosPreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotosFiles((prev) => prev.filter((_, i) => i !== index));
    setPhotosPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVideosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const valid = (Array.from(e.target.files) as File[]).filter((file) => {
      if (!file.type.startsWith('video/')) {
        showToast(`Skipped ${file.name}: Not a video.`, 'error');
        return false;
      }
      if (file.size > 100 * 1024 * 1024) {
        showToast(`Skipped ${file.name}: Exceeds 100MB limit.`, 'error');
        return false;
      }
      return true;
    });
    setVideoFiles((prev) => [...prev, ...valid]);
    setVideoPreviews((prev) => [...prev, ...valid.map((file) => URL.createObjectURL(file))]);
  };

  const removeVideo = (index: number) => {
    setVideoFiles((prev) => prev.filter((_, i) => i !== index));
    setVideoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validation
    if (!title.trim()) {
      setValidationError('Event Title is required.');
      return;
    }
    if (!description.trim()) {
      setValidationError('Description is required.');
      return;
    }
    if (!department) {
      setValidationError('Department must be selected.');
      return;
    }
    if (!date) {
      setValidationError('Event Date is required.');
      return;
    }
    if (!time.trim()) {
      setValidationError('Event Time is required.');
      return;
    }
    if (!venue.trim()) {
      setValidationError('Venue is required.');
      return;
    }
    if (!registrationDeadline) {
      setValidationError('Registration Deadline is required.');
      return;
    }

    if (registrationDeadline > date) {
      setValidationError('Registration deadline cannot be after the event date.');
      return;
    }
    if (isPastEvent && date >= new Date().toISOString().split('T')[0]) {
      setValidationError('A past event must have a date before today.');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('department', department);
      formData.append('category', category);
      formData.append('date', date);
      formData.append('time', time.trim());
      formData.append('venue', venue.trim());
      formData.append('registrationDeadline', registrationDeadline);

      if (posterFile) {
        formData.append('poster', posterFile);
      }

      photosFiles.forEach((f) => {
        formData.append('photos', f);
      });
      videoFiles.forEach((f) => formData.append('videos', f));

      const created = await eventsApi.createEvent(formData);
      showToast(`Event "${created.title}" created successfully!`, 'success');
      navigate('/staff/dashboard');
    } catch (err: any) {
      console.error('Event creation error:', err);
      const msg = err.response?.data?.message || 'Failed to create event. Please verify your fields.';
      setValidationError(msg);
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-canvas min-h-screen bg-slate-50/80 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link
            to="/staff/dashboard"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Staff Dashboard</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
          <div>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Staff Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              {isPastEvent ? 'Create Past Event & Memories' : 'Create College Event'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {isPastEvent ? 'Archive a concluded event with its poster, photos, and videos.' : 'Publish a new collegiate event, upload banners, and specify registration deadlines.'}
            </p>
          </div>

          {validationError && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 flex items-start gap-3 text-rose-800 dark:text-rose-200 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Event Title */}
            <div>
              <label htmlFor="event-title" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Event Title *
              </label>
              <input
                id="event-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. InnovateX: Annual Collegiate Hackathon 2026"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            {/* Department & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="event-department" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Department / CSE Branch *
                </label>
                <select
                  id="event-department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select Host Department or CSE Branch</option>
                  {EVENT_DEPARTMENT_GROUPS.map((group) => (
                    <optgroup key={group.label} label={group.label}>
                      {group.options.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">Choose a CSE branch for CSE-hosted events; the existing department field stores this selection.</p>
              </div>

              <div>
                <label htmlFor="event-category" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Category *
                </label>
                <select
                  id="event-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Schedule Row: Date, Time, Registration Deadline */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="event-date" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Event Date *
                </label>
                <input
                  id="event-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="event-time" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Time *
                </label>
                <input
                  id="event-time"
                  type="text"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="e.g. 10:00 AM"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="event-deadline" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Registration Deadline *
                </label>
                <input
                  id="event-deadline"
                  type="date"
                  value={registrationDeadline}
                  onChange={(e) => setRegistrationDeadline(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>

            {/* Venue */}
            <div>
              <label htmlFor="event-venue" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Venue Location *
              </label>
              <input
                id="event-venue"
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="e.g. University Tech Innovation Hub, Hall 4"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="event-description" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Description *
              </label>
              <textarea
                id="event-description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide detailed information regarding rules, prerequisites, schedule, and judging criteria..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            {/* Main Event Poster Upload (Multer) */}
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Event Poster (Main Front Display)
              </label>

              {posterPreview ? (
                <div className="relative aspect-[16/9] max-w-md rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900">
                  <img src={posterPreview} alt="Poster preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setPosterFile(null);
                      setPosterPreview('');
                    }}
                    className="absolute top-3 right-3 p-1.5 rounded-full bg-black/70 text-white hover:bg-black"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="poster-upload-input"
                  className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl hover:border-indigo-500 cursor-pointer bg-slate-50 dark:bg-slate-800/40 transition-colors"
                >
                  <Upload className="w-8 h-8 text-indigo-500 mb-2" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Click to upload main poster image
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1">PNG, JPG, WEBP up to 10MB</span>
                  <input
                    id="poster-upload-input"
                    type="file"
                    accept="image/*"
                    onChange={handlePosterChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Multiple Event Photos Upload (Multer) */}
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Event Photo Memories (Multiple Gallery Photos)
              </label>

              {photosPreviews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                  {photosPreviews.map((previewUrl, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900">
                      <img src={previewUrl} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/70 text-white hover:bg-black text-xs"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <label
                htmlFor="photos-upload-input"
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl hover:border-indigo-500 cursor-pointer bg-slate-50 dark:bg-slate-800/40 transition-colors"
              >
                <ImageIcon className="w-8 h-8 text-indigo-500 mb-2" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Click to select multiple event photos
                </span>
                <span className="text-[11px] text-slate-400 mt-1">
                  Upload multiple memories for the vertical photo gallery
                </span>
                <input
                  id="photos-upload-input"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotosChange}
                  className="hidden"
                />
              </label>
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Event Video Memories (Optional)</label>
              {videoPreviews.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  {videoPreviews.map((previewUrl, i) => (
                    <div key={previewUrl} className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900">
                      <video src={previewUrl} controls className="w-full aspect-video" />
                      <button type="button" onClick={() => removeVideo(i)} className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/70 text-white hover:bg-black"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                </div>
              )}
              <label htmlFor="videos-upload-input" className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl hover:border-indigo-500 cursor-pointer bg-slate-50 dark:bg-slate-800/40 transition-colors">
                <Video className="w-8 h-8 text-indigo-500 mb-2" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Click to select event videos</span>
                <span className="text-[11px] text-slate-400 mt-1">MP4, WEBM, MOV — up to 100MB each</span>
                <input id="videos-upload-input" type="file" accept="video/mp4,video/webm,video/quicktime" multiple onChange={handleVideosChange} className="hidden" />
              </label>
            </div>

            {/* Submit Buttons */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
              <Link
                to="/staff/dashboard"
                className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                id="submit-create-event-btn"
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Publishing Event...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Publish Event</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
