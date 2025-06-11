// src/components/PageAirdrops.jsx - DENGAN FILTER KATEGORI DINAMIS
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faSpinner } from '@fortawesome/free-solid-svg-icons';

import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../supabaseClient';
import translationsId from '../translations/id.json';
import translationsEn from '../translations/en.json';

const getTranslations = (lang) => (lang === 'id' ? translationsId : translationsEn);

export default function PageAirdrops() {
  const { language } = useLanguage();
  const t = getTranslations(language).pageAirdrops;

  const [airdrops, setAirdrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // ===== STATE BARU untuk filter kategori =====
  const [categories, setCategories] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('All');

  useEffect(() => {
    const fetchAirdropsAndCategories = async () => {
      setLoading(true);
      try {
        // Fetch airdrops
        const { data: airdropsData, error: airdropsError } = await supabase
          .from('airdrops')
          .select('*')
          .order('created_at', { ascending: false });
        if (airdropsError) throw airdropsError;
        setAirdrops(airdropsData || []);

        // ===== FETCH DATA KATEGORI dari Supabase =====
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('name')
          .order('name', { ascending: true });
        if (categoriesError) throw categoriesError;
        // Tambahkan "All" ke depan daftar kategori untuk tombol filter
        setCategories(['All', ...categoriesData.map(c => c.name)]);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAirdropsAndCategories();
  }, []);

  // ===== LOGIKA FILTER BARU: Menggabungkan search, status, dan kategori =====
  const filteredAirdrops = airdrops.filter(airdrop => {
    const matchesSearch = airdrop.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || airdrop.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesCategory = categoryFilter === 'All' || airdrop.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusInfo = (status) => {
    const info = {
      active: { text: t.cardStatusActive, color: 'border-green-500/50 bg-green-500/10 text-green-300' },
      upcoming: { text: t.cardStatusUpcoming, color: 'border-blue-500/50 bg-blue-500/10 text-blue-300' },
      ended: { text: t.cardStatusEnded, color: 'border-red-500/50 bg-red-500/10 text-red-300' },
    };
    return info[status] || { text: 'Unknown', color: 'border-gray-500/50 bg-gray-500/10 text-gray-400' };
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Retroactive': 'bg-purple-500/20 text-purple-300',
      'Testnet': 'bg-sky-500/20 text-sky-300',
      'Mainnet': 'bg-emerald-500/20 text-emerald-300',
      'NFT Drop': 'bg-orange-500/20 text-orange-300'
    };
    return colors[category] || 'bg-gray-500/20 text-gray-300';
  };

  return (
    <div className="page-content">
      <h1 className="text-4xl font-bold mb-2">{t.title}</h1>
      <p className="text-gray-400 mb-8">{t.subtitle}</p>

      {/* --- Bagian Filter --- */}
      <div className="mb-6 space-y-4">
        {/* Baris 1: Pencarian */}
        <div className="relative w-full md:w-2/3 lg:w-1/2">
          <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            className="w-full bg-card border border-white/10 rounded-full pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* Baris 2: Filter Kategori (BARU) */}
        <div className="flex flex-wrap items-center gap-2">
           <span className="text-sm font-semibold text-gray-400 mr-2">Kategori:</span>
            {categories.map(category => (
                <button
                    key={category}
                    onClick={() => setCategoryFilter(category)}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-colors duration-200 ${
                        categoryFilter === category
                            ? 'bg-primary text-white shadow-lg'
                            : 'bg-card hover:bg-dark text-gray-300'
                    }`}
                >
                    {category === 'All' ? t.filterAll : category}
                </button>
            ))}
        </div>

        {/* Baris 3: Filter Status (LAMA) */}
        <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-gray-400 mr-2">Status:</span>
            {['All', 'Active', 'Upcoming', 'Ended'].map(status => (
                <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors duration-200 ${
                        statusFilter === status
                            ? 'bg-primary/80 text-white'
                            : 'bg-card hover:bg-dark text-gray-300'
                    }`}
                >
                    {t[`filter${status}`]}
                </button>
            ))}
        </div>
      </div>

      {/* --- Daftar Airdrop --- */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-primary" />
        </div>
      ) : error ? (
        <p className="text-center text-red-400">Error: {error}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAirdrops.map(airdrop => (
            <Link to={`/airdrops/${airdrop.slug}`} key={airdrop.id} className="airdrop-card bg-card border border-white/10 rounded-2xl overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 shadow-lg hover:shadow-primary/20">
              <div className="relative h-40">
                <img src={airdrop.image_url} alt={airdrop.title} className="w-full h-full object-cover" />
                <div className={`absolute top-3 right-3 text-xs font-bold py-1 px-3 rounded-full ${getCategoryColor(airdrop.category)}`}>
                  {airdrop.category}
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-xl font-bold truncate text-white">{airdrop.title}</h3>
                <div className="flex justify-between items-center mt-4">
                  <div className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusInfo(airdrop.status).color}`}>
                    {getStatusInfo(airdrop.status).text}
                  </div>
                  {airdrop.date && <p className="text-xs text-gray-400">{airdrop.date}</p>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pesan jika tidak ada hasil */}
      {!loading && filteredAirdrops.length === 0 && (
        <div className="text-center py-16">
          <p className="text-xl font-semibold text-gray-400">{t.noResultsTitle}</p>
          <p className="text-gray-500 mt-2">{t.noResultsSubtitle}</p>
        </div>
      )}
    </div>
  );
}
