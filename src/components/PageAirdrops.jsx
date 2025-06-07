// src/components/PageAirdrops.jsx

import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStar, faGift, faPlus, faEdit, faTrashAlt,
  faCalendarAlt, faLink, faInfoCircle, faCheckCircle, faTimesCircle, faClock, faAngleDoubleRight, faCodeBranch,
  faTools, faHourglassHalf, faRocket, faBell, faSpinner
} from "@fortawesome/free-solid-svg-icons";
import { faTelegramPlane, faDiscord, faTwitter } from "@fortawesome/free-brands-svg-icons";
import { useLanguage } from "../context/LanguageContext";
import translationsId from "../translations/id.json";
import translationsEn from "../translations/en.json";

// Fungsi untuk mendapatkan objek terjemahan berdasarkan bahasa yang dipilih
const getTranslations = (lang) => {
  return lang === 'id' ? translationsId : translationsEn;
};

// ====================================================================
// Komponen untuk menampilkan satu kartu Airdrop
// ====================================================================
const AirdropCard = ({ airdrop, isAdminMode, onEdit, onDelete, onShowDetail, language }) => {
  // PERBAIKAN: Menggunakan pageAirdrops dan optional chaining (?.) untuk keamanan
  const t = getTranslations(language)?.pageAirdrops;

  // Jika terjemahan belum siap, jangan render apa-apa
  if (!t) return null;

  const statusColor = {
    'active': 'bg-green-500/20 text-green-300',
    'upcoming': 'bg-blue-500/20 text-blue-300',
    'ended': 'bg-red-500/20 text-red-300'
  }[airdrop.status] || 'bg-gray-500/20 text-gray-300';

  const statusText = {
    'active': t.cardStatusActive,
    'upcoming': t.cardStatusUpcoming,
    'ended': t.cardStatusEnded
  }[airdrop.status] || 'Unknown';

  // Menggunakan kunci terjemahan dari data airdrop
  const description = airdrop.descriptionKey ? t[airdrop.descriptionKey] : airdrop.description;

  return (
    <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden flex flex-col h-full">
      {airdrop.image_url && (
        <img
          src={airdrop.image_url}
          alt={airdrop.title}
          className="w-full h-40 object-cover"
          onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/400x160/2d2d2d/ffffff?text=Image+Not+Found"; }}
        />
      )}
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-xl font-semibold text-white mb-2">{airdrop.title}</h3>
        <p className="text-gray-300 text-sm mb-4 flex-grow">{description}</p>
        <div className="flex flex-wrap gap-2 text-xs font-medium mb-4">
          <span className={`px-2.5 py-1 rounded-full ${statusColor}`}>
            <FontAwesomeIcon icon={faInfoCircle} className="mr-1" /> {statusText}
          </span>
          {airdrop.date && (
            <span className="px-2.5 py-1 rounded-full bg-gray-600/20 text-gray-400">
              <FontAwesomeIcon icon={faCalendarAlt} className="mr-1" /> {t.cardDate}: {airdrop.date}
            </span>
          )}
        </div>
        <button
          onClick={() => onShowDetail(airdrop)}
          className="btn-primary w-full text-center py-2 rounded-lg font-semibold mt-auto"
        >
          <FontAwesomeIcon icon={faAngleDoubleRight} className="mr-2" /> {t.cardDetailCta}
        </button>
        {isAdminMode && (
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => onEdit(airdrop)}
              className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md transition-colors duration-200"
              title={t.editAirdrop}
            >
              <FontAwesomeIcon icon={faEdit} />
            </button>
            <button
              onClick={() => onDelete(airdrop.id)}
              className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-md transition-colors duration-200"
              title={t.deleteAirdrop}
            >
              <FontAwesomeIcon icon={faTrashAlt} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ====================================================================
// Komponen Modal Detail Airdrop
// ====================================================================
const AirdropDetailModal = ({ isOpen, onClose, airdrop, language }) => {
  // PERBAIKAN: Menggunakan pageAirdrops dan optional chaining (?.) untuk keamanan
  const t = getTranslations(language)?.pageAirdrops;
  
  if (!isOpen || !airdrop || !t) return null;
  
  // Menggunakan kunci terjemahan dari data airdrop
  const description = airdrop.descriptionKey ? t[airdrop.descriptionKey] : airdrop.description;
  const tutorial = airdrop.tutorialKey ? t[airdrop.tutorialKey] : airdrop.tutorial;

  const renderTutorialContent = () => {
    if (!tutorial) return <p className="text-gray-400 italic">{t.modalNoTutorial}</p>;
    return (
      <div
        className="prose prose-invert max-w-none text-gray-200"
        dangerouslySetInnerHTML={{ __html: tutorial }}
      />
    );
  };

  const statusText = {
    'active': t.cardStatusActive,
    'upcoming': t.cardStatusUpcoming,
    'ended': t.cardStatusEnded
  }[airdrop.status] || 'Unknown';

  return (
    <div className="fixed top-0 left-0 w-screen h-screen bg-black bg-opacity-95 flex flex-col justify-center items-center z-[9999]">
      <div className="relative bg-gray-800 text-gray-100 rounded-lg shadow-2xl w-full h-full max-w-screen-lg max-h-full m-4 overflow-hidden flex flex-col">
        <div className="modal-header border-b border-gray-700 p-4 flex-shrink-0">
          <h3 className="modal-title text-2xl font-semibold text-white">{airdrop.title}</h3>
          <button className="modal-close-btn text-gray-400 hover:text-white transition-colors duration-200" onClick={onClose}>&times;</button>
        </div>

        <div className="p-4 flex-grow overflow-y-auto">
          {airdrop.image_url && (
            <img
              src={airdrop.image_url}
              alt={airdrop.title}
              className="w-full h-auto max-h-56 object-cover rounded-md mb-6"
              onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/800x200/2d2d2d/ffffff?text=Image+Not+Found"; }}
            />
          )}

          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-300 mb-2">{t.modalDescription}</h4>
            <p className="text-gray-300 text-base">{description || t.noDescription}</p>
          </div>

          <div className="flex flex-wrap gap-4 mb-6">
            <div className="text-sm font-medium text-gray-300">
              <FontAwesomeIcon icon={faLink} className="mr-2 text-purple-400" />
              <a href={airdrop.link} target="_blank" rel="noopener noreferrer" className="hover:underline text-purple-300">{t.modalLink}</a>
            </div>
            {airdrop.date && (
                <div className="text-sm font-medium text-gray-300">
                    <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-blue-400" />
                    {t.modalEstimated}: {airdrop.date}
                </div>
            )}
            <div className="text-sm font-medium text-gray-300">
                <FontAwesomeIcon icon={faInfoCircle} className="mr-2 text-green-400" />
                {t.modalStatus}: {statusText}
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-300 mb-2 flex items-center">
                <FontAwesomeIcon icon={faCodeBranch} className="mr-2 text-orange-400" /> {t.modalTutorial}
            </h4>
            {renderTutorialContent()}
          </div>
        </div>

        <div className="modal-footer flex-shrink-0 flex justify-end p-4 border-t border-gray-700">
          <button type="button" onClick={onClose} className="btn-secondary px-5 py-2.5 rounded-md font-semibold">{t.modalClose}</button>
        </div>
      </div>
    </div>
  );
};


// ====================================================================
// Komponen Utama Halaman Airdrops
// ====================================================================
export default function PageAirdrops({ currentUser }) {
  const { language } = useLanguage();
  // PERBAIKAN 1: Menggunakan 'pageAirdrops' yang benar dan optional chaining (?.)
  const t = getTranslations(language)?.pageAirdrops;

  const [airdrops, setAirdrops] = useState([]);
  const [loading, setLoading] = useState(true); // State untuk loading
  const [error, setError] = useState(null); // State untuk error

  // PENINGKATAN: Simulasi pengambilan data dari API
  useEffect(() => {
    const fetchAirdrops = async () => {
      setLoading(true);
      setError(null);
      try {
        // --- GANTI BAGIAN INI DENGAN API CALL ANDA (misal: dari Supabase) ---
        // Simulasi delay 1 detik
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Data dummy (seperti yang Anda punya sebelumnya)
        // PENINGKATAN: Gunakan kunci terjemahan, bukan hardcode string bahasa
        const mockData = [
          {
            id: 1,
            title: "ZK Sync Era Mainnet Airdrop",
            descriptionKey: "zkSyncDescription", // Kunci untuk file JSON
            link: "https://zksync.io/",
            type: "free",
            status: "active",
            image_url: "https://www.cryptoblogs.io/wp-content/uploads/2024/06/What-is-zkSync.jpg",
            date: "Q3 2024",
            tutorialKey: "zkSyncTutorial" // Kunci untuk file JSON
          },
          {
            id: 2,
            title: "LayerZero Airdrop",
            descriptionKey: "layerZeroDescription",
            link: "https://layerzero.network/",
            type: "premium",
            status: "upcoming",
            image_url: "https://cdn.betakit.com/wp-content/uploads/2023/04/LayerZero-Labs-770x513.jpg",
            date: "Q4 2024",
            tutorialKey: "layerZeroTutorial"
          }
        ];
        // --- AKHIR BAGIAN YANG PERLU DIGANTI ---

        setAirdrops(mockData);
      } catch (err) {
        console.error("Failed to fetch airdrops:", err);
        setError("Gagal memuat data airdrop. Silakan coba lagi nanti."); // Pesan error
      } finally {
        setLoading(false); // Selesai loading
      }
    };

    fetchAirdrops();
  }, []); // Dijalankan sekali saat komponen dimuat

  // Sisa state tetap sama
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [editingAirdrop, setEditingAirdrop] = useState(null);
  const [showingDetailAirdrop, setShowingDetailAirdrop] = useState(null);

  useEffect(() => {
    const isCurrentUserAdmin = currentUser?.id === "admin_user_id_mock";
    setIsAdminMode(isCurrentUserAdmin);
  }, [currentUser]);

  const handleShowDetail = (airdrop) => {
    setShowingDetailAirdrop(airdrop);
    document.body.style.overflow = 'hidden';
  };

  const handleCloseDetailModal = () => {
    setShowingDetailAirdrop(null);
    document.body.style.overflow = '';
  };

  // Tampilkan pesan Loading
  if (loading) {
    return (
      <div className="page-content flex justify-center items-center h-64">
          <FontAwesomeIcon icon={faSpinner} className="text-purple-400 text-4xl animate-spin" />
          <span className="ml-4 text-xl text-gray-300">{t?.loadingText || "Memuat..."}</span>
      </div>
    );
  }

  // Tampilkan pesan Error
  if (error) {
      return (
          <div className="page-content flex justify-center items-center h-64 text-center text-red-400">
              <p>{error}</p>
          </div>
      );
  }

  // Jika tidak ada terjemahan (kasus langka), jangan render apa-apa
  if (!t) {
    return null;
  }
  
  return (
    <section id="airdrops" className="page-content space-y-8 pt-6">
      {/* Bagian "Coming Soon" */}
      <div className="card rounded-xl p-6 md:p-10 bg-gray-800 border border-gray-700 shadow-xl max-w-2xl mx-auto flex flex-col items-center justify-center text-center">
        <FontAwesomeIcon icon={faTools} className="text-primary text-6xl mb-6 animate-pulse" />
        <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight">
          {t.comingSoonTitle}
        </h2>
        <p className="text-gray-300 text-lg md:text-xl mb-8">
          {t.comingSoonText}
        </p>
        <div className="bg-purple-600/20 border border-purple-500 text-purple-300 px-6 py-4 rounded-lg relative mb-8 flex items-center justify-center text-lg w-full">
          <FontAwesomeIcon icon={faHourglassHalf} className="mr-3 text-purple-400" />
          <strong className="font-bold">{t.statusInProgress}:</strong> <span className="ml-2">{t.statusInProgress}</span>
        </div>
        <div className="mb-8 w-full">
          <p className="text-gray-300 mb-4 text-base">
            {t.getUpdates}
          </p>
          <a
            href="https://t.me/airdrop4ll"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg text-xl shadow-lg inline-flex items-center justify-center transition-colors duration-200 w-full"
          >
            <FontAwesomeIcon icon={faTelegramPlane} className="mr-3" />
            {t.joinTelegram}
          </a>
        </div>
        <div className="flex space-x-6 text-3xl mb-4">
          <a href="https://twitter.com/airdrop4ll" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition-colors duration-200" title="Twitter">
            <FontAwesomeIcon icon={faTwitter} />
          </a>
          <a href="https://discord.gg/airdrop4ll" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-purple-400 transition-colors duration-200" title="Discord">
            <FontAwesomeIcon icon={faDiscord} />
          </a>
        </div>
        <p className="text-gray-500 text-sm mt-6">
          {t.stayTuned}
        </p>
      </div>

      {/* Bagian Daftar Semua Airdrop */}
      <div className="card rounded-xl p-6 md:p-8">
        <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-primary flex items-center justify-center">
          <FontAwesomeIcon icon={faGift} className="mr-3 text-purple-400" />
          {t.allAirdropsTitle}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {airdrops.map(airdrop => (
            <AirdropCard
              key={airdrop.id}
              airdrop={airdrop}
              isAdminMode={false} // Selalu false untuk tampilan publik
              onShowDetail={handleShowDetail}
              language={language}
            />
          ))}
          {airdrops.length === 0 && (
              <p className="col-span-full text-gray-400 text-center py-4">{t.noAirdropsAvailable}</p>
          )}
        </div>
        
        {/* Info Tambahan */}
        <div className="bg-blue-600/20 border border-blue-700 text-blue-300 px-6 py-4 rounded-lg mt-8 text-center">
            <h3 className="text-xl font-semibold mb-3">{t.moreInfoTitle}</h3>
            <p className="text-gray-200 mb-4">
                {t.moreInfoText}
            </p>
            <a
                href="https://t.me/airdrop4ll"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2.5 px-6 rounded-lg text-lg shadow-md inline-flex items-center justify-center transition-colors duration-200"
            >
                <FontAwesomeIcon icon={faTelegramPlane} className="mr-2" />
                {t.joinTelegram}
            </a>
        </div>
      </div>

      {/* Modal Detail */}
      {showingDetailAirdrop && (
        <AirdropDetailModal
          isOpen={!!showingDetailAirdrop}
          onClose={handleCloseDetailModal}
          airdrop={showingDetailAirdrop}
          language={language}
        />
      )}
    </section>
  );
}
