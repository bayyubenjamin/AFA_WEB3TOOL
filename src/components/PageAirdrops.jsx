// src/components/PageAirdrops.jsx - VERSI ROUTING

import React, { useState, useEffect, useMemo } from "react";
// [TAMBAHAN]: Impor Link untuk navigasi
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faSpinner, faExclamationTriangle, faCalendarAlt } from "@fortawesome/free-solid-svg-icons";
import { useLanguage } from "../context/LanguageContext";
import translationsId from "../translations/id.json";
import translationsEn from "../translations/en.json";
// [TAMBAHAN]: Impor data dari file utilitas
import { getAllAirdrops } from "../utils/airdropData";

const getTranslations = (lang) => {
  return lang === 'id' ? translationsId : translationsEn;
};

// [DIUBAH]: Komponen Card Airdrop sekarang dibungkus dengan Link dan tidak butuh 'onShowDetail'
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

  return (
    <Link to={`/airdrops/${airdrop.slug}`} className="block">
      <div
        className="bg-card rounded-2xl group relative overflow-hidden h-full flex flex-col border border-white/10 transition-all duration-300 hover:border-primary hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-1"
      >
        <div className={`absolute top-0 right-0 text-xs font-bold py-1 px-3 m-3 rounded-full z-20 ${categoryColor}`}>
          {airdrop.category}
        </div>
        <div className="relative w-full h-48">
          <img
            src={airdrop.image_url}
            alt={airdrop.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => { e.target.src = "https://placehold.co/600x400/0a0a1a/7f5af0?text=AFA"; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent"></div>
        </div>
        <div className="p-5 flex flex-col flex-grow">
          <h3 className="text-xl font-bold text-white mb-2 truncate group-hover:text-primary transition-colors">{airdrop.title}</h3>
          <p className="text-gray-400 text-sm mb-4 h-10 overflow-hidden text-ellipsis flex-grow">
            {airdrop.description}
          </p>
          <div className="flex justify-between items-center text-xs mt-auto">
            <span className={`px-3 py-1 rounded-full font-semibold ${statusInfo.color}`}>
              {statusInfo.text}
            </span>
            {airdrop.date && (
              <span className="text-gray-500 font-medium">
                <FontAwesomeIcon icon={faCalendarAlt} className="mr-1.5" /> {airdrop.date}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

// [DIHAPUS]: Komponen AirdropDetailModal tidak lagi digunakan di sini

// Komponen Utama Halaman Airdrops
export default function PageAirdrops({ currentUser }) {
  const { language } = useLanguage();
  const t = getTranslations(language).pageAirdrops;

  const [airdrops, setAirdrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  
  // [DIHAPUS]: State untuk modal tidak diperlukan lagi
  // const [selectedAirdrop, setSelectedAirdrop] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    try {
      // Mengambil data dari file utilitas
      const allAirdrops = getAllAirdrops();
      setAirdrops(allAirdrops);
    } catch (err) {
      setError("Gagal memuat data airdrop.");
    } finally {
      setLoading(false);
    }
  }, []);

  const filteredAirdrops = useMemo(() => {
    return airdrops
      .filter(airdrop => {
        if (activeFilter === 'all') return true;
        return airdrop.status === activeFilter;
      })
      .filter(airdrop => 
        airdrop.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [airdrops, activeFilter, searchTerm]);

  if (!t) return null;

  // Terjemahan untuk filter
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

        <div className="py-4 px-2 -mx-2">
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                    <FontAwesomeIcon icon={faSearch} className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-500" />
                    <input
                        type="text"
                        placeholder={t.searchPlaceholder || "Cari airdrop..."}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-card border border-white/10 rounded-lg py-2.5 pl-11 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                </div>
                <div className="bg-card border border-white/10 rounded-lg p-1 flex items-center space-x-1 flex-wrap justify-center">
                    {['all', 'active', 'upcoming', 'ended'].map(filter => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeFilter === filter ? 'bg-primary text-white' : 'text-gray-300 hover:bg-white/5'}`}
                        >
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
      
      {/* Modal dihapus dari sini */}
    </>
  );
}
