// src/components/AirdropDetailPage.jsx - DENGAN POSISI UPDATE DI BAWAH
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faCalendarAlt, faInfoCircle, faSpinner, faExclamationTriangle, faClock, faAngleDoubleRight } from '@fortawesome/free-solid-svg-icons';
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkHtml from 'remark-html';

import { useLanguage } from "../context/LanguageContext";
import translationsId from "../translations/id.json";
import translationsEn from "../translations/en.json";
import { supabase } from '../supabaseClient';

const getTranslations = (lang) => (lang === 'id' ? translationsId : translationsEn);

export default function AirdropDetailPage({ currentUser }) {
  const { airdropSlug } = useParams();
  const { language } = useLanguage();
  const t = getTranslations(language).pageAirdrops;
  const navigate = useNavigate();

  const [airdrop, setAirdrop] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processedTutorial, setProcessedTutorial] = useState('');

  const fetchAirdropAndUpdates = useCallback(async () => {
    if (!airdropSlug) {
      setLoading(false);
      setError("Airdrop slug tidak ditemukan di URL.");
      return;
    }
    setLoading(true);
    try {
      const { data: airdropData, error: airdropError } = await supabase
        .from('airdrops')
        .select('*')
        .eq('slug', airdropSlug)
        .single();

      if (airdropError) throw airdropError;
      
      setAirdrop(airdropData);

      if (airdropData.tutorial) {
        const file = await remark().use(remarkGfm).use(remarkHtml).process(airdropData.tutorial);
        setProcessedTutorial(String(file));
      }

      const { data: updatesData, error: updatesError } = await supabase
        .from('AirdropUpdates')
        .select('*')
        .eq('airdrop_id', airdropData.id)
        .order('created_at', { ascending: false });

      if (updatesError) throw updatesError;
      setUpdates(updatesData || []);

    } catch (err) {
      setError(err.message || "Terjadi kesalahan saat mengambil data.");
    } finally {
      setLoading(false);
    }
  }, [airdropSlug]);

  useEffect(() => {
    fetchAirdropAndUpdates();
  }, [fetchAirdropAndUpdates]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-white pt-20">
        <FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-primary mb-3" />
        <p>Memuat detail airdrop...</p>
      </div>
    );
  }

  if (error || !airdrop) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-red-400 pt-20">
        <FontAwesomeIcon icon={faExclamationTriangle} size="2x" className="mb-3"/>
        <p className="font-semibold">Gagal Memuat Airdrop</p>
        <p className="text-sm max-w-xs">{error}</p>
        <button onClick={() => navigate('/airdrops')} className="btn-secondary mt-6 px-6 py-2">
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
          Kembali ke Daftar Airdrop
        </button>
      </div>
    );
  }

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
    <div className="page-content py-6 md:py-8 max-w-4xl mx-auto">
      <Link to="/airdrops" className="text-sm text-primary hover:underline mb-6 inline-flex items-center">
        <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
        {language === 'id' ? 'Kembali ke Daftar Airdrop' : 'Back to Airdrop List'}
      </Link>

      <div className="bg-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        <div className="relative w-full h-48 md:h-64 overflow-hidden">
          <img src={airdrop.image_url} alt={airdrop.title} className="w-full h-full object-cover" onError={(e) => { e.target.src = "https://placehold.co/600x400/0a0a1a/7f5af0?text=AFA"; }}/>
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/70 to-transparent"></div>
        </div>
        
        <div className="p-6 md:p-8">
            <div className={`inline-block text-xs font-bold py-1 px-3 mb-4 rounded-full ${categoryColor}`}>
              {airdrop.category}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">{airdrop.title}</h1>
            <p className="text-gray-400 leading-relaxed">{airdrop.description}</p>
            
            <div className="mt-6 flex flex-wrap gap-4 text-sm">
                <div className={`flex items-center px-3 py-1.5 rounded-full font-semibold text-xs ${statusInfo.color}`}>
                    <FontAwesomeIcon icon={faInfoCircle} className="mr-2"/>
                    {t.modalStatus || 'Status'}: {statusInfo.text}
                </div>
                {airdrop.date && (
                    <div className="flex items-center px-3 py-1.5 rounded-full font-semibold text-xs border border-white/20 bg-white/5 text-gray-300">
                        <FontAwesomeIcon icon={faCalendarAlt} className="mr-2"/>
                        {t.modalEstimated || 'Estimasi'}: {airdrop.date}
                    </div>
                )}
            </div>

            {/* ============== PERUBAHAN POSISI DIMULAI DI SINI ============== */}

            {/* Bagian Tutorial (sekarang di atas) */}
            <div className="my-8">
              <h3 className="text-2xl font-bold text-white mb-4 border-b border-white/10 pb-2">{t.modalTutorial || 'Tutorial'}</h3>
              {processedTutorial ? (
                  <div
                      className="prose prose-invert prose-sm md:prose-base max-w-none prose-h3:text-primary prose-a:text-primary prose-li:marker:text-primary"
                      dangerouslySetInnerHTML={{ __html: processedTutorial }}
                  />
              ) : (
                  <p className="text-gray-500">{t.modalNoTutorial || 'Tidak ada tutorial untuk airdrop ini.'}</p>
              )}
            </div>
            
            {/* Bagian Aktivitas & Updates (sekarang di bawah) */}
            <div className="my-8">
              <h3 className="text-2xl font-bold text-white mb-4 border-b border-white/10 pb-2">Aktivitas & Updates</h3>
              {updates.length > 0 ? (
                <div className="space-y-4">
                  {updates.map(update => (
                    <div key={update.id} className="p-4 bg-dark rounded-lg">
                      <p className="text-sm text-gray-400 mb-1 flex items-center">
                        <FontAwesomeIcon icon={faClock} className="mr-2" />
                        {new Date(update.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <h4 className="font-bold text-lg text-primary">{update.title}</h4>
                      {update.content && <p className="mt-2 text-gray-300 text-sm whitespace-pre-wrap">{update.content}</p>}
                      {update.link && (
                        <a href={update.link} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs mt-3 inline-block px-4 py-1.5">
                          Kunjungi Link
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">Belum ada update untuk airdrop ini.</p>
              )}
            </div>

            {/* ============================================================= */}
            
            {airdrop.link && (
              <div className="mt-8 text-center">
                <a href={airdrop.link} target="_blank" rel="noopener noreferrer" className="btn-primary inline-flex items-center px-8 py-3 rounded-lg text-base">
                  {t.modalLink || 'Kunjungi Halaman Airdrop'}
                  <FontAwesomeIcon icon={faAngleDoubleRight} className="ml-2" />
                </a>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
