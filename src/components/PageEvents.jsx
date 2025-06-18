// src/components/PageEvents.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGift, faCheckCircle as fasFaCheckCircle, faSpinner, faExclamationTriangle, faCalendarDays } from '@fortawesome/free-solid-svg-icons';
import { faCheckCircle as farFaCheckCircle } from '@fortawesome/free-regular-svg-icons';
import { faTelegram, faYoutube, faXTwitter, faDiscord } from '@fortawesome/free-brands-svg-icons';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../supabaseClient';
import { useAccount, useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';

const taskIcons = {
  twitter: faXTwitter,
  telegram: faTelegram,
  youtube: faYoutube,
  discord: faDiscord,
};

// Komponen Event Card
const EventCard = ({ event, onParticipate, currentUser }) => {
  const { t } = useLanguage();
  const [completedTasks, setCompletedTasks] = useState(new Set());
  const [isSubmitted, setIsSubmitted] = useState(event.is_participated);
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();

  const handleTaskClick = (taskId, taskLink) => {
    window.open(taskLink, '_blank', 'noopener,noreferrer');
    setCompletedTasks(prev => new Set(prev).add(taskId));
  };

  const handleParticipate = () => {
    if (!isConnected) {
        connect({ connector: injected() });
        return;
    }
    onParticipate(event.id, address);
    setIsSubmitted(true);
  };
  
  const allTasksCompleted = completedTasks.size === event.event_tasks.length;

  return (
    <div className="card max-w-2xl mx-auto p-6 md:p-8 rounded-2xl shadow-xl overflow-hidden">
      <div className="relative mb-6 -mx-8 -mt-8">
        <img src={event.banner_image_url || 'https://placehold.co/800x400/101020/7f5af0?text=AFA+Event'} alt={event.title} className="w-full h-48 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/70 to-transparent"></div>
      </div>
      
      <div className="flex items-center gap-4 mb-4">
        <FontAwesomeIcon icon={faGift} className="text-4xl text-primary" />
        <div>
          <h2 className="text-2xl font-bold text-light-text dark:text-white">{event.title}</h2>
          <p className="text-sm font-semibold text-green-400">{event.reward_pool}</p>
        </div>
      </div>
      
      <p className="text-light-subtle dark:text-gray-400 mb-6">{event.description}</p>
      
      {event.end_date && (
        <p className="text-sm text-yellow-400 font-semibold mb-6 flex items-center gap-2">
            <FontAwesomeIcon icon={faCalendarDays} />
            Berakhir pada: {new Date(event.end_date).toLocaleString('id-ID')}
        </p>
      )}
      
      <h3 className="text-lg font-semibold text-light-text dark:text-white mb-4">{t('eventsPage.tasksTitle')}</h3>
      <div className="space-y-3">
        {event.event_tasks.map(task => {
          const isCompleted = completedTasks.has(task.id);
          return (
            <button
              key={task.id}
              onClick={() => handleTaskClick(task.id, task.link_url)}
              className={`w-full flex items-center justify-between p-4 rounded-lg transition-all duration-300 ${
                isCompleted
                  ? 'bg-green-500/20 border-green-500/50'
                  : 'bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20'
              } border`}
            >
              <div className="flex items-center gap-3">
                <FontAwesomeIcon icon={taskIcons[task.task_type] || faTasks} className="text-xl text-primary" />
                <span className="font-medium text-light-text dark:text-white text-left">{task.title}</span>
              </div>
              <FontAwesomeIcon
                icon={isCompleted ? fasFaCheckCircle : farFaCheckCircle}
                className={`text-xl ${isCompleted ? 'text-green-500' : 'text-gray-400'}`}
              />
            </button>
          );
        })}
      </div>
      
      <div className="mt-8 text-center">
        {isSubmitted ? (
          <p className="font-semibold text-green-400">{t('eventsPage.tasksCompleteMessage')}</p>
        ) : (
          <button
            onClick={handleParticipate}
            disabled={!allTasksCompleted && isConnected}
            className="btn-primary w-full max-w-xs py-3 text-lg rounded-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0"
          >
            { isConnected ? t('eventsPage.joinButton') : "Connect Wallet to Join" }
          </button>
        )}
      </div>
    </div>
  );
};

export default function PageEvents({ currentUser }) {
  const { t } = useLanguage();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEventsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
        let query = supabase
            .from('events')
            .select(`*, event_tasks(*), event_participants(user_id)`)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        const { data, error: fetchError } = await query;
        if (fetchError) throw fetchError;
        
        const processedData = data.map(event => ({
            ...event,
            is_participated: currentUser?.id ? event.event_participants.some(p => p.user_id === currentUser.id) : false
        }));
        setEvents(processedData);
    } catch (err) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
  }, [currentUser?.id]);
  
  useEffect(() => {
    fetchEventsData();
  }, [fetchEventsData]);

  const handleParticipate = async (eventId, walletAddress) => {
    try {
        const { error } = await supabase.from('event_participants').insert({
            event_id: eventId,
            user_id: currentUser.id,
            wallet_address: walletAddress
        });
        if (error) {
            if(error.code === '23505') { // unique constraint violation
                alert("Anda sudah berpartisipasi dalam event ini.");
            } else {
                throw error;
            }
        } else {
            alert(t('eventsPage.submitSuccess'));
            fetchEventsData(); // Refresh data untuk update UI
        }
    } catch (err) {
        alert("Gagal berpartisipasi: " + err.message);
    }
  };

  if (loading) {
    return <div className="page-content text-center py-10"><FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-primary"/></div>
  }
  
  if (error) {
     return <div className="page-content text-center py-10 text-red-400"><FontAwesomeIcon icon={faExclamationTriangle} size="2x" className="mb-2"/> <p>{error}</p></div>
  }
  
  if (!currentUser?.id) {
    return (
      <div className="page-content text-center py-10">
        <div className="card max-w-md mx-auto p-8">
          <h2 className="text-2xl font-bold text-light-text dark:text-white mb-3">{t('eventsPage.loginPromptTitle')}</h2>
          <p className="text-light-subtle dark:text-gray-400 mb-6">{t('eventsPage.loginPrompt')}</p>
          <Link to="/profile" className="btn-primary px-6 py-2">
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
      
      {events.length > 0 ? (
        events.map(event => (
            <EventCard key={event.id} event={event} onParticipate={handleParticipate} currentUser={currentUser} />
        ))
      ) : (
        <div className="text-center py-10 text-light-subtle dark:text-gray-500">
            <FontAwesomeIcon icon={faGift} size="3x" className="mb-4"/>
            <p>Belum ada event yang aktif saat ini. Pantau terus!</p>
        </div>
      )}
    </section>
  );
}
