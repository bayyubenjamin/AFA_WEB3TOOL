import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAccount, useReadContract } from 'wagmi';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faLock, faArrowUp, faIdCard, faTicketAlt, faExclamationTriangle, faArrowLeft, faTasks, faCheckCircle as fasFaCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { faTelegram, faYoutube, faXTwitter, faDiscord } from '@fortawesome/free-brands-svg-icons';
import { useLanguage } from '../context/LanguageContext';

import AfaIdentityABI from '../contracts/AFAIdentityDiamondABI.json';
const AFA_IDENTITY_CONTRACT_ADDRESS = '0x8611E3C3F991C989fEF0427998062f77c9D0A2F1';

const taskIcons = {
  twitter: faXTwitter,
  telegram: faTelegram,
  youtube: faYoutube,
  discord: faDiscord,
};

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
  const { address, isConnected } = useAccount();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tokenId, setTokenId] = useState(null);
  
  const [verifiedTasks, setVerifiedTasks] = useState(new Set());
  const [verifyingTaskId, setVerifyingTaskId] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: AFA_IDENTITY_CONTRACT_ADDRESS,
    abi: AfaIdentityABI,
    functionName: 'balanceOf',
    args: [currentUser?.address],
    enabled: !!currentUser?.address,
  });

  const { data: wagmiTokenId, refetch: refetchTokenId } = useReadContract({
    address: AFA_IDENTITY_CONTRACT_ADDRESS,
    abi: AfaIdentityABI,
    functionName: 'tokenOfOwnerByIndex',
    args: [currentUser?.address, 0],
    enabled: !!currentUser?.address && !!balance && Number(balance) > 0,
  });

  const { data: isPremium, isLoading: isLoadingPremiumStatus, refetch: refetchPremiumStatus } = useReadContract({
    address: AFA_IDENTITY_CONTRACT_ADDRESS,
    abi: AfaIdentityABI,
    functionName: 'isPremium',
    args: [tokenId],
    enabled: !!tokenId,
  });

  const hasNFT = useMemo(() => balance && Number(balance) > 0, [balance]);

  useEffect(() => {
    if (wagmiTokenId !== undefined) {
      setTokenId(wagmiTokenId);
    }
  }, [wagmiTokenId]);
  
  const fetchEventData = useCallback(async () => {
    if (!currentUser || !eventSlug) return;
    
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

      const isParticipated = currentUser.id ? data.event_participants.some(p => p.user_id === currentUser.id) : false;
      setEvent({ ...data, is_participated: isParticipated });
      setIsSubmitted(isParticipated);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [eventSlug, currentUser]);

  useEffect(() => {
      fetchEventData();
  }, [fetchEventData]);
  
  const handleVerifyTask = async (task) => { /* ... (logika verifikasi tugas Anda) ... */ };
  const handleParticipate = async () => { /* ... (logika partisipasi Anda) ... */ };
  const allTasksCompleted = event?.event_tasks.every(task => verifiedTasks.has(task.id)) ?? false;


  if (loading) {
    return (
      <div className="page-content text-center py-20">
        <FontAwesomeIcon icon={faSpinner} spin size="3x" className="text-primary" />
        <p className="mt-4 text-light-subtle dark:text-gray-400">Loading Event...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-content text-center py-20 text-red-400">
        <FontAwesomeIcon icon={faExclamationTriangle} size="3x" className="mb-4" />
        <p className="text-xl">{error}</p>
        <Link to="/events" className="btn-primary mt-6">Kembali ke Daftar Event</Link>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="page-content text-center py-20 text-gray-500">
        <p>Event tidak ditemukan.</p>
        <Link to="/events" className="btn-secondary mt-6">Kembali ke Events</Link>
      </div>
    );
  }

  if (!hasNFT && currentUser?.id) {
    return (
      <div className="page-content flex flex-col items-center justify-center text-center h-full pt-20">
          <FontAwesomeIcon icon={faIdCard} size="3x" className="mb-4 text-primary" />
          <h2 className="text-2xl font-bold text-light-text dark:text-white">AFA Identity Diperlukan</h2>
          <p className="text-light-subtle dark:text-gray-400 mt-2 mb-6 max-w-md">
              Anda perlu melakukan minting AFA Identity NFT sebelum dapat berpartisipasi dalam event.
          </p>
          <Link to="/identity" className="btn-primary px-8 py-3 text-lg">
            Mint Identity Anda Sekarang
          </Link>
      </div>
    );
  }

  return (
    <section className="page-content space-y-8 py-8">
      <Link to="/events" className="text-sm text-primary hover:underline mb-6 inline-flex items-center">
        <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
        Kembali ke Daftar Event
      </Link>
      <div className="bg-light-card dark:bg-dark-card border border-black/5 dark:border-white/10 rounded-2xl shadow-subtle dark:shadow-subtle-dark max-w-3xl mx-auto p-0 overflow-hidden">
        <div className="relative">
          <img src={event.banner_image_url || 'https://placehold.co/800x400/101020/7f5af0?text=AFA+Event'} alt={event.title} className="w-full h-48 md:h-64 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-light-card dark:from-dark-card via-light-card/70 dark:via-dark-card/70 to-transparent"></div>
        </div>
        <div className="p-6 md:p-8 space-y-6">
          <h1 className="text-3xl md:text-4xl font-bold text-light-text dark:text-white">{event.title}</h1>
          <p className="font-semibold text-green-400">{event.reward_pool}</p>
          {event.description && <p className="text-light-subtle dark:text-gray-400">{event.description}</p>}
          
          <div>
            <h3 className="text-xl font-semibold text-light-text dark:text-white mb-4 border-t border-black/10 dark:border-white/20 pt-6">Tugas yang Harus Diselesaikan:</h3>
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
             {/* Blok Tombol Aksi */}
             {isLoadingPremiumStatus ? (
                 <button className="btn-secondary w-full max-w-sm py-3 text-lg rounded-lg" disabled>
                     <FontAwesomeIcon icon={faSpinner} spin /> Memeriksa Status...
                 </button>
             ) : event.required_level === 'premium' && !isPremium ? (
                 <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                    <FontAwesomeIcon icon={faLock} className="text-yellow-400 text-2xl mb-2" />
                    <h4 className="font-bold text-yellow-300">Event Premium</h4>
                    <p className="text-sm text-yellow-400/80 mb-4">Giveaway ini khusus untuk member Premium.</p>
                    <Link to="/identity" className="btn-secondary inline-flex items-center gap-2 px-4 py-2 text-sm">
                      <FontAwesomeIcon icon={faArrowUp}/> Upgrade ke Premium
                    </Link>
                 </div>
             ) : isSubmitted ? (
                 <p className="font-semibold text-green-400 text-lg">Anda sudah berpartisipasi!</p>
             ) : (
                <button onClick={handleParticipate} disabled={!allTasksCompleted || !isConnected}
                  className="btn-primary w-full max-w-sm py-3 text-lg rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
                  { isConnected ? "Ikuti Giveaway" : "Connect Wallet" }
                </button>
             )}
          </div>
        </div>
      </div>
    </section>
  );
}
