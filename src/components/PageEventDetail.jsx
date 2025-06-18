// src/components/PageEventDetail.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useLanguage } from '../context/LanguageContext';
import { useAccount, useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGift, faCheckCircle as fasFaCheckCircle, faSpinner, faExclamationTriangle, faCalendarDays, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { faCheckCircle as farFaCheckCircle } from '@fortawesome/free-regular-svg-icons';
import { faTelegram, faYoutube, faXTwitter, faDiscord } from '@fortawesome/free-brands-svg-icons';

const taskIcons = {
  twitter: faXTwitter,
  telegram: faTelegram,
  youtube: faYoutube,
  discord: faDiscord,
};

export default function PageEventDetail({ currentUser }) {
  const { eventSlug } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completedTasks, setCompletedTasks] = useState(new Set());
  const [isSubmitted, setIsSubmitted] = useState(false);

  const fetchEventData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('events')
        .select(`*, event_tasks(*), event_participants(user_id)`)
        .eq('slug', eventSlug)
        .eq('is_active', true)
        .single();
      
      if (fetchError || !data) {
        throw new Error('Event tidak ditemukan atau tidak aktif.');
      }

      const isParticipated = currentUser?.id ? data.event_participants.some(p => p.user_id === currentUser.id) : false;
      setEvent({ ...data, is_participated: isParticipated });
      setIsSubmitted(isParticipated);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [eventSlug, currentUser?.id]);

  useEffect(() => {
    fetchEventData();
  }, [fetchEventData]);

  const handleTaskClick = (taskId, taskLink) => {
    window.open(taskLink, '_blank', 'noopener,noreferrer');
    setCompletedTasks(prev => new Set(prev).add(taskId));
  };
  
  const handleParticipate = async () => {
    if (!isConnected) {
        connect({ connector: injected() });
        return;
    }
    if (!currentUser?.id) {
        alert("Anda harus login untuk berpartisipasi.");
        navigate('/profile');
        return;
    }

    try {
        const { error } = await supabase.from('event_participants').insert({
            event_id: event.id,
            user_id: currentUser.id,
            wallet_address: address
        });
        if (error) {
            if(error.code === '23505') {
                alert("Anda sudah berpartisipasi dalam event ini.");
            } else { throw error; }
        } else {
            alert(t('eventsPage.submitSuccess'));
            setIsSubmitted(true);
        }
    } catch (err) {
        alert("Gagal berpartisipasi: " + err.message);
    }
  };

  if (loading) return <div className="page-content text-center py-20"><FontAwesomeIcon icon={faSpinner} spin size="3x" className="text-primary"/></div>;
  if (error) return <div className="page-content text-center py-20 text-red-400"><FontAwesomeIcon icon={faExclamationTriangle} size="3x" className="mb-4"/><p className="text-xl">{error}</p><Link to="/events" className="btn-primary mt-6">Kembali ke Daftar Event</Link></div>;
  if (!event) return null;

  const allTasksCompleted = completedTasks.size === event.event_tasks.length;

  return (
    <section className="page-content space-y-8 py-8">
      <Link to="/events" className="text-sm text-primary hover:underline mb-6 inline-flex items-center">
        <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
        Kembali ke Daftar Event
      </Link>

      <div className="card-premium max-w-3xl mx-auto p-0 overflow-hidden">
        <div className="relative">
          <img src={event.banner_image_url || 'https://placehold.co/800x400/101020/7f5af0?text=AFA+Event'} alt={event.title} className="w-full h-48 md:h-64 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/70 to-transparent"></div>
        </div>
        
        <div className="p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-4">
            <FontAwesomeIcon icon={faGift} className="text-4xl text-primary" />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-light-text dark:text-white">{event.title}</h1>
              <p className="text-md font-semibold text-green-400">{event.reward_pool}</p>
            </div>
          </div>
          
          {event.description && <p className="text-light-subtle dark:text-gray-400">{event.description}</p>}
          
          {event.end_date && (
            <p className="text-sm text-yellow-400 font-semibold flex items-center gap-2">
                <FontAwesomeIcon icon={faCalendarDays} />
                Berakhir pada: {new Date(event.end_date).toLocaleString('id-ID')}
            </p>
          )}
          
          <div>
            <h3 className="text-xl font-semibold text-light-text dark:text-white mb-4 border-t border-black/10 dark:border-white/20 pt-6">{t('eventsPage.tasksTitle')}</h3>
            <div className="space-y-3">
              {event.event_tasks.map(task => {
                const isCompleted = completedTasks.has(task.id);
                return (
                  <button key={task.id} onClick={() => handleTaskClick(task.id, task.link_url)}
                    className={`w-full flex items-center justify-between p-4 rounded-lg transition-all duration-300 ${
                      isCompleted ? 'bg-green-500/20 border-green-500/50' : 'bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20'
                    } border`}>
                    <div className="flex items-center gap-3">
                      <FontAwesomeIcon icon={taskIcons[task.task_type] || faTasks} className="text-xl text-primary" />
                      <span className="font-medium text-light-text dark:text-white text-left">{task.title}</span>
                    </div>
                    <FontAwesomeIcon icon={isCompleted ? fasFaCheckCircle : farFaCheckCircle} className={`text-xl ${isCompleted ? 'text-green-500' : 'text-gray-400'}`}/>
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-black/10 dark:border-white/20 text-center">
            {isSubmitted ? (
              <p className="font-semibold text-green-400 text-lg">{t('eventsPage.tasksCompleteMessage')}</p>
            ) : (
              <button onClick={handleParticipate} disabled={!allTasksCompleted && isConnected}
                className="btn-primary w-full max-w-sm py-3 text-lg rounded-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0">
                { isConnected ? t('eventsPage.joinButton') : "Connect Wallet to Join" }
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}


