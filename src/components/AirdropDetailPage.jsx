// src/components/AirdropDetailPage.jsx - VERSI FINAL DENGAN FETCH SUPABASE

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faCalendarAlt, faInfoCircle, faAngleDoubleRight, faSpinner, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

import { useLanguage } from "../context/LanguageContext";
import translationsId from "../translations/id.json";
import translationsEn from "../translations/en.json";
// [TAMBAHAN]: Impor Supabase client
import { supabase } from '../supabaseClient';
// [DIHAPUS]: Impor data mock tidak diperlukan lagi
// import { getAirdropBySlug } from '../utils/airdropData';

const getTranslations = (lang) => {
  return lang === 'id' ? translationsId : translationsEn;
};

export default function AirdropDetailPage() {
  const { airdropSlug } = useParams(); // Mengambil slug dari URL
  const { language } = useLanguage();
  const t = getTranslations(language).pageAirdrops;

  const [airdrop, setAirdrop] = useState(null);
  const [loading, setLoading] = useState(true);

  // [DIUBAH]: useEffect sekarang melakukan fetch data langsung ke Supabase
  useEffect(() => {
    const fetchAirdrop = async () => {
        if (!airdropSlug) {
            setLoading(false);
            return;
        };

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('airdrops')      // Nama tabel di Supabase
                .select('*')           // Ambil semua kolom
                .eq('slug', airdropSlug) // Cari yang slug-nya cocok dengan URL
                .single();             // Ambil hanya satu hasil (bukan array)

            if (error) {
                // Jika error bukan karena tidak ada hasil (misal: masalah koneksi), lempar error
                if (error.code !== 'PGRST116') { 
                    throw error;
                }
            }
            
            setAirdrop(data); // `data` akan `null` jika tidak ditemukan, atau berisi objek airdrop

        } catch (err) {
            console.error("Error fetching airdrop detail:", err);
            // Set airdrop ke null jika ada error
            setAirdrop(null);
        } finally {
            setLoading(false);
        }
    }

    fetchAirdrop();
  }, [airdropSlug]); // Dependency tetap airdropSlug

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <FontAwesomeIcon icon={faSpinner} className="text-primary text-4xl animate-spin" />
      </div>
    );
  }

  if (!airdrop) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center text-red-400">
        <FontAwesomeIcon icon={faExclamationTriangle} size="3x" className="mb-4"/>
        <h2 className="text-2xl font-bold text-white mb-2">Airdrop Tidak Ditemukan</h2>
        <p>URL yang kamu masukkan mungkin salah atau airdrop ini sudah tidak ada.</p>
        <Link to="/airdrops" className="btn-secondary mt-6 px-6 py-2">
          Kembali ke Daftar Airdrop
        </Link>
      </div>
    );
  }

  const statusInfo = {
    active: { text: t.cardStatusActive, color: 'text-green-300' },
    upcoming: { text: t.cardStatusUpcoming, color: 'text-blue-300' },
    ended: { text: t.cardStatusEnded, color: 'text-red-300' },
  }[airdrop.status] || { text: 'Unknown', color: 'text-gray-400' };

  return (
    <div className="page-content py-6 md:py-8 max-w-4xl mx-auto">
      <Link to="/airdrops" className="text-sm text-primary hover:underline mb-6 inline-flex items-center">
        <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
        {t.backToList || 'Kembali ke Daftar Airdrop'}
      </Link>

      <div className="bg-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        <img
          src={airdrop.image_url}
          alt={airdrop.title}
          className="w-full h-48 md:h-64 object-cover"
          onError={(e) => { e.target.src = "https://placehold.co/800x400/0a0a1a/7f5af0?text=AFA"; }}
        />
        <div className="p-6 md:p-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{airdrop.title}</h1>
          <p className="text-gray-400 mb-6">{airdrop.description}</p>
          
          <div className="flex flex-wrap gap-x-6 gap-y-3 mb-6 text-sm border-t border-b border-white/10 py-4">
              <span className="flex items-center">
                <FontAwesomeIcon icon={faInfoCircle} className="mr-2 text-primary"/>
                {t.modalStatus} 
                <strong className={`ml-2 font-semibold ${statusInfo.color}`}>{statusInfo.text}</strong>
              </span>
              {airdrop.date && (
                <span className="flex items-center">
                  <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-primary"/>
                  {t.modalEstimated} 
                  <strong className="ml-2 text-white">{airdrop.date}</strong>
                </span>
              )}
          </div>

          <div className="prose prose-invert max-w-none text-gray-300 prose-p:my-2 prose-headings:text-white prose-strong:text-white prose-li:my-1">
            <h3 className="text-xl font-semibold text-white mb-3">Tutorial</h3>
            {airdrop.tutorial ? (
                <div dangerouslySetInnerHTML={{ __html: airdrop.tutorial }} />
            ) : (
                <p className="italic text-gray-500">{t.modalNoTutorial}</p>
            )}
          </div>
          
          <div className="mt-8 pt-6 border-t border-white/10">
            <a href={airdrop.link} target="_blank" rel="noopener noreferrer" className="btn-primary w-full text-center py-3 rounded-lg font-bold flex items-center justify-center text-lg">
                {t.modalLink} <FontAwesomeIcon icon={faAngleDoubleRight} className="ml-2" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
