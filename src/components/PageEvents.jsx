// src/components/PageEvents.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGift, faSpinner, faExclamationTriangle, faCalendarDays, faShieldHalved, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../supabaseClient';

const ADMIN_USER_ID = '9a405075-260e-407b-a7fe-2f05b9bb5766';

// =================================================================
// [REDESIGNED] EventCard Component
// =================================================================
const EventCard = ({ event }) => {
  const isEventActive = new Date(event.end_date) > new Date();

  return (
    <div className="event-card-container">
      <Link to={`/events/${event.slug}`} className="event-card group">
        
        {/* Background Image & Overlay */}
        <div className="event-card-image-wrapper">
          <img 
            src={event.banner_image_url || 'https://placehold.co/800x400/101020/7f5af0?text=AFA+Event'} 
            alt={event.title} 
            className="event-card-image" 
          />
          <div className="event-card-overlay"></div>
        </div>

        {/* Card Content */}
        <div className="event-card-content">
          <div className="event-card-header">
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
            {event.end_date && (
                <p className="text-xs text-light-subtle dark:text-gray-400 font-medium flex items-center gap-2">
                    <FontAwesomeIcon icon={faCalendarDays} />
                    <span>Ends: {new Date(event.end_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</span>
                </p>
            )}
          </div>

          <div className="event-card-body">
             <div className="flex items-start gap-4">
                <div className="mt-1 flex-shrink-0">
                  <FontAwesomeIcon icon={faGift} className="text-3xl text-primary" />
                </div>
                <div>
                   <h2 className="event-card-title">{event.title}</h2>
                   <p className="event-card-reward">{event.reward_pool}</p>
                </div>
             </div>
          </div>
          
          <div className="event-card-footer">
            <span>View Details</span>
            <FontAwesomeIcon icon={faArrowRight} className="transition-transform duration-300 group-hover:translate-x-1" />
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
            .select(`*`)
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
    // [MODIFIKASI] Cek currentUser sebelum fetch
    if (currentUser) {
        fetchEventsData();
    } else {
        // Jika tidak ada user (misal: halaman dimuat langsung tanpa state),
        // jangan tampilkan loading selamanya.
        setLoading(false);
    }
  }, [currentUser, fetchEventsData]);

  if (loading) return <div className="page-content text-center py-20"><FontAwesomeIcon icon={faSpinner} spin size="3x" className="text-primary"/></div>;
  if (error) return <div className="page-content text-center py-20 text-red-400"><FontAwesomeIcon icon={faExclamationTriangle} size="3x" className="mb-4"/><p>{error}</p></div>;
  
  if (!currentUser?.id) {
    return (
      <div className="page-content text-center py-10">
        <div className="card max-w-md mx-auto p-8">
          <h2 className="text-2xl font-bold text-light-text dark:text-white mb-3">{t('eventsPage.loginPromptTitle')}</h2>
          <p className="text-light-subtle dark:text-gray-400 mb-6">{t('eventsPage.loginPrompt')}</p>
          <Link to="/login" className="btn-primary px-6 py-2">
            {t('header.login')}
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <section className="page-content space-y-8 py-8">
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold futuristic-text-gradient mb-3">{t('eventsPage.title')}</h1>
        <p className="text-lg text-light-subtle dark:text-gray-400 max-w-2xl mx-auto">{t('eventsPage.subtitle')}</p>
      </div>
      
      {isAdmin && (
        <div className="max-w-3xl mx-auto text-center">
          <Link to="/admin/events" className="btn-secondary inline-flex items-center gap-4 px-6 py-3 rounded-xl shadow-lg transition-all hover:shadow-primary/20 hover:border-primary/50">
            <FontAwesomeIcon icon={faShieldHalved} className="text-2xl text-primary" />
            <div className="text-left">
              <p className="font-bold text-md text-light-text dark:text-white">Kelola Events</p>
              <p className="text-xs text-light-subtle dark:text-gray-400">Buat, edit, dan kelola giveaway.</p>
            </div>
          </Link>
        </div>
      )}

      {events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
