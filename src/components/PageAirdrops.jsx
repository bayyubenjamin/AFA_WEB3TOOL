// src/components/PageAirdrops.jsx - Versi Desain Ulang Profesional (Diedit untuk non-sticky search)
import React, { useState, useEffect, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGift, faSearch, faAngleDoubleRight, faCodeBranch, faTimes,
  faCalendarAlt, faLink, faInfoCircle, faSpinner, faExclamationTriangle
} from "@fortawesome/free-solid-svg-icons";
import { useLanguage } from "../context/LanguageContext";
import translationsId from "../translations/id.json";
import translationsEn from "../translations/en.json";

const getTranslations = (lang) => {
  return lang === 'id' ? translationsId : translationsEn;
};

// Komponen Card Airdrop
const AirdropCard = ({ airdrop, onShowDetail }) => {
  const { language } = useLanguage();
  const t = getTranslations(language).pageAirdrops;

  if (!t) return null;

  const statusInfo = {
    active: { text: t.cardStatusActive, color: 'border-green-500/50 bg-green-500/10 text-green-300', glow: 'shadow-green-500/50' },
    upcoming: { text: t.cardStatusUpcoming, color: 'border-blue-500/50 bg-blue-500/10 text-blue-300', glow: 'shadow-blue-500/50' },
    ended: { text: t.cardStatusEnded, color: 'border-red-500/50 bg-red-500/10 text-red-300', glow: 'shadow-red-500/50' },
  }[airdrop.status] || { text: 'Unknown', color: 'border-gray-500/50 bg-gray-500/10 text-gray-400', glow: 'shadow-gray-500/50' };

  const categoryColor = {
    'Retroactive': 'bg-purple-500/20 text-purple-300',
    'Testnet': 'bg-sky-500/20 text-sky-300',
    'Mainnet': 'bg-emerald-500/20 text-emerald-300',
    'NFT Drop': 'bg-orange-500/20 text-orange-300'
  }[airdrop.category] || 'bg-gray-500/20 text-gray-300';

  return (
    <div
      onClick={() => onShowDetail(airdrop)}
      className="bg-card rounded-2xl group relative overflow-hidden cursor-pointer border border-white/10 transition-all duration-300 hover:border-primary hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-1"
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
      <div className="p-5">
        <h3 className="text-xl font-bold text-white mb-2 truncate group-hover:text-primary transition-colors">{airdrop.title}</h3>
        <p className="text-gray-400 text-sm mb-4 h-10 overflow-hidden text-ellipsis">
          {airdrop.descriptionKey ? t[airdrop.descriptionKey] : airdrop.description}
        </p>
        <div className="flex justify-between items-center text-xs">
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
  );
};

