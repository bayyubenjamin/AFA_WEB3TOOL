// src/components/PageEventDetail.jsx - KODE LENGKAP DAN SUDAH DIPERBAIKI

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useLanguage } from '../context/LanguageContext';
import { useAccount, useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGift, faCheckCircle as fasFaCheckCircle, faSpinner, faExclamationTriangle, faCalendarDays, faArrowLeft, faTasks } from '@fortawesome/free-solid-svg-icons';
import { faCheckCircle as farFaCheckCircle } from '@fortawesome/free-regular-svg-icons';
import { faTelegram, faYoutube, faXTwitter, faDiscord } from '@fortawesome/free-brands-svg-icons';

const taskIcons = {
  twitter: faXTwitter,
  telegram: faTelegram,
  youtube: faYoutube,
  discord: faDiscord,
};

// Komponen SocialTask dengan kelas yang sudah diperbaiki
const SocialTask = ({ task, onVerify, isVerified, isLoading }) => {
    return (
        <div className={`w-full flex items-center justify-between p-4 rounded-lg transition-all duration-300 ${
            isVerified ? 'bg-green-500/20 border-green-500/50' : 'bg-light-bg dark:bg-dark-bg hover:bg-gray-200/60 dark:hover:bg-dark'
        } border`}>
            <div className="flex items-center gap-4">
                <FontAwesomeIcon icon={taskIcons[task.task_type] || faTasks} className="text-2xl text-primary" />
                <div>
                    <p className="font-semibold text-light-text dark:text-white text-left">{task.title}</p>
                    <a href={task.link_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                        Kunjungi Link Tugas
                    </a>
                </div>
            </div>
            {isVerified ? (
                <div className="flex items-center gap-2 text-green-400 font-semibold text-sm">
                    <FontAwesomeIcon icon={fasFaCheckCircle} />
                    <span>Terverifikasi</span>
                </div>
            ) : (
                <button 
                    onClick={() => onVerify(task)} 
                    disabled={isLoading} 
                    className="btn-secondary text-sm px-5 py-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    {isLoading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Verifikasi'}
                </button>
            )}
        </div>
    );
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
  const [verifiedTasks, setVerifiedTasks] = useState(new Set());
  const [verifyingTaskId, setVerifyingTaskId] = useState(null);
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
    if (currentUser?.id) {
        fetchEventData();
    }
  }, [fetchEventData, currentUser?.id]);

  const handleVerifyTask = async (task) => {
      if (task.task_type !== 'telegram') {
          alert("Verifikasi untuk tipe task ini belum diimplementasikan.");
          return;
      }
      
      if (!currentUser?.telegram_id) {
          alert("Anda harus menghubungkan akun Telegram Anda di halaman profil terlebih dahulu.");
          navigate('/profile');
          return;
      }

      setVerifyingTaskId(task.id);
      try {
          const { data, error } = await supabase.functions.invoke('verify-telegram-follow', {
              body: { channelId: task.target_resource_id } 
          });

          if (error) throw new Error(error.message);
          if (data.error) throw new Error(data.error);

          if (data.verified) {
              setVerifiedTasks(prev => new Set(prev).add(task.id));
              alert("Verifikasi join channel berhasil!");
          } else {
              alert("Verifikasi gagal. Pastikan Anda sudah bergabung dengan channel target.");
          }
      } catch (err) {
          console.error("Verification error:", err);
          alert("Gagal memverifikasi: " + err.message);
      } finally {
          setVerifyingTaskId(null);
      }
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

  const allTasksCompleted = event.event_tasks.every(task => verifiedTasks.has(task.id));

  return (
    <section className="page-content space-y-8 py-8">
      <Link to="/events" className="text-sm text-primary hover:underline mb-6 inline-flex items-center">
        <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
        Kembali ke Daftar Event
      </Link>

      {/* PERBAIKAN: Mengganti className 'card' dengan kelas spesifik untuk memastikan warna gelap diterapkan */}
      <div className="bg-light-card dark:bg-dark-card border border-black/5 dark:border-white/10 rounded-2xl shadow-subtle dark:shadow-subtle-dark max-w-3xl mx-auto p-0 overflow-hidden">
        <div className="relative">
          <img src={event.banner_image_url || 'https://placehold.co/800x400/101020/7f5af0?text=AFA+Event'} alt={event.title} className="w-full h-48 md:h-64 object-cover" />
          {/* PERBAIKAN: Mengganti dark:from-card menjadi dark:from-dark-card */}
          <div className="absolute inset-0 bg-gradient-to-t from-light-card dark:from-dark-card via-light-card/70 dark:via-dark-card/70 to-transparent"></div>
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
              {(event.event_tasks || []).map(task => (
                <SocialTask 
                    key={task.id}
                    task={task}
                    onVerify={handleVerifyTask}
                    isVerified={verifiedTasks.has(task.id)}
                    isLoading={verifyingTaskId === task.id}
                />
              ))}
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-black/10 dark:border-white/20 text-center">
            {isSubmitted ? (
              <p className="font-semibold text-green-400 text-lg">{t('eventsPage.tasksCompleteMessage')}</p>
            ) : (
              <button onClick={handleParticipate} disabled={!allTasksCompleted || !isConnected}
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
