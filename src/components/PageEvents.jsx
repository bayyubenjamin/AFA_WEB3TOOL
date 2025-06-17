
// src/components/PageEvents.jsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGift, faCheckCircle as fasFaCheckCircle, faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import { faCheckCircle as farFaCheckCircle } from '@fortawesome/free-regular-svg-icons';
import { faTelegram, faYoutube, faXTwitter } from '@fortawesome/free-brands-svg-icons';
import { useLanguage } from '../context/LanguageContext'; // Correct import

// REMOVE the local getTranslations function that uses require()
// The `t` function from useLanguage context is already available and handles this.

// Data mock untuk event, di aplikasi nyata ini akan dari database
const giveawayEvent = {
  id: 1,
  title: 'AFA Community Launch Giveaway',
  description: 'Untuk merayakan peluncuran komunitas, kami mengadakan giveaway spesial! Selesaikan semua tugas untuk berpartisipasi.',
  reward: 'Total Hadiah 100 USDT untuk 5 Pemenang',
  tasks: [
    { name: 'Follow AFA on X (Twitter)', icon: faXTwitter, link: 'https://x.com/airdropforal', id: 'twitter' },
    { name: 'Join AFA Telegram Channel', icon: faTelegram, link: 'https://t.me/airdrop4ll', id: 'telegram' }, // Changed link to a more common Telegram link format
    { name: 'Subscribe AFA on YouTube', icon: faYoutube, link: 'https://www.youtube.com/@AirdropForAll', id: 'youtube' }, // Changed link for demonstration
  ],
};

export default function PageEvents({ currentUser }) {
  const { t } = useLanguage(); // Use the t function from context
  
  const [completedTasks, setCompletedTasks] = useState(new Set());
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleTaskClick = (taskId, taskLink) => {
    window.open(taskLink, '_blank', 'noopener,noreferrer');
    setCompletedTasks(prev => new Set(prev).add(taskId));
  };

  const handleSubmit = () => {
    // Di aplikasi nyata, di sini Anda akan mengirim data partisipasi ke backend.
    // Contoh: await supabase.from('giveaway_participants').insert({ ... })
    alert(t('eventsPage.submitSuccess'));
    setIsSubmitted(true);
  };
  
  const allTasksCompleted = completedTasks.size === giveawayEvent.tasks.length;

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
      
      <div className="card max-w-2xl mx-auto p-6 md:p-8 rounded-2xl shadow-xl">
        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-black/10 dark:border-white/10">
          <FontAwesomeIcon icon={faGift} className="text-4xl text-primary" />
          <div>
            <h2 className="text-2xl font-bold text-light-text dark:text-white">{giveawayEvent.title}</h2>
            <p className="text-sm font-semibold text-green-400">{giveawayEvent.reward}</p>
          </div>
        </div>
        
        <p className="text-light-subtle dark:text-gray-400 mb-6">{giveawayEvent.description}</p>
        
        <h3 className="text-lg font-semibold text-light-text dark:text-white mb-4">{t('eventsPage.tasksTitle')}</h3>
        <div className="space-y-3">
          {giveawayEvent.tasks.map(task => {
            const isCompleted = completedTasks.has(task.id);
            return (
              <button
                key={task.id}
                onClick={() => handleTaskClick(task.id, task.link)}
                className={`w-full flex items-center justify-between p-4 rounded-lg transition-all duration-300 ${
                  isCompleted
                    ? 'bg-green-500/20 border-green-500/50'
                    : 'bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20'
                } border`}
              >
                <div className="flex items-center gap-3">
                  <FontAwesomeIcon icon={task.icon} className="text-xl text-primary" />
                  <span className="font-medium text-light-text dark:text-white">{task.name}</span>
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
              onClick={handleSubmit}
              disabled={!allTasksCompleted}
              className="btn-primary w-full max-w-xs py-3 text-lg rounded-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0"
            >
              {t('eventsPage.joinButton')}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

