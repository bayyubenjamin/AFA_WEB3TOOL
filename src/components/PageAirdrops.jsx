// src/components/PageAirdrops.jsx
import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStar, faGift, faPlus, faEdit, faTrashAlt,
  faCalendarAlt, faLink, faInfoCircle, faCheckCircle, faTimesCircle, faClock, faAngleDoubleRight, faCodeBranch,
  faTools, faHourglassHalf, faRocket, faBell
} from "@fortawesome/free-solid-svg-icons";
import { faTelegramPlane, faDiscord, faTwitter } from "@fortawesome/free-brands-svg-icons";
import { useLanguage } from "../context/LanguageContext"; // Import useLanguage
import translationsId from "../translations/id.json"; // Import terjemahan ID
import translationsEn from "../translations/en.json"; // Import terjemahan EN

const getTranslations = (lang) => {
  return lang === 'id' ? translationsId : translationsEn;
};

// Komponen untuk menampilkan satu kartu Airdrop
const AirdropCard = ({ airdrop, isAdminMode, onEdit, onDelete, onShowDetail, language }) => {
  const t = getTranslations(language).airdropsPage; // Menggunakan terjemahan untuk halaman airdrops

  const statusColor = {
    'active': 'bg-green-500/20 text-green-300',
    'upcoming': 'bg-blue-500/20 text-blue-300',
    'ended': 'bg-red-500/20 text-red-300'
  }[airdrop.status] || 'bg-gray-500/20 text-gray-300';

  // PERBAIKAN: Menggunakan kunci terjemahan dari JSON untuk statusText
  const statusText = {
    'active': t.cardStatusActive,
    'upcoming': t.cardStatusUpcoming,
    'ended': t.cardStatusEnded
  }[airdrop.status] || 'Unknown';

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
        <p className="text-gray-300 text-sm mb-4 flex-grow">{airdrop.description}</p>
        <div className="flex flex-wrap gap-2 text-xs font-medium mb-4">
          <span className={`px-2.5 py-1 rounded-full ${statusColor}`}>
            <FontAwesomeIcon icon={faInfoCircle} className="mr-1" /> {statusText}
          </span>
          {airdrop.date && (
            <span className="px-2.5 py-1 rounded-full bg-gray-600/20 text-gray-400">
              <FontAwesomeIcon icon={faCalendarAlt} className="mr-1" /> {t.cardDate}: {airdrop.date} {/* PERBAIKAN: Menggunakan t.cardDate */}
            </span>
          )}
        </div>
        <button
          onClick={() => onShowDetail(airdrop)}
          className="btn-primary w-full text-center py-2 rounded-lg font-semibold mt-auto"
        >
          <FontAwesomeIcon icon={faAngleDoubleRight} className="mr-2" /> {t.cardDetailCta} {/* PERBAIKAN: Menggunakan t.cardDetailCta */}
        </button>
        {isAdminMode && (
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => onEdit(airdrop)}
              className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md transition-colors duration-200"
              title={t.editAirdrop} {/* PERBAIKAN: Menggunakan t.editAirdrop */}
            >
              <FontAwesomeIcon icon={faEdit} />
            </button>
            <button
              onClick={() => onDelete(airdrop.id)}
              className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-md transition-colors duration-200"
              title={t.deleteAirdrop} {/* PERBAIKAN: Menggunakan t.deleteAirdrop */}
            >
              <FontAwesomeIcon icon={faTrashAlt} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Komponen untuk Form Admin Airdrop (Tambah/Edit)
const AdminAirdropForm = ({ airdropToEdit, onSave, onCancel, language }) => {
  const t = getTranslations(language).airdropsPage; // Menggunakan terjemahan untuk halaman airdrops

  const [formData, setFormData] = useState({
    id: airdropToEdit?.id || null,
    title: airdropToEdit?.title || '',
    description: airdropToEdit?.description || '',
    link: airdropToEdit?.link || '',
    type: airdropToEdit?.type || 'free',
    status: airdropToEdit?.status || 'active',
    image_url: airdropToEdit?.image_url || '',
    date: airdropToEdit?.date || '',
    tutorial: airdropToEdit?.tutorial || ''
  });

  useEffect(() => {
    if (airdropToEdit) {
      setFormData({
        id: airdropToEdit.id, title: airdropToEdit.title, description: airdropToEdit.description,
        link: airdropToEdit.link, type: airdropToEdit.type, status: airdropToEdit.status,
        image_url: airdropToEdit.image_url, date: airdropToEdit.date, tutorial: airdropToEdit.tutorial || ''
      });
    } else {
      setFormData({
        id: null, title: '', description: '', link: '',
        type: 'free', status: 'active', image_url: '', date: '', tutorial: ''
      });
    }
  }, [airdropToEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-lg mb-8">
      <h3 className="text-xl font-semibold text-white mb-4">{airdropToEdit ? t.adminFormTitleEdit : t.adminFormTitleAdd}</h3> {/* PERBAIKAN: Menggunakan kunci adminFormTitleEdit/Add */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">{t.adminFormLabelTitle} <span className="text-red-500">*</span></label> {/* PERBAIKAN: Menggunakan adminFormLabelTitle */}
          <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} required className="form-input w-full p-2.5 rounded-md bg-gray-700 border border-gray-600 focus:ring-purple-500 focus:border-purple-500 placeholder-gray-500 text-white"/>
        </div>
        <div>
          <label htmlFor="link" className="block text-sm font-medium text-gray-300 mb-1">{t.adminFormLabelLink} <span className="text-red-500">*</span></label> {/* PERBAIKAN: Menggunakan adminFormLabelLink */}
          <input type="url" id="link" name="link" value={formData.link} onChange={handleChange} required className="form-input w-full p-2.5 rounded-md bg-gray-700 border border-gray-600 focus:ring-purple-500 focus:border-purple-500 placeholder-gray-500 text-white"/>
        </div>
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-1">{t.adminFormLabelType}</label> {/* PERBAIKAN: Menggunakan adminFormLabelType */}
          <select id="type" name="type" value={formData.type} onChange={handleChange} className="form-input w-full p-2.5 rounded-md bg-gray-700 border border-gray-600 focus:ring-purple-500 focus:border-purple-500 text-white appearance-none">
            <option value="free">{t.adminFormOptionFree}</option> {/* PERBAIKAN: Menggunakan adminFormOptionFree */}
            <option value="premium">{t.adminFormOptionPremium}</option> {/* PERBAIKAN: Menggunakan adminFormOptionPremium */}
          </select>
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-1">{t.adminFormLabelStatus}</label> {/* PERBAIKAN: Menggunakan adminFormLabelStatus */}
          <select id="status" name="status" value={formData.status} onChange={handleChange} className="form-input w-full p-2.5 rounded-md bg-gray-700 border border-gray-600 focus:ring-purple-500 focus:border-purple-500 text-white appearance-none">
            <option value="active">{t.adminFormOptionActive}</option> {/* PERBAIKAN: Menggunakan adminFormOptionActive */}
            <option value="upcoming">{t.adminFormOptionUpcoming}</option> {/* PERBAIKAN: Menggunakan adminFormOptionUpcoming */}
            <option value="ended">{t.adminFormOptionEnded}</option> {/* PERBAIKAN: Menggunakan adminFormOptionEnded */}
          </select>
        </div>
        <div className="col-span-1 md:col-span-2">
          <label htmlFor="image_url" className="block text-sm font-medium text-gray-300 mb-1">{t.adminFormLabelImageUrl}</label> {/* PERBAIKAN: Menggunakan adminFormLabelImageUrl */}
          <input type="url" id="image_url" name="image_url" value={formData.image_url} onChange={handleChange} className="form-input w-full p-2.5 rounded-md bg-gray-700 border border-gray-600 focus:ring-purple-500 focus:border-purple-500 placeholder-gray-500 text-white"/>
        </div>
        <div className="col-span-1 md:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">{t.adminFormLabelDescription}</label> {/* PERBAIKAN: Menggunakan adminFormLabelDescription */}
          <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows="3" className="form-input w-full p-2.5 rounded-md bg-gray-700 border border-gray-600 focus:ring-purple-500 focus:border-purple-500 placeholder-gray-500 text-white resize-y"></textarea>
        </div>
        <div className="col-span-1 md:col-span-2">
          <label htmlFor="tutorial" className="block text-sm font-medium text-gray-300 mb-1">{t.adminFormLabelTutorial}</label> {/* PERBAIKAN: Menggunakan adminFormLabelTutorial */}
          <textarea id="tutorial" name="tutorial" value={formData.tutorial} onChange={handleChange} rows="6" className="form-input w-full p-2.5 rounded-md bg-gray-700 border border-gray-600 focus:ring-purple-500 focus:border-purple-500 placeholder-gray-500 text-white resize-y" placeholder={t.adminFormPlaceholderTutorial}></textarea> {/* PERBAIKAN: Menggunakan adminFormPlaceholderTutorial */}
        </div>

        <div className="col-span-1 md:col-span-2 flex justify-end gap-3 mt-4">
          <button type="button" onClick={onCancel} className="btn-secondary px-5 py-2.5 rounded-md font-semibold">{t.adminFormBtnCancel}</button> {/* PERBAIKAN: Menggunakan adminFormBtnCancel */}
          <button type="submit" className="btn-primary px-5 py-2.5 rounded-md font-semibold">{airdropToEdit ? t.adminFormBtnSave : t.adminFormBtnAdd}</button> {/* PERBAIKAN: Menggunakan adminFormBtnSave/Add */}
        </div>
      </form>
    </div>
  );
};

// Komponen Modal Detail Airdrop (Versi Full Layar)
const AirdropDetailModal = ({ isOpen, onClose, airdrop, language }) => {
  const t = getTranslations(language).airdropsPage; // Menggunakan terjemahan untuk halaman airdrops

  if (!isOpen || !airdrop) return null;

  const renderTutorialContent = () => {
    if (!airdrop.tutorial) return <p className="text-gray-400 italic">{t.modalNoTutorial}</p>; // PERBAIKAN: Menggunakan modalNoTutorial
    return (
      <div
        className="prose prose-invert max-w-none text-gray-200"
        dangerouslySetInnerHTML={{ __html: airdrop.tutorial }}
      />
    );
  };

  const statusText = {
    'active': t.cardStatusActive, // Menggunakan terjemahan status kartu
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
            <h4 className="text-lg font-semibold text-gray-300 mb-2">{t.modalDescription}</h4> {/* PERBAIKAN: Menggunakan modalDescription */}
            <p className="text-gray-300 text-base">{airdrop.description || t.noDescription}</p>
          </div>

          <div className="flex flex-wrap gap-4 mb-6">
            <div className="text-sm font-medium text-gray-300">
              <FontAwesomeIcon icon={faLink} className="mr-2 text-purple-400" />
              <a href={airdrop.link} target="_blank" rel="noopener noreferrer" className="hover:underline text-purple-300">{t.modalLink}</a> {/* PERBAIKAN: Menggunakan modalLink */}
            </div>
            {airdrop.date && (
                <div className="text-sm font-medium text-gray-300">
                    <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-blue-400" />
                    {t.modalEstimated}: {airdrop.date} {/* PERBAIKAN: Menggunakan modalEstimated */}
                </div>
            )}
            <div className="text-sm font-medium text-gray-300">
                <FontAwesomeIcon icon={faInfoCircle} className="mr-2 text-green-400" />
                {t.modalStatus}: {statusText} {/* PERBAIKAN: Menggunakan modalStatus */}
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-300 mb-2 flex items-center">
                <FontAwesomeIcon icon={faCodeBranch} className="mr-2 text-orange-400" /> {t.modalTutorial} {/* PERBAIKAN: Menggunakan modalTutorial */}
            </h4>
            {renderTutorialContent()}
          </div>
        </div>

        <div className="modal-footer flex-shrink-0 flex justify-end p-4 border-t border-gray-700">
          <button type="button" onClick={onClose} className="btn-secondary px-5 py-2.5 rounded-md font-semibold">{t.modalClose}</button> {/* PERBAIKAN: Menggunakan modalClose */}
        </div>
      </div>
    </div>
  );
};


export default function PageAirdrops({ currentUser }) {
  const { language } = useLanguage();
  const t = getTranslations(language).airdropsPage; // Menggunakan terjemahan untuk halaman airdrops

  const [airdrops, setAirdrops] = useState([
    {
      id: 1,
      title: "ZK Sync Era Mainnet Airdrop",
      description: language === 'id' ? "Airdrop untuk pengguna awal ZK Sync Era Mainnet. Jangan lewatkan kesempatan ini!" : "Airdrop for early users of ZK Sync Era Mainnet. Don't miss this opportunity!",
      link: "https://zksync.io/",
      type: "free",
      status: "active",
      image_url: "https://www.cryptoblogs.io/wp-content/uploads/2024/06/What-is-zkSync.jpg",
      date: "Q3 2024",
      tutorial: language === 'id' ? "<p><b>Langkah 1:</b> Bridge ETH ke ZK Sync Era menggunakan <a href='https://portal.zksync.io/bridge' target='_blank'>jembatan resmi</a>.</p><p><b>Langkah 2:</b> Lakukan beberapa transaksi (swap, add liquidity) di DEX seperti SyncSwap atau Mute.io.</p><p><b>Langkah 3:</b> Mint NFT atau deploy smart contract (opsional, tapi direkomendasikan).</p>" : "<p><b>Step 1:</b> Bridge ETH to ZK Sync Era using the <a href='https://portal.zksync.io/bridge' target='_blank'>official bridge</a>.</p><p><b>Step 2:</b> Perform several transactions (swap, add liquidity) on DEXs like SyncSwap or Mute.io.</p><p><b>Step 3:</b> Mint an NFT or deploy a smart contract (optional, but recommended).</p>"
    },
    {
      id: 2,
      title: "LayerZero Airdrop",
      description: language === 'id' ? "Airdrop token ZRO untuk pengguna LayerZero yang aktif di berbagai chain. Lakukan bridging dan transaksi omnichain." : "ZRO token airdrop for active LayerZero users across various chains. Perform bridging and omnichain transactions.",
      link: "https://layerzero.network/",
      type: "premium",
      status: "upcoming",
      image_url: "https://cdn.betakit.com/wp-content/uploads/2023/04/LayerZero-Labs-770x513.jpg",
      date: "Q4 2024",
      tutorial: language === 'id' ? "<ul><li>Gunakan Stargate Finance untuk bridge aset antar chain.</li><li>Gunakan aplikasi yang dibangun di atas LayerZero (misal: Radiant Capital, Aptos Bridge).</li><li>Pastikan volume transaksi Anda mencukupi.</li></ul>" : "<ul><li>Use Stargate Finance to bridge assets between chains.</li><li>Use applications built on LayerZero (e.g., Radiant Capital, Aptos Bridge).</li><li>Ensure your transaction volume is sufficient.</li></ul>"
    }
  ]);

  const [isAdminMode, setIsAdminMode] = useState(false);
  const [editingAirdrop, setEditingAirdrop] = useState(null);
  const [showingDetailAirdrop, setShowingDetailAirdrop] = useState(null);

  useEffect(() => {
    const isCurrentUserAdmin = currentUser?.id === "admin_user_id_mock";
    setIsAdminMode(isCurrentUserAdmin);
  }, [currentUser]);

  const handleSaveAirdrop = (airdropData) => {
    if (airdropData.id) {
      setAirdrops(prevAirdrops => prevAirdrops.map(a => a.id === airdropData.id ? airdropData : a));
      console.log("Airdrop updated:", airdropData);
    } else {
      const newId = Math.max(...airdrops.map(a => a.id)) + 1;
      const newAirdrop = { ...airdropData, id: newId };
      setAirdrops(prevAirdrops => [...prevAirdrops, newAirdrop]);
      console.log("New airdrop added:", newAirdrop);
    }
    setEditingAirdrop(null);
  };

  const handleDeleteAirdrop = (id) => {
    if (window.confirm(language === 'id' ? "Apakah Anda yakin ingin menghapus airdrop ini?" : "Are you sure you want to delete this airdrop?")) {
      setAirdrops(prevAirdrops => prevAirdrops.filter(a => a.id !== id));
      console.log("Airdrop deleted:", id);
    }
  };

  const handleEditClick = (airdrop) => {
    setEditingAirdrop(airdrop);
  };

  const handleCancelEdit = () => {
    setEditingAirdrop(null);
  };

  const handleShowDetail = (airdrop) => {
    setShowingDetailAirdrop(airdrop);
    document.body.style.overflow = 'hidden';
  };

  const handleCloseDetailModal = () => {
    setShowingDetailAirdrop(null);
    document.body.style.overflow = '';
  };


  return (
    <section id="airdrops" className="page-content space-y-8 pt-6">

      <div className="card rounded-xl p-6 md:p-10 bg-gray-800 border border-gray-700 shadow-xl max-w-2xl mx-auto flex flex-col items-center justify-center text-center">
        <FontAwesomeIcon icon={faTools} className="text-primary text-6xl mb-6 animate-pulse" />
        <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight">
          {t.comingSoonTitle}
        </h2>
        <p className="text-gray-300 text-lg md:text-xl mb-8">
          {t.comingSoonText} {/* PERBAIKAN: Menggunakan comingSoonText */}
        </p>

        <div className="bg-purple-600/20 border border-purple-500 text-purple-300 px-6 py-4 rounded-lg relative mb-8 flex items-center justify-center text-lg w-full">
          <FontAwesomeIcon icon={faHourglassHalf} className="mr-3 text-purple-400" />
          <strong className="font-bold">{t.statusInProgress}:</strong> <span className="ml-2">{t.statusInProgress}</span> {/* PERBAIKAN: Menggunakan statusInProgress */}
        </div>

        <div className="mb-8 w-full">
          <p className="text-gray-300 mb-4 text-base">
            {t.getUpdates} {/* PERBAIKAN: Menggunakan getUpdates */}
          </p>
          <a
            href="https://t.me/airdrop4ll"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg text-xl shadow-lg inline-flex items-center justify-center transition-colors duration-200 w-full"
          >
            <FontAwesomeIcon icon={faTelegramPlane} className="mr-3" />
            {t.joinTelegram} {/* PERBAIKAN: Menggunakan joinTelegram */}
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
          {t.stayTuned} {/* PERBAIKAN: Menggunakan stayTuned */}
        </p>
      </div>

      {isAdminMode && (
        <div className="admin-controls mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">{t.adminPanelTitle}</h2>
          <button
            onClick={() => setEditingAirdrop({})}
            className="btn-primary flex items-center px-4 py-2 rounded-lg font-semibold text-lg"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" /> {t.addNewAirdrop} {/* PERBAIKAN: Menggunakan addNewAirdrop */}
          </button>

          {editingAirdrop && (
            <AdminAirdropForm
              language={language}
              airdropToEdit={editingAirdrop.id ? editingAirdrop : null}
              onSave={handleSaveAirdrop}
              onCancel={handleCancelEdit}
            />
          )}

          <div className="mt-8">
            <h3 className="text-xl font-semibold text-white mb-4">{t.managedAirdrops}</h3> {/* PERBAIKAN: Menggunakan managedAirdrops */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {airdrops.map(airdrop => (
                <AirdropCard
                  key={airdrop.id}
                  airdrop={airdrop}
                  isAdminMode={true}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteAirdrop}
                  onShowDetail={handleShowDetail}
                  language={language}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="card rounded-xl p-6 md:p-8">
        <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-primary flex items-center justify-center">
          <FontAwesomeIcon icon={faGift} className="mr-3 text-purple-400" />
          {t.allAirdropsTitle} {/* PERBAIKAN: Menggunakan allAirdropsTitle */}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {airdrops.map(airdrop => (
            <AirdropCard
              key={airdrop.id}
              airdrop={airdrop}
              isAdminMode={false}
              onShowDetail={handleShowDetail}
              language={language}
            />
          ))}
          {airdrops.length === 0 && !isAdminMode && (
              <p className="col-span-full text-gray-400 text-center py-4">{t.noAirdropsAvailable}</p>
          )}
        </div>

        <div className="bg-blue-600/20 border border-blue-700 text-blue-300 px-6 py-4 rounded-lg mt-8 text-center">
            <h3 className="text-xl font-semibold mb-3">{t.moreInfoTitle}</h3>
            <p className="text-gray-200 mb-4">
              {t.moreInfoText} {/* PERBAIKAN: Menggunakan moreInfoText */}
            </p>
            <a
              href="https://t.me/airdrop4ll"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2.5 px-6 rounded-lg text-lg shadow-md inline-flex items-center justify-center transition-colors duration-200"
            >
              <FontAwesomeIcon icon={faTelegramPlane} className="mr-2" />
              {t.joinTelegram} {/* PERBAIKAN: Menggunakan joinTelegram */}
            </a>
        </div>
      </div>

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
