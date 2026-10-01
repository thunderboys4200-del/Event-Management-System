import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Image as ImageIcon,
  Building2,
  ZoomIn,
  X,
  ChevronDown,
  Video
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { eventsApi } from '../services/api';
import { EventItem } from '../types';
import { EmptyState } from '../components/EmptyState';

export const PhotoGalleryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    const fetchEventGallery = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await eventsApi.getEventById(id);
        setEvent(data);
      } catch (err) {
        console.error('Error fetching event photos:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEventGallery();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white py-12 px-4 max-w-3xl mx-auto space-y-8 animate-pulse">
        <div className="h-6 w-36 bg-slate-900 rounded" />
        <div className="h-10 w-3/4 bg-slate-900 rounded" />
        <div className="aspect-[16/10] w-full bg-slate-900 rounded-3xl" />
        <div className="aspect-[16/10] w-full bg-slate-900 rounded-3xl" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <p className="text-base text-slate-500 mb-4">Event not found.</p>
        <Link
          to="/events/past"
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors"
        >
          Return to Past Events
        </Link>
      </div>
    );
  }

  const photos = event.photoUrls && event.photoUrls.length > 0 ? event.photoUrls : [];
  const videos = event.videoUrls && event.videoUrls.length > 0 ? event.videoUrls : [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      {/* Lightbox Modal for enlarged preview */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPhoto(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          >
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-5 right-5 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Close Lightbox"
            >
              <X className="w-6 h-6" />
            </button>
            <motion.img
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              src={selectedPhoto}
              alt="Enlarged gallery capture"
              onClick={(e) => e.stopPropagation()}
              className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl border border-white/10"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-3xl mx-auto space-y-10">
        {/* Navigation & Header */}
        <div className="space-y-4">
          <Link
            id="gallery-back-link"
            to="/events/past"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-indigo-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Past Events</span>
          </Link>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              <ImageIcon className="w-4 h-4" />
              <span>Event Photo Memories • {photos.length} Captured Moments</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              {event.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-400" />
                {event.date}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-400" />
                {event.venue}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-slate-400" />
                {event.department}
              </span>
            </div>
          </div>
        </div>

        {/* Vertical Up/Down Scrolling Gallery Layout (Strictly vertical scrolling format) */}
        {photos.length > 0 || videos.length > 0 ? (
          <div className="space-y-8">
            <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800/80">
              <span className="font-medium">Scroll down to explore captured moments</span>
              <ChevronDown className="w-4 h-4 text-indigo-400 animate-bounce" />
            </div>

            {/* Vertical Stack: One image below another */}
            <div
              id="vertical-photo-gallery"
              className="flex flex-col gap-10 scroll-smooth"
            >
              {photos.map((photoUrl, index) => (
                <motion.div
                  key={index}
                  id={`gallery-photo-container-${index + 1}`}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.4 }}
                  className="group relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800/80 shadow-2xl transition-all duration-300 hover:border-indigo-500/50"
                >
                  {/* Photo numbering pill */}
                  <div className="absolute top-4 left-4 z-10 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-xs font-bold border border-white/10">
                    Photo {index + 1} of {photos.length}
                  </div>

                  {/* Zoom indicator button */}
                  <button
                    onClick={() => setSelectedPhoto(photoUrl)}
                    className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-black/70 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/90 cursor-pointer"
                    title="Click to view full image"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>

                  {/* Large Image with smooth lazy loading */}
                  <div
                    onClick={() => setSelectedPhoto(photoUrl)}
                    className="cursor-pointer overflow-hidden aspect-[16/10] sm:aspect-[16/10] w-full"
                  >
                    <img
                      src={photoUrl}
                      alt={`${event.title} - Moment ${index + 1}`}
                      loading="lazy"
                      className="w-full h-full object-cover object-center group-hover:scale-[1.02] transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80';
                      }}
                    />
                  </div>

                  {/* Caption & Metadata Footer */}
                  <div className="p-4 sm:p-5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span className="font-medium text-slate-300">
                      {event.title} • Official Campus Photography Capture #{index + 1}
                    </span>
                    <span className="text-[11px] text-indigo-400 uppercase tracking-wider font-semibold">
                      {event.category}
                    </span>
                  </div>
                </motion.div>
              ))}
              {videos.map((videoUrl, index) => (
                <motion.div key={videoUrl} initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.4 }} className="rounded-3xl overflow-hidden bg-slate-900 border border-slate-800/80 shadow-2xl">
                  <div className="flex items-center gap-2 px-4 py-3 text-xs font-bold text-indigo-300 bg-slate-900 border-b border-slate-800"><Video className="w-4 h-4" /> Event Video {index + 1} of {videos.length}</div>
                  <video src={videoUrl} controls preload="metadata" className="w-full aspect-video bg-black" />
                </motion.div>
              ))}
            </div>

            {/* End of Gallery marker */}
            <div className="pt-8 text-center border-t border-slate-800/80 space-y-3">
              <p className="text-xs text-slate-500">
                You have reached the end of the memories gallery for {event.title}.
              </p>
              <Link
                to="/events/past"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Explore Other Past Events</span>
              </Link>
            </div>
          </div>
        ) : (
          <EmptyState
            type="photos"
            actionHref="/events/past"
            actionText="Back to Past Events"
          />
        )}
      </div>
    </div>
  );
};
