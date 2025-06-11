// src/components/AirdropDetailPage.jsx - VERSI MODIFIKASI
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faCalendarAlt, faInfoCircle, faAngleDoubleRight, faSpinner, faExclamationTriangle, faClock } from '@fortawesome/free-solid-svg-icons';
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkHtml from 'remark-html';

import { useLanguage } from "../context/LanguageContext";
import translationsId from "../translations/id.json";
import translationsEn from "../translations/en.json";
import { supabase } from '../supabaseClient';
import AirdropUpdateForm from './AirdropUpdateForm'; // <-- IMPORT KOMPONEN BARU

const ADMIN_USER_ID = '9a405075-260e-407b-a7fe-2f05b9bb5766'; // <-- ID ADMIN

const getTranslations = (lang) => (lang === 'id' ? translationsId : translationsEn);

export default function AirdropDetailPage({ currentUser }) { // <-- Tambahkan prop currentUser
  const { airdropSlug } = useParams();
  const { language } = useLanguage();
  const t = getTranslations(language).pageAirdrops;

  const [airdrop, setAirdrop] = useState(null);
  const [updates, setUpdates] = useState([]); // <-- State untuk updates
  const [loading, setLoading] = useState(true);
  const [processedTutorial, setProcessedTutorial] = useState('');

  const isAdmin = currentUser?.id === ADMIN_USER_ID; // Cek apakah user admin

  const fetchAirdropAndUpdates = useCallback(async () => {
    if (!airdropSlug) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setAirdrop(null);
    setUpdates([]);

    try {
      // 1. Fetch data airdrop utama berdasarkan slug
      const { data: airdropData, error: airdropError } = await supabase
        .from('airdrops')
        .select('*')
        .eq('slug', airdropSlug)
        .single();

      if (airdropError) throw airdropError;
      
      setAirdrop(airdropData);

      // Proses tutorial dari markdown
      if (airdropData.tutorial) {
        const file = await remark().use(remarkGfm).use(remarkHtml).process(airdropData.tutorial);
        setProcessedTutorial(String(file));
      } else {
        setProcessedTutorial('');
      }

      // 2. Fetch updates yang terkait dengan airdrop ini
      if (airdropData) {
        const { data: updatesData, error: updatesError } = await supabase
          .from('AirdropUpdates')
          .select('*')
          .eq('airdrop_id', airdropData.id)
          .order('created_at', { ascending: false }); // Urutkan dari yang terbaru

        if (updatesError) throw updatesError;
        setUpdates(updatesData || []);
      }

    } catch (err) {
      console.error("Error fetching airdrop detail and updates:", err);
      setAirdrop(null);
    } finally {
      setLoading(false);
    }
  }, [airdropSlug]);

  useEffect(() => {
    fetchAirdropAndUpdates();
  }, [fetchAirdropAndUpdates]);

  // ... (kode loading dan error tidak berubah)
  if (loading) { /* ... */ }
  if (!airdrop) { /* ... */ }

  const statusInfo = { /* ... */ };

  return (
    <div className="page-content py-6 md:py-8 max-w-4xl mx-auto">
      {/* ... Tombol kembali ... */}

      <div className="bg-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* ... Bagian Gambar, Judul, Deskripsi, dan Info Status (tidak berubah) ... */}
        
        <div className="p-6 md:p-8">
            {/* ... Judul, deskripsi, info status ... */}

            {/* Tampilkan form update HANYA untuk admin */}
            {isAdmin && (
              <AirdropUpdateForm 
                airdropId={airdrop.id} 
                onUpdateAdded={fetchAirdropAndUpdates} // panggil fetch ulang setelah update ditambahkan
              />
            )}

            {/* === BAGIAN BARU: DAFTAR UPDATE === */}
            <div className="mt-8">
              <h3 className="text-2xl font-bold text-white mb-4 border-b border-white/10 pb-2">Aktivitas & Updates</h3>
              {updates.length > 0 ? (
                <div className="space-y-4">
                  {updates.map(update => (
                    <div key={update.id} className="p-4 bg-dark rounded-lg">
                      <p className="text-sm text-gray-400 mb-1 flex items-center">
                        <FontAwesomeIcon icon={faClock} className="mr-2" />
                        {new Date(update.created_at).toLocaleString('id-ID')}
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

            {/* ... Bagian Tutorial dan Tombol Kunjungi Halaman (tidak berubah) ... */}
        </div>
      </div>
    </div>
  );
}
