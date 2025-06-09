// src/components/PageAdminAirdrops.jsx

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom"; // Import useNavigate
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch, faSpinner, faExclamationTriangle, faCalendarAlt,
  faPlus, faEdit, faTrash, faShieldHalved, faArrowLeft
} from "@fortawesome/free-solid-svg-icons";

import { useLanguage } from "../context/LanguageContext";
import translationsId from "../translations/id.json";
import translationsEn from "../translations/en.json";
import { supabase } from '../supabaseClient';
import AirdropAdminForm from './AirdropAdminForm';

const ADMIN_USER_ID = '9a405075-260e-407b-a7fe-2f05b9bb5766';

const getTranslations = (lang) => (lang === 'id' ? translationsId : translationsEn);

// AirdropCard with admin controls
const AirdropCard = ({ airdrop, onEdit, onDelete }) => {
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
    <div className="bg-card rounded-2xl group relative h-full flex flex-col border border-white/10 overflow-hidden transition-all duration-300 hover:border-primary hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-1">
        <div className="absolute top-2 right-2 z-30 flex gap-2">
          <button onClick={(e) => { e.preventDefault(); onEdit(airdrop); }} className="bg-blue-500/80 hover:bg-blue-500 text-white w-7 h-7 rounded-full flex items-center justify-center text-xs shadow-lg"><FontAwesomeIcon icon={faEdit} /></button>
          <button onClick={(e) => { e.preventDefault(); onDelete(airdrop); }} className="bg-red-500/80 hover:bg-red-500 text-white w-7 h-7 rounded-full flex items-center justify-center text-xs shadow-lg"><FontAwesomeIcon icon={faTrash} /></button>
        </div>
      <Link to={`/airdrops/${airdrop.slug}`} className="block h-full flex flex-col">
        <div className={`absolute top-0 left-0 text-xs font-bold py-1 px-3 m-3 rounded-full z-20 ${categoryColor}`}>
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
            {airdrop.date && (<span className="text-gray-500 font-medium"><FontAwesomeIcon icon={faCalendarAlt} className="mr-1.5" />{airdrop.date}</span>)}
          </div>
        </div>
      </Link>
    </div>
  );
};


export default function PageAdminAirdrops({ currentUser }) {
  const { language } = useLanguage();
  const t = getTranslations(language).pageAirdrops;
  const navigate = useNavigate();

  const [airdrops, setAirdrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const [showAdminForm, setShowAdminForm] = useState(false);
  const [editingAirdrop, setEditingAirdrop] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const isAdmin = currentUser?.id === ADMIN_USER_ID;

  // Redirect if not admin
  useEffect(() => {
    if (currentUser === null) return; // Wait for user data to load
    if (!isAdmin) {
      navigate('/airdrops');
    }
  }, [currentUser, isAdmin, navigate]);

  const fetchAirdrops = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('airdrops')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setAirdrops(data || []);
    } catch (err) {
      setError(err.message || "Gagal memuat data airdrop.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAirdrops();
  }, [fetchAirdrops]);

  const handleSaveAirdrop = async (formData) => {
    setFormLoading(true);
    try {
      const { id, created_at, ...dataToSave } = formData;
      let error;
      if (editingAirdrop) {
        ({ error } = await supabase.from('airdrops').update(dataToSave).eq('id', editingAirdrop.id));
      } else {
        ({ error } = await supabase.from('airdrops').insert([dataToSave]));
      }
      if (error) throw error;

      setShowAdminForm(false);
      setEditingAirdrop(null);
      await fetchAirdrops();
      alert('Airdrop berhasil disimpan!');
    } catch (err) {
      alert('Gagal menyimpan airdrop: ' + err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (airdrop) => {
    setEditingAirdrop(airdrop);
    setShowAdminForm(true);
  };

  const handleDelete = async (airdrop) => {
    if (window.confirm(`Apakah kamu yakin ingin menghapus "${airdrop.title}"?`)) {
      try {
        const { error } = await supabase.from('airdrops').delete().eq('id', airdrop.id);
        if (error) throw error;
        await fetchAirdrops();
        alert('Airdrop berhasil dihapus!');
      } catch (err) {
        alert('Gagal menghapus airdrop: ' + err.message);
      }
    }
  };

  const filteredAirdrops = useMemo(() => {
    return airdrops
      .filter(airdrop => activeFilter === 'all' || airdrop.status === activeFilter)
      .filter(airdrop => airdrop.title.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [airdrops, activeFilter, searchTerm]);

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full pt-20 text-center text-red-400">
          <FontAwesomeIcon icon={faExclamationTriangle} size="2x" className="mb-3"/>
          <p>You are not authorized to view this page.</p>
          <Link to="/airdrops" className="btn-secondary mt-6 px-6 py-2">
            Back to Airdrops
          </Link>
      </div>
    );
  }

  if (!t) return null;

  const filterTranslations = {
    all: t.filterAll || 'Semua',
    active: t.filterActive || 'Aktif',
    upcoming: t.filterUpcoming || 'Mendatang',
    ended: t.filterEnded || 'Selesai'
  };

  return (
    <>
      <section id="admin-airdrops" className="page-content space-y-8 pt-8">
         <Link to="/airdrops" className="text-sm text-primary hover:underline mb-6 inline-flex items-center">
            <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
            Back to Airdrop List
        </Link>
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold futuristic-text-gradient mb-3 flex items-center justify-center gap-3">
             <FontAwesomeIcon icon={faShieldHalved}/> Admin Panel
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">Manage airdrop posts here.</p>
        </div>

        <div className="text-center">
            <button onClick={() => { setEditingAirdrop(null); setShowAdminForm(true); }} className="btn-primary px-6 py-3 text-base">
              <FontAwesomeIcon icon={faPlus} className="mr-2"/> {t.addNewAirdrop}
            </button>
        </div>

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
                <AirdropCard key={airdrop.id} airdrop={airdrop} onEdit={handleEdit} onDelete={handleDelete} />
              ))
            ) : (
              <p className="col-span-full text-center text-gray-500 py-16">{t.noAirdropsAvailable}</p>
            )}
          </div>
        )}
      </section>

      {showAdminForm && (
        <AirdropAdminForm
          onSave={handleSaveAirdrop}
          onClose={() => { setShowAdminForm(false); setEditingAirdrop(null); }}
          initialData={editingAirdrop}
          loading={formLoading}
        />
      )}
    </>
  );
}
