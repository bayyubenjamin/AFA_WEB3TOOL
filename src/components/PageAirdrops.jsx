// src/components/PageAirdrops.jsx

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch, faSpinner, faExclamationTriangle, faCalendarAlt, faShieldHalved, faBullhorn,
  faCoins, faClipboardQuestion
} from "@fortawesome/free-solid-svg-icons";

import { useLanguage } from "../context/LanguageContext";
import translationsId from "../translations/id.json";
import translationsEn from "../translations/en.json";
import { supabase } from '../supabaseClient';
import { useAirdropsWithUpdates } from "../hooks/useAirdropsWithUpdates"; // <-- 1. IMPORT HOOK BARU

const ADMIN_USER_ID = 'e866df86-3206-4019-890f-01a61b989f15';
const LS_AIRDROPS_LAST_VISIT_KEY = 'airdropsLastVisitTimestamp';

const getTranslations = (lang) => (lang === 'id' ? translationsId : translationsEn);

// =================================================================
// KOMPONEN `AirdropCard` TIDAK DIUBAH SAMA SEKALI
// =================================================================
const AirdropCard = ({ airdrop }) => {
  const { language } = useLanguage();
  const t = getTranslations(language).pageAirdrops;

  if (!t) return null;

  const statusInfo = {
    active: { text: t.cardStatusActive, color: 'border-green-500/50 bg-green-500/10 text-green-300' },
    upcoming: { text: t.cardStatusUpcoming, color: 'border-blue-500/50 bg-blue-500/10 text-blue-300' },
    ended: { text: t.cardStatusEnded, color: 'border-red-500/50 bg-red-500/10 text-red-300' },
  }[airdrop.status] || { text: 'Unknown', color: 'border-gray-500/50 bg-gray-500/10 text-gray-400' };

  const categoryColor = {
    'Retroactive': 'bg-purple-500/20 text-purple-300',
    'Testnet': 'bg-sky-500/20 text-sky-300',
    'Mainnet': 'bg-emerald-500/20 text-emerald-300',
    'NFT Drop': 'bg-orange-500/20 text-orange-300'
  }[airdrop.category] || 'bg-gray-500/20 text-gray-300';
  
  const confirmationStyles = {
    'Potential': 'bg-yellow-500/20 text-yellow-300',
    'Confirmed': 'bg-green-500/20 text-green-300'
  };
  const confirmationStyle = confirmationStyles[airdrop.confirmation_status] || 'bg-gray-500/20 text-gray-300';

  const postDate = new Date(airdrop.created_at).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric'
  });

  return (
    <div className="bg-light-card dark:bg-dark-card rounded-2xl group relative h-full flex flex-col border border-black/10 dark:border-white/10 overflow-hidden transition-all duration-300 hover:border-primary hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-1">
      
      {airdrop.isNewForUser && (
        <span className="absolute top-4 left-4 z-20 h-3 w-3 rounded-full bg-red-500 border-2 border-light-card dark:border-dark-card" title="Baru atau ada update"></span>
      )}

      {airdrop.hasNewUpdate && (
        <div className="absolute top-3 right-3 z-20 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center shadow-lg" title="Ada update baru!">
          <span className="relative flex h-2 w-2 mr-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-400"></span>
          </span>
          UPDATE
        </div>
      )}

      {!airdrop.hasNewUpdate && airdrop.isNewlyPosted && (
        <div className="absolute top-3 right-3 z-20 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center shadow-lg" title="Airdrop Baru!">
          <FontAwesomeIcon icon={faBullhorn} className="mr-1.5" />
          NEW
        </div>
      )}

      <Link to={`/airdrops/${airdrop.slug}`} className="block h-full flex flex-col">
        <div className={`absolute top-0 left-0 text-xs font-bold py-1 px-3 m-3 rounded-full z-10 ${categoryColor}`}>
          {airdrop.category}
        </div>
        <div className="relative w-full h-48 overflow-hidden">
          <img src={airdrop.image_url} alt={airdrop.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" onError={(e) => { e.target.src = "https://placehold.co/600x400/0a0a1a/7f5af0?text=AFA"; }} />
          <div className="absolute inset-0 bg-gradient-to-t from-light-card dark:from-dark-card to-transparent"></div>
        </div>
        <div className="p-5 flex flex-col flex-grow">
          <h3 className="text-xl font-bold text-light-text dark:text-white mb-2 truncate group-hover:text-primary transition-colors">{airdrop.title}</h3>
          
          <div className="flex justify-between items-center mb-3 text-xs">
            {airdrop.raise_amount ? (
                <div className="flex items-center bg-black/5 dark:bg-white/5 px-2 py-1 rounded-full text-light-subtle dark:text-gray-300" title="Total Pendanaan">
                    <FontAwesomeIcon icon={faCoins} className="text-yellow-400 mr-1.5"/>
                    <span className="font-semibold">Raise:</span>&nbsp;<span>{airdrop.raise_amount}</span>
                </div>
            ) : (
                <div />
            )}

            {airdrop.confirmation_status && (
                <div className={`flex items-center px-2 py-1 rounded-full font-semibold ${confirmationStyle}`} title="Status Konfirmasi Airdrop">
                    <FontAwesomeIcon icon={faClipboardQuestion} className="mr-1.5"/>
                    {airdrop.confirmation_status}
                </div>
            )}
          </div>
          
          <p className="text-light-subtle dark:text-gray-400 text-sm mb-4 h-10 overflow-hidden text-ellipsis flex-grow">
            {airdrop.description}
          </p>
          <div className="flex justify-between items-center text-xs mt-auto">
            <span className={`px-3 py-1 rounded-full font-semibold ${statusInfo.color}`}>{statusInfo.text}</span>
            <span className="text-light-subtle dark:text-gray-500 font-medium">
                <FontAwesomeIcon icon={faCalendarAlt} className="mr-1.5" />
                {postDate}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
};


export default function PageAirdrops({ currentUser, onEnterPage }) {
  const { language } = useLanguage();
  const t = getTranslations(language).pageAirdrops;

  // 2. MENGGUNAKAN HOOK BARU UNTUK MENGELOLA DATA
  const { airdrops, loading, error } = useAirdropsWithUpdates();

  // State untuk UI (pencarian, filter) tetap di sini
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const isAdmin = currentUser?.id === ADMIN_USER_ID;

  // 3. LOGIKA `fetchAirdrops` dan `useEffect`-nya sudah dipindahkan ke dalam hook.
  
  // useEffect ini tetap ada untuk menjalankan fungsi dari App.js
  useEffect(() => {
    if (onEnterPage) {
      onEnterPage();
    }
  }, [onEnterPage]);

  // useMemo ini tetap ada dan akan berjalan otomatis saat `airdrops` dari hook berubah
  const filteredAirdrops = useMemo(() => {
    return airdrops
      .filter(airdrop => activeFilter === 'all' || airdrop.status === activeFilter)
      .filter(airdrop => airdrop.title.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [airdrops, activeFilter, searchTerm]);

  if (!t) return null;

  const filterTranslations = {
    all: t.filterAll || 'Semua',
    active: t.filterActive || 'Aktif',
    upcoming: t.filterUpcoming || 'Mendatang',
    ended: t.filterEnded || 'Selesai'
  };
  
  return (
    <>
      <section id="airdrops" className="page-content space-y-8 pt-8">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold futuristic-text-gradient mb-3">{t.allAirdropsTitle}</h1>
          <p className="text-lg text-light-subtle dark:text-gray-400 max-w-2xl mx-auto">{t.getUpdates}</p>
        </div>

        {isAdmin && (
          <div className="max-w-4xl mx-auto p-4 bg-light-card dark:bg-dark-card border border-primary/50 rounded-lg text-center">
              <Link to="/airdrops/postairdrops" className="btn-secondary px-4 py-2 text-sm inline-flex items-center gap-2">
                <FontAwesomeIcon icon={faShieldHalved}/> Go to Admin Panel
              </Link>
          </div>
        )}

        <div className="py-4 px-2 -mx-2">
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                    <FontAwesomeIcon icon={faSearch} className="absolute top-1/2 left-4 -translate-y-1/2 text-light-subtle dark:text-gray-500" />
                  <input 
                    type="text" 
                    placeholder={t.searchPlaceholder || "Cari airdrop..."} 
                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
                    className="w-full bg-light-card dark:bg-dark-card border border-black/10 dark:border-white/10 rounded-lg py-2.5 pl-11 pr-4 text-light-text dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" 
                  />
                </div>
              <div className="bg-light-card dark:bg-dark-card border border-black/10 dark:border-white/10 rounded-lg p-1 flex items-center space-x-1 flex-wrap justify-center">
                  {['all', 'active', 'upcoming', 'ended'].map(filter => (
                      <button key={filter} onClick={() => setActiveFilter(filter)} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeFilter === filter ? 'bg-primary text-white' : 'text-light-text dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5'}`}>
                          {filterTranslations[filter]}
                      </button>
                  ))}
              </div>
            </div>
        </div>

        {/* 4. PENYESUAIAN LOGIKA RENDER UNTUK CACHING */}
        {(loading && airdrops.length === 0) ? (
          <div className="flex justify-center items-center h-64"><FontAwesomeIcon icon={faSpinner} className="text-primary text-4xl animate-spin" /></div>
        ) : (error && airdrops.length === 0) ? (
          <div className="flex flex-col items-center justify-center h-64 text-red-400"><FontAwesomeIcon icon={faExclamationTriangle} size="2x" className="mb-3"/><p>{error}</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {filteredAirdrops.length > 0 ? (
              filteredAirdrops.map(airdrop => (
                <AirdropCard key={airdrop.id} airdrop={airdrop} />
              ))
            ) : (
              <p className="col-span-full text-center text-light-subtle dark:text-gray-500 py-16">{t.noAirdropsAvailable}</p>
            )}
          </div>
        )}
      </section>
    </>
  );
}
