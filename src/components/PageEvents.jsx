// src/components/PageEvents.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGift, faSpinner, faExclamationTriangle, faCalendarDays, faShieldHalved } from '@fortawesome/free-solid-svg-icons';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../supabaseClient';

const ADMIN_USER_ID = '9a405075-260e-407b-a7fe-2f05b9bb5766';

// Komponen Event Card yang sekarang menjadi tautan
const EventCard = ({ event }) => {
  return (
    <Link to={`/events/${event.slug}`} className="card-premium block hover:border-primary transition-all duration-300 group">
      <div className="relative mb-4 -mx-6 -mt-6">
        <img src={event.banner_image_url || 'https://placehold.co/800x400/101020/7f5af0?text=AFA+Event'} alt={event.title} className="w-full h-48 object-cover rounded-t-2xl" />
        <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent"></div>
      </div>
      
      <div className="flex items-center gap-4 mb-2">
        <FontAwesomeIcon icon={faGift} className="text-3xl text-primary" />
        <div>
          <h2 className="text-xl font-bold text-light-text dark:text-white group-hover:text-primary">{event.title}</h2>
          <p className="text-sm font-semibold text-green-400">{event.reward_pool}</p>
        </div>
      </div>

      {event.end_date && (
        <p className="text-xs text-yellow-400 font-medium flex items-center gap-2 mt-3">
            <FontAwesomeIcon icon={faCalendarDays} />
            <span>Berakhir pada: {new Date(event.end_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
        </p>
      )}
    </Link>
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
    if (currentUser) {
        fetchEventsData();
    } else {
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
          {/* [MODIFIKASI] Tautan ini sekarang mengarah ke /login */}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map(event => (
                <EventCard key={event.id} event={event} />
            ))}
        </div>
      ) : (
        <div className="text-center py-16 card-premium">
            <FontAwesomeIcon icon={faGift} size="3x" className="mb-4 text-primary"/>
            <h3 className="text-xl font-semibold">Belum Ada Event Aktif</h3>
            <p className="text-light-subtle dark:text-gray-400 mt-2">Nantikan giveaway selanjutnya. Pantau terus!</p>
        </div>
      )}
    </section>
  );
}