// Komponen Modal Detail yang Didesain Ulang
const AirdropDetailModal = ({ isOpen, onClose, airdrop }) => {
  const { language } = useLanguage();
  const t = getTranslations(language).pageAirdrops;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto' };
  }, [isOpen]);

  if (!isOpen || !airdrop || !t) return null;

  const description = airdrop.descriptionKey ? t[airdrop.descriptionKey] : airdrop.description;
  const tutorial = airdrop.tutorialKey ? t[airdrop.tutorialKey] : airdrop.tutorial;

  return (
    <div className="fixed inset-0 bg-dark/80 backdrop-blur-md flex items-center justify-center p-4 z-[100] transition-opacity duration-300 animate-fade-in">
      <div className="bg-card border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-white transition-colors z-20 bg-dark/50 rounded-full w-8 h-8 flex items-center justify-center">
            <FontAwesomeIcon icon={faTimes} />
        </button>
        <div className="p-6 overflow-y-auto">
          <h2 className="text-3xl font-bold text-white mb-2">{airdrop.title}</h2>
          <p className="text-gray-400 mb-6">{description}</p>
          <div className="flex flex-wrap gap-4 mb-6 text-sm">
              <span className="flex items-center"><FontAwesomeIcon icon={faInfoCircle} className="mr-2 text-primary"/>{t.modalStatus} <strong className="ml-2 text-white">{t[`cardStatus${airdrop.status.charAt(0).toUpperCase() + airdrop.status.slice(1)}`]}</strong></span>
              {airdrop.date && <span className="flex items-center"><FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-primary"/>{t.modalEstimated} <strong className="ml-2 text-white">{airdrop.date}</strong></span>}
          </div>
          <div className="prose prose-invert max-w-none text-gray-300 prose-p:my-2 prose-headings:text-white prose-strong:text-white">
            <h3 className="flex items-center"><FontAwesomeIcon icon={faCodeBranch} className="mr-2 text-primary"/> {t.modalTutorial}</h3>
            {tutorial ? <div dangerouslySetInnerHTML={{ __html: tutorial }} /> : <p className="italic text-gray-500">{t.modalNoTutorial}</p>}
          </div>
        </div>
        <div className="p-6 border-t border-white/10 mt-auto">
            <a href={airdrop.link} target="_blank" rel="noopener noreferrer" className="btn-primary w-full text-center py-3 rounded-lg font-bold flex items-center justify-center">
                {t.modalLink} <FontAwesomeIcon icon={faAngleDoubleRight} className="ml-2" />
            </a>
        </div>
      </div>
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
  const [selectedAirdrop, setSelectedAirdrop] = useState(null);

  useEffect(() => {
    const fetchAirdrops = async () => {
      setLoading(true);
      setError(null);
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        const mockData = [
          { id: 1, title: "ZK Sync Era Mainnet Airdrop", descriptionKey: "zkSyncDescription", link: "https://zksync.io/", category: "Testnet", status: "active", image_url: "https://www.cryptoblogs.io/wp-content/uploads/2024/06/What-is-zkSync.jpg", date: "Q3 2024", tutorialKey: "zkSyncTutorial" },
          { id: 2, title: "LayerZero Airdrop", descriptionKey: "layerZeroDescription", link: "https://layerzero.network/", category: "Retroactive", status: "upcoming", image_url: "https://cdn.betakit.com/wp-content/uploads/2023/04/LayerZero-Labs-770x513.jpg", date: "Q4 2024", tutorialKey: "layerZeroTutorial" },
          { id: 3, title: "StarkNet DeFi Expansion", descriptionKey: "zkSyncDescription", link: "https://starknet.io/", category: "Mainnet", status: "active", image_url: "https://pbs.twimg.com/profile_images/1762125355938926592/2i3e25da_400x400.jpg", date: "Q3 2024", tutorialKey: "layerZeroTutorial" },
          { id: 4, title: "Scroll Origins NFT Drop", descriptionKey: "layerZeroDescription", link: "https://scroll.io/", category: "NFT Drop", status: "ended", image_url: "https://pbs.twimg.com/profile_images/1696531399317917696/2T3p4N__400x400.jpg", date: "Q2 2024", tutorialKey: "zkSyncTutorial" }
        ];
        setAirdrops(mockData);
      } catch (err) {
        setError("Gagal memuat data airdrop.");
      } finally {
        setLoading(false);
      }
    };
    fetchAirdrops();
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

  return (
    <>
      <section id="airdrops" className="page-content space-y-8 pt-8">
        {/* Header Halaman */}
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold futuristic-text-gradient mb-3">{t.allAirdropsTitle}</h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">{t.getUpdates}</p>
        </div>

        {/* --- PERUBAHAN DI SINI --- */}
        {/* Filter dan Pencarian - Dibuat menjadi static (tidak sticky) */}
        {/* Kelas `sticky`, `top-[...]`, `bg-dark/80`, `backdrop-blur-lg`, `z-30` dihapus */}
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
                <div className="bg-card border border-white/10 rounded-lg p-1 flex items-center space-x-1">
                    {['all', 'active', 'upcoming', 'ended'].map(filter => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeFilter === filter ? 'bg-primary text-white' : 'text-gray-300 hover:bg-white/5'}`}
                        >
                            {t[`filter${filter.charAt(0).toUpperCase() + filter.slice(1)}`] || filter}
                        </button>
                    ))}
                </div>
            </div>
        </div>
        {/* --- AKHIR PERUBAHAN --- */}

        {/* Daftar Airdrop */}
        {loading ? (
          <div className="flex justify-center items-center h-64"><FontAwesomeIcon icon={faSpinner} className="text-primary text-4xl animate-spin" /></div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 text-red-400"><FontAwesomeIcon icon={faExclamationTriangle} size="2x" className="mb-3"/><p>{error}</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {filteredAirdrops.length > 0 ? (
              filteredAirdrops.map(airdrop => (
                <AirdropCard key={airdrop.id} airdrop={airdrop} onShowDetail={setSelectedAirdrop} />
              ))
            ) : (
              <p className="col-span-full text-center text-gray-500 py-16">{t.noAirdropsAvailable}</p>
            )}
          </div>
        )}
      </section>

      <AirdropDetailModal 
        isOpen={!!selectedAirdrop}
        onClose={() => setSelectedAirdrop(null)}
        airdrop={selectedAirdrop}
      />
    </>
  );
}
