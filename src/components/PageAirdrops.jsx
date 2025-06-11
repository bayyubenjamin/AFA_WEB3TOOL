// src/components/PageAirdrops.jsx - VERSI FINAL DENGAN SORTING OTOMATIS DAN NOTIFIKASI LENGKAP

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch, faSpinner, faExclamationTriangle, faCalendarAlt, faShieldHalved, faBullhorn
} from "@fortawesome/free-solid-svg-icons";

import { useLanguage } from "../context/LanguageContext";
import translationsId from "../translations/id.json";
import translationsEn from "../translations/en.json";
import { supabase } from '../supabaseClient';

const ADMIN_USER_ID = '9a405075-260e-407b-a7fe-2f05b9bb5766';

const getTranslations = (lang) => (lang === 'id' ? translationsId : translationsEn);

// AirdropCard dengan semua notifikasi baru
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

  const postDate = new Date(airdrop.created_at).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric'
  });

  return (
    <div className="bg-card rounded-2xl group relative h-full flex flex-col border border-white/10 overflow-hidden transition-all duration-300 hover:border-primary hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-1">
      
      {/* ===== Notifikasi Update (Prioritas) ===== */}
      {airdrop.hasNewUpdate && (
        <div className="absolute top-3 right-3 z-20 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center shadow-lg" title="Ada update baru!">
          <span className="relative flex h-2 w-2 mr-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-400"></span>
          </span>
          UPDATE
        </div>
      )}

      {/* ===== Notifikasi Postingan Baru (Jika tidak ada update baru) ===== */}
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
          <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent"></div>
        </div>
        <div className="p-5 flex flex-col flex-grow">
          <h3 className="text-xl font-bold text-white mb-2 truncate group-hover:text-primary transition-colors">{airdrop.title}</h3>
          <p className="text-gray-400 text-sm mb-4 h-10 overflow-hidden text-ellipsis flex-grow">
            {airdrop.description}
          </p>
          <div className="flex justify-between items-center text-xs mt-auto">
            <span className={`px-3 py-1 rounded-full font-semibold ${statusInfo.color}`}>{statusInfo.text}</span>
            {/* Menampilkan tanggal posting */}
            <span className="text-gray-500 font-medium">
                <FontAwesomeIcon icon={faCalendarAlt} className="mr-1.5" />
                {postDate}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
};

// Komponen Utama Halaman Airdrops
export default function PageAirdrops({ currentUser }) {
  const { language } = useLanguage();
  const t = getTranslations(language).pageAirdrops;

  const [airdrops, setAirdrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const isAdmin = currentUser?.id === ADMIN_USER_ID;

  const fetchAirdrops = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Ambil data airdrop beserta tanggal update terkait
      const { data, error } = await supabase
        .from('airdrops')
        .select('*, AirdropUpdates(created_at)');

      if (error) throw error;

      const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

      // Proses data untuk menambahkan flag notifikasi dan tanggal aktivitas terakhir
      const processedData = (data || []).map(airdrop => {
        const updates = airdrop.AirdropUpdates;
        let lastActivityAt = new Date(airdrop.created_at);
        let hasNewUpdate = false;
        
        // Cek apakah airdrop baru diposting
        const isNewlyPosted = new Date(airdrop.created_at) > fortyEightHoursAgo;

        // Cek apakah ada update baru
        if (updates && updates.length > 0) {
          const mostRecentUpdateDate = new Date(
            Math.max(...updates.map(u => new Date(u.created_at)))
          );
          
          if (mostRecentUpdateDate > lastActivityAt) {
            lastActivityAt = mostRecentUpdateDate;
          }

          if (mostRecentUpdateDate > fortyEightHoursAgo) {
            hasNewUpdate = true;
          }
        }
        
        const { AirdropUpdates, ...rest } = airdrop;
        return { ...rest, hasNewUpdate, isNewlyPosted, lastActivityAt };
      });
      
      // Urutkan berdasarkan tanggal aktivitas terakhir
      processedData.sort((a, b) => new Date(b.lastActivityAt) - new Date(a.lastActivityAt));
      
      setAirdrops(processedData);

    } catch (err) {
      setError(err.message || "Gagal memuat data airdrop.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAirdrops();
  }, [fetchAirdrops]);

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
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">{t.getUpdates}</p>
        </div>

        {isAdmin && (
          <div className="max-w-4xl mx-auto p-4 bg-card border border-primary/50 rounded-lg text-center">
             <Link to="/airdrops/postairdrops" className="btn-secondary px-4 py-2 text-sm inline-flex items-center gap-2">
                <FontAwesomeIcon icon={faShieldHalved}/> Go to Admin Panel
            </Link>
          </div>
        )}

        <div className="py-4 px-2 -mx-2">
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                    <FontAwesomeIcon icon={faSearch} className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-500" />
                    <input type="text" placeholder={t.searchPlaceholder || "Cari airdrop..."} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-card border border-white/10 rounded-lg py-2.5 pl-11 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                </div>
                <div className="bg-card border border-white/10 rounded-lg p-1 flex items-center space-x-1 flex-wrap justify-center">
                    {['all', 'active', 'upcoming', 'ended'].map(filter => (
                        <button key={filter} onClick={() => setActiveFilter(filter)} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeFilter === filter ? 'bg-primary text-white' : 'text-gray-300 hover:bg-white/5'}`}>
                            {filterTranslations[filter]}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64"><FontAwesomeIcon icon={faSpinner} className="text-primary text-4xl animate-spin" /></div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 text-red-400"><FontAwesomeIcon icon={faExclamationTriangle} size="2x" className="mb-3"/><p>{error}</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {filteredAirdrops.length > 0 ? (
              filteredAirdrops.map(airdrop => (
                <AirdropCard key={airdrop.id} airdrop={airdrop} />
              ))
            ) : (
              <p className="col-span-full text-center text-gray-500 py-16">{t.noAirdropsAvailable}</p>
            )}
          </div>
        )}
      </section>
    </>
  );
}
