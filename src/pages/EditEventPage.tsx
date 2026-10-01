import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
  Save,
  AlertCircle
} from 'lucide-react';
import { eventsApi } from '../services/api';
import { useToast } from '../components/Toast';

export const EditEventPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('');
  const [category, setCategory] = useState('Technical');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [venue, setVenue] = useState('');
  const [registrationDeadline, setRegistrationDeadline] = useState('');

  // Existing poster & new poster upload
  const [existingPoster, setExistingPoster] = useState('');
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string>('');

  // Existing photos & new photos upload
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const [newPhotosFiles, setNewPhotosFiles] = useState<File[]>([]);
  const [newPhotosPreviews, setNewPhotosPreviews] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const categories = ['Technical', 'Cultural','Placement','Tech_Teach','Sports', 'Seminar', 'Workshop', 'Arts'];
  const departments = [
    'Computer Science & Engineering',
    'Mechanical & Robotics Engineering',
    'Electrical & Electronics Engineering',
    'Artificial Intelligence & Data Science',
    'Fine Arts & Student Council',
    'Placement & Trainning',
    'Physical Education & Athletics',
    'Humanities & Social Sciences',
    'Business Administration & Management'
  ];

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const ev = await eventsApi.getEventById(id);
        setTitle(ev.title || '');
        setDescription(ev.description || '');
        setDepartment(ev.department || '');
        setCategory(ev.category || 'Technical');
        setDate(ev.date || '');
        setTime(ev.time || '');
        setVenue(ev.venue || '');
        setRegistrationDeadline(ev.registrationDeadline || '');
        setExistingPoster(ev.posterUrl || '');
        setExistingPhotos(ev.photoUrls || []);
      } catch (err) {
        console.error('Error fetching event to edit:', err);
        showToast('Failed to load event data', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  const handlePosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        showToast('Please upload a valid image file.', 'error');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        showToast('File size cannot exceed 10MB.', 'error');
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
        if (!file.type.startsWith('image/')) continue;
        if (file.size > 10 * 1024 * 1024) continue;
        validFiles.push(file);
        newPreviews.push(URL.createObjectURL(file));
      }

      setNewPhotosFiles((prev) => [...prev, ...validFiles]);
      setNewPhotosPreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeExistingPhoto = (index: number) => {
    setExistingPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewPhoto = (index: number) => {
    setNewPhotosFiles((prev) => prev.filter((_, i) => i !== index));
    setNewPhotosPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!title.trim() || !description.trim() || !department || !date || !time.trim() || !venue.trim() || !registrationDeadline) {
      setValidationError('All required fields must be filled.');
      return;
    }

    if (registrationDeadline > date) {
      setValidationError('Registration deadline cannot be after the event date.');
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

      // Keep remaining existing photos
      formData.append('existingPhotos', JSON.stringify(existingPhotos));

      // Append new poster if selected
      if (posterFile) {
        formData.append('poster', posterFile);
      }

      // Append new photos
      newPhotosFiles.forEach((f) => {
        formData.append('photos', f);
      });

      await eventsApi.updateEvent(id!, formData);
      showToast('Event updated successfully!', 'success');
      navigate('/staff/dashboard');
    } catch (err: any) {
      console.error('Update event error:', err);
      const msg = err.response?.data?.message || 'Failed to update event';
      setValidationError(msg);
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-12 px-4 max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="h-12 w-full bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        <div className="h-32 w-full bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <Link
            to="/staff/dashboard"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Staff Dashboard</span>
          </Link>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
          <div>
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
              Staff Portal • Modification
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              Edit Event: {title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Update event details, replace poster image, or manage event photo memories.
            </p>
          </div>

          {validationError && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 flex items-start gap-3 text-rose-800 dark:text-rose-200 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="edit-event-title" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Event Title *
              </label>
              <input
                id="edit-event-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit-event-dept" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Department *
                </label>
                <select
                  id="edit-event-dept"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  {departments.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="edit-event-category" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Category *
                </label>
                <select
                  id="edit-event-category"
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="edit-event-date" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Event Date *
                </label>
                <input
                  id="edit-event-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="edit-event-time" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Time *
                </label>
                <input
                  id="edit-event-time"
                  type="text"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="edit-event-deadline" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Registration Deadline *
                </label>
                <input
                  id="edit-event-deadline"
                  type="date"
                  value={registrationDeadline}
                  onChange={(e) => setRegistrationDeadline(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="edit-event-venue" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Venue Location *
              </label>
              <input
                id="edit-event-venue"
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label htmlFor="edit-event-desc" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Description *
              </label>
              <textarea
                id="edit-event-desc"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            {/* Poster Management */}
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Event Poster
              </label>

              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="relative aspect-[16/9] w-48 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900">
                  <img
                    src={posterPreview || existingPoster}
                    alt="Poster preview"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="edit-poster-upload"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Replace Poster Image</span>
                    <input
                      id="edit-poster-upload"
                      type="file"
                      accept="image/*"
                      onChange={handlePosterChange}
                      className="hidden"
                    />
                  </label>
                  {posterFile && (
                    <p className="text-xs text-indigo-600 font-medium">
                      New poster selected: {posterFile.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Photos Management */}
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Event Photo Memories ({existingPhotos.length + newPhotosPreviews.length} total)
                </label>
              </div>

              {/* Existing photos grid */}
              {existingPhotos.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-slate-400 block">Existing Saved Photos:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {existingPhotos.map((url, i) => (
                      <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900">
                        <img src={url} alt={`Saved Photo ${i}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeExistingPhoto(i)}
                          className="absolute top-1.5 right-1.5 p-1 rounded-full bg-rose-600 text-white hover:bg-rose-700 text-xs"
                          title="Remove Photo"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Newly added photos preview */}
              {newPhotosPreviews.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-indigo-500 block">New Photos To Be Uploaded:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {newPhotosPreviews.map((url, i) => (
                      <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-indigo-500/50 bg-slate-900">
                        <img src={url} alt={`New Photo ${i}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeNewPhoto(i)}
                          className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/70 text-white hover:bg-black text-xs"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <label
                htmlFor="edit-photos-upload"
                className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl hover:border-indigo-500 cursor-pointer bg-slate-50 dark:bg-slate-800/40 transition-colors"
              >
                <ImageIcon className="w-6 h-6 text-indigo-500 mb-1" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Upload More Photo Memories
                </span>
                <input
                  id="edit-photos-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotosChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Actions */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
              <Link
                to="/staff/dashboard"
                className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                id="submit-edit-event-btn"
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
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
