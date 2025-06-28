import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faGift, 
    faSpinner, 
    faExclamationTriangle, 
    faCalendarDays, 
    faShieldHalved, 
    faArrowRight, 
    faCrown, 
    faTicketAlt 
} from '@fortawesome/free-solid-svg-icons';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../supabaseClient';

// ID Admin, pastikan ini sesuai dengan ID admin Anda di Supabase
const ADMIN_USER_ID = 'e866df86-3206-4019-890f-01a61b989f15';

/**
 * Komponen untuk lencana level event (Premium/Basic).
 * Didesain agar menonjol dan informatif.
 */
const EventLevelBadge = ({ level }) => {
  if (level === 'premium') {
    return (
      <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 text-xs font-bold bg-amber-400 text-black px-3 py-1 rounded-full shadow-lg border-2 border-amber-300">
        <FontAwesomeIcon icon={faCrown} />
        <span>Premium</span>
      </div>
    );
  }

  if (level === 'basic') {
      return (
        <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 text-xs font-bold bg-sky-100 text-sky-800 dark:bg-sky-900/70 dark:text-sky-200 px-3 py-1 rounded-full shadow-md">
          <FontAwesomeIcon icon={faTicketAlt} />
          <span>Basic</span>
        </div>
      );
  }
  
  return null; 
};


/**
 * Desain ulang total EventCard agar lebih premium dan menarik.
 */
const EventCard = ({ event }) => {
  // Cek apakah tanggal akhir event sudah lewat atau belum. Jika tidak ada tanggal, anggap aktif.
  const isEventActive = event.end_date ? new Date(event.end_date) > new Date() : true;

  return (
    // Menggunakan class .card-premium dari style.css jika ada, atau styling inline
    <div className="card group h-full flex flex-col transform transition-all duration-300 hover:-translate-y-1.5 hover:shadow-primary/20">
      <Link to={`/events/${event.slug}`} className="block h-full flex flex-col">
        {/* Wrapper Gambar dengan efek */}
        <div className="relative overflow-hidden rounded-t-xl">
          <img 
            src={event.banner_image_url || 'https://placehold.co/800x400/101020/7f5af0?text=AFA+Event'} 
            alt={event.title} 
            className="h-48 w-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
          
          <EventLevelBadge level={event.required_level} />

          {/* Status Live/Ended di dalam gambar */}
          <div className="absolute bottom-3 left-3">
            {isEventActive ? (
              <span className="event-status-badge live">
                <span className="event-status-indicator"></span>
                LIVE
              </span>
            ) : (
              <span className="event-status-badge ended">
                ENDED
              </span>
            )}
          </div>
        </div>

        {/* Konten Kartu */}
        <div className="p-5 flex-grow flex flex-col">
          <h2 className="event-card-title flex-grow">{event.title}</h2>
          <p className="event-card-reward">{event.reward_pool}</p>

          <div className="mt-4 pt-4 border-t border-black/10 dark:border-white/10 flex justify-between items-center">
            {event.end_date ? (
              <p className="text-xs text-light-subtle dark:text-gray-400 font-medium flex items-center gap-2">
                <FontAwesomeIcon icon={faCalendarDays} />
                <span>Berakhir: {new Date(event.end_date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}</span>
              </p>
            ) : <div />}
            
            <div className="event-card-footer">
              <span>Lihat Detail</span>
              <FontAwesomeIcon icon={faArrowRight} className="transition-transform duration-300 group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};


export default function PageEvents({ currentUser }) {
  const { t } = useLanguage();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isAdmin = currentUser?.id === ADMIN_USER_ID;

  const fetchEventsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
        const { data, error: fetchError } = await supabase
            .from('events')
            .select(`*`) // Ambil semua kolom, termasuk required_level
            .eq('is_active', true)
            .order('created_at', { ascending: false });
        if (fetchError) throw fetchError;
        setEvents(data || []);
    } catch (err) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchEventsData();
  }, [fetchEventsData]);

  if (loading) return <div className="page-content text-center py-20"><FontAwesomeIcon icon={faSpinner} spin size="3x" className="text-primary"/></div>;
  if (error) return <div className="page-content text-center py-20 text-red-400"><FontAwesomeIcon icon={faExclamationTriangle} size="3x" className="mb-4"/><p>{error}</p></div>;
  
  // Guard untuk user yang belum login
  if (!currentUser?.id) {
    return (
      <div className="page-content flex items-center justify-center h-full">
        <div className="card max-w-md mx-auto p-8 text-center">
          <h2 className="text-2xl font-bold text-light-text dark:text-white mb-3">{t('eventsPage.loginPromptTitle') || 'Akses Dibatasi'}</h2>
          <p className="text-light-subtle dark:text-gray-400 mb-6">{t('eventsPage.loginPrompt') || 'Silakan login untuk melihat dan mengikuti event.'}</p>
          <Link to="/login" className="btn-primary px-6 py-2">
            {t('header.login') || 'Login'}
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <section className="page-content space-y-10 py-8">
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold futuristic-text-gradient mb-3">{t('eventsPage.title') || 'Special Events & Giveaways'}</h1>
        <p className="text-lg text-light-subtle dark:text-gray-400 max-w-2xl mx-auto">{t('eventsPage.subtitle') || 'Ikuti event eksklusif untuk anggota komunitas AFA dan menangkan hadiah menarik!'}</p>
      </div>
      
      {/* --- TOMBOL ADMIN PANEL YANG LEBIH MENONJOL --- */}
      {isAdmin && (
        <div className="max-w-xl mx-auto">
          <Link to="/admin/events" className="bg-primary/10 dark:bg-primary/20 border-2 border-primary/20 hover:border-primary/50 flex items-center gap-4 px-6 py-4 rounded-xl shadow-lg transition-all duration-300 w-full group">
            <FontAwesomeIcon icon={faShieldHalved} className="text-3xl text-primary transition-transform group-hover:scale-110" />
            <div className="text-left">
              <p className="font-bold text-lg text-light-text dark:text-white">Admin Panel Events</p>
              <p className="text-sm text-light-subtle dark:text-gray-400">Buat, edit, dan kelola semua giveaway.</p>
            </div>
            <FontAwesomeIcon icon={faArrowRight} className="ml-auto text-primary text-xl transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      )}

      {events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {events.map(event => (
                <EventCard key={event.id} event={event} />
            ))}
        </div>
      ) : (
        <div className="text-center py-16 card">
            <FontAwesomeIcon icon={faGift} size="3x" className="mb-4 text-primary"/>
            <h3 className="text-xl font-semibold">Belum Ada Event Aktif</h3>
            <p className="text-light-subtle dark:text-gray-400 mt-2">Nantikan giveaway selanjutnya. Pantau terus!</p>
        </div>
      )}
    </section>
  );
}
