// src/components/AirdropDetailPage.jsx - FINAL DENGAN REACT-MARKDOWN
>>>>>>> 29cff5e (feat: implement react-markdown for video embeds)
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft, faCalendarAlt, faInfoCircle, faSpinner, faExclamationTriangle,
  faClock, faAngleDoubleRight, faBell, faEdit, faTrashAlt, faPlus
} from '@fortawesome/free-solid-svg-icons';
<<<<<<< HEAD
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkHtml from 'remark-html';
=======

// ===== PERUBAHAN: Impor library baru =====
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeVideo from 'rehype-video';
>>>>>>> 29cff5e (feat: implement react-markdown for video embeds)

import { useLanguage } from "../context/LanguageContext";
import { supabase } from '../supabaseClient';
import translationsId from "../translations/id.json";
import translationsEn from "../translations/en.json";

const ADMIN_USER_ID = '9a405075-260e-407b-a7fe-2f05b9bb5766';
const getTranslations = (lang) => (lang === 'id' ? translationsId : translationsEn);

<<<<<<< HEAD
// Komponen untuk merender setiap item update (sudah diperbaiki)
const AirdropUpdateItem = ({ update, isAdmin, airdropSlug, onDelete }) => {
  const navigate = useNavigate();
  const [processedContent, setProcessedContent] = useState('');

  useEffect(() => {
    if (update.content) {
      remark().use(remarkGfm).use(remarkHtml).process(update.content)
        .then(file => {
          setProcessedContent(String(file));
        });
    } else {
      setProcessedContent('');
    }
  }, [update.content]);

  const handleEdit = () => {
    navigate(`/airdrops/${airdropSlug}/update/${update.id}`);
  };
=======
// Komponen untuk merender setiap item update
const AirdropUpdateItem = ({ update, isAdmin, airdropSlug, onDelete }) => {
  const navigate = useNavigate();
  const handleEdit = () => navigate(`/airdrops/${airdropSlug}/update/${update.id}`);
>>>>>>> 29cff5e (feat: implement react-markdown for video embeds)

  return (
    <div className="p-4 bg-dark rounded-lg relative group">
      {isAdmin && (
        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={handleEdit} className="bg-blue-600 hover:bg-blue-500 text-white w-7 h-7 rounded-md flex items-center justify-center text-xs shadow" title="Edit Update">
            <FontAwesomeIcon icon={faEdit} />
          </button>
          <button onClick={() => onDelete(update.id)} className="bg-red-600 hover:bg-red-500 text-white w-7 h-7 rounded-md flex items-center justify-center text-xs shadow" title="Hapus Update">
            <FontAwesomeIcon icon={faTrashAlt} />
          </button>
        </div>
      )}
      <p className="text-sm text-gray-400 mb-1 flex items-center">
        <FontAwesomeIcon icon={faClock} className="mr-2" />
        {new Date(update.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </p>
      <h4 className="font-bold text-lg text-primary">{update.title}</h4>
      
<<<<<<< HEAD
      {/* PERBAIKAN: Menggunakan class 'prose' untuk styling otomatis dari plugin typography */}
      {processedContent && (
        <div
          className="prose prose-sm prose-invert max-w-none prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
          dangerouslySetInnerHTML={{ __html: processedContent }}
        />
=======
      {update.content && (
        <div className="prose prose-sm prose-invert max-w-none prose-a:text-primary prose-a:no-underline hover:prose-a:underline [&>div>iframe]:aspect-video [&>div>iframe]:w-full [&>div>iframe]:rounded-xl [&>div>iframe]:shadow-lg">
          <ReactMarkdown
            children={update.content}
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw, [rehypeVideo, { details: false }]]}
          />
        </div>
>>>>>>> 29cff5e (feat: implement react-markdown for video embeds)
      )}
      
      {update.link && (<a href={update.link} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs mt-3 inline-block px-4 py-1.5">Kunjungi Link</a>)}
    </div>
  );
};

export default function AirdropDetailPage({ currentUser }) {
  const { airdropSlug } = useParams();
  const { language } = useLanguage();
  const t = getTranslations(language).pageAirdrops;

  const [airdrop, setAirdrop] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const updatesSectionRef = useRef(null);
  const isAdmin = currentUser?.id === ADMIN_USER_ID;

  const fetchAirdropAndUpdates = useCallback(async () => {
    if (!airdropSlug) { setLoading(false); setError("Airdrop slug tidak ditemukan di URL."); return; }
    setLoading(true);
    setError(null);
    try {
      const { data: airdropData, error: airdropError } = await supabase.from('airdrops').select('*').eq('slug', airdropSlug).single();
      if (airdropError) throw airdropError;
      setAirdrop(airdropData);
<<<<<<< HEAD
      
      const processMarkdown = async (markdown) => {
        if (!markdown) return '';
        const file = await remark().use(remarkGfm).use(remarkHtml).process(markdown);
        return String(file);
      };

      setProcessedTutorial(await processMarkdown(airdropData.tutorial));
      setProcessedDescription(await processMarkdown(airdropData.description));
=======
>>>>>>> 29cff5e (feat: implement react-markdown for video embeds)

      const { data: updatesData, error: updatesError } = await supabase.from('AirdropUpdates').select('*').eq('airdrop_id', airdropData.id).order('created_at', { ascending: false });
      if (updatesError) throw updatesError;
      setUpdates(updatesData || []);
    } catch (err) { setError(err.message || "Terjadi kesalahan saat mengambil data."); } finally { setLoading(false); }
  }, [airdropSlug]);

  useEffect(() => { fetchAirdropAndUpdates(); }, [fetchAirdropAndUpdates]);

  const handleScrollToUpdates = () => updatesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const handleDeleteUpdate = async (updateId) => {
    if (window.confirm("Anda yakin ingin menghapus update ini? Tindakan ini tidak dapat diurungkan.")) {
      const { error } = await supabase.from('AirdropUpdates').delete().eq('id', updateId);
      if (error) { alert("Gagal menghapus update: " + error.message); }
      else { alert("Update berhasil dihapus."); fetchAirdropAndUpdates(); }
    }
  };

  if (loading) { return <div className="flex justify-center items-center h-full pt-20"><FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-primary" /></div>; }
  if (error || !airdrop) { return <div className="text-center text-red-400 pt-20"><p>{error || "Airdrop tidak ditemukan"}</p></div>; }

  const statusInfo = { active: { text: t.cardStatusActive, color: 'border-green-500/50 bg-green-500/10 text-green-300' }, upcoming: { text: t.cardStatusUpcoming, color: 'border-blue-500/50 bg-blue-500/10 text-blue-300' }, ended: { text: t.cardStatusEnded, color: 'border-red-500/50 bg-red-500/10 text-red-300' }, }[airdrop.status] || { text: 'Unknown', color: 'border-gray-500/50 bg-gray-500/10 text-gray-400' };
  const categoryColor = { 'Retroactive': 'bg-purple-500/20 text-purple-300', 'Testnet': 'bg-sky-500/20 text-sky-300', 'Mainnet': 'bg-emerald-500/20 text-emerald-300', 'NFT Drop': 'bg-orange-500/20 text-orange-300' }[airdrop.category] || 'bg-gray-500/20 text-gray-300';

  return (
    <div className="page-content py-6 md:py-8 max-w-4xl mx-auto">
      <Link to="/airdrops" className="text-sm text-primary hover:underline mb-6 inline-flex items-center">
        <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
        {language === 'id' ? 'Kembali ke Daftar Airdrop' : 'Back to Airdrop List'}
      </Link>
      <div className="bg-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        <div className="relative w-full h-48 md:h-64 overflow-hidden"><img src={airdrop.image_url} alt={airdrop.title} className="w-full h-full object-cover" onError={(e) => { e.target.src = "https://placehold.co/600x400/0a0a1a/7f5af0?text=AFA"; }} />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/70 to-transparent"></div>
        </div>
        <div className="p-6 md:p-8">
          <div className={`inline-block text-xs font-bold py-1 px-3 mb-4 rounded-full ${categoryColor}`}>{airdrop.category}</div>
          <div className="flex justify-between items-start gap-4 mb-3">
            <h1 className="text-3xl md:text-4xl font-bold text-white">{airdrop.title}</h1>
            <button onClick={handleScrollToUpdates} className="btn-secondary text-xs px-4 py-2 rounded-lg inline-flex items-center flex-shrink-0 whitespace-nowrap" title="Lihat Aktivitas & Updates">
              <FontAwesomeIcon icon={faBell} className="mr-2" />Check Update
            </button>
          </div>
          
<<<<<<< HEAD
          <div
            className="prose prose-invert prose-base max-w-none prose-a:text-primary prose-a:no-underline hover:prose-a:underline text-gray-400"
            dangerouslySetInnerHTML={{ __html: processedDescription }}
          />
=======
          <div className="prose prose-base prose-invert max-w-none prose-a:text-primary prose-a:no-underline hover:prose-a:underline text-gray-400 [&>div>iframe]:aspect-video [&>div>iframe]:w-full [&>div>iframe]:rounded-xl [&>div>iframe]:shadow-lg">
             <ReactMarkdown
                children={airdrop.description}
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw, [rehypeVideo, { details: false }]]}
             />
          </div>
>>>>>>> 29cff5e (feat: implement react-markdown for video embeds)

          <div className="mt-6 flex flex-wrap gap-4 text-sm">
            <div className={`flex items-center px-3 py-1.5 rounded-full font-semibold text-xs ${statusInfo.color}`}><FontAwesomeIcon icon={faInfoCircle} className="mr-2" />{t.modalStatus || 'Status'}: {statusInfo.text}</div>
            {airdrop.date && (<div className="flex items-center px-3 py-1.5 rounded-full font-semibold text-xs border border-white/20 bg-white/5 text-gray-300"><FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />{t.modalEstimated || 'Estimasi'}: {airdrop.date}</div>)}
          </div>
          <div className="my-8">
            <h3 className="text-2xl font-bold text-white mb-4 border-b border-white/10 pb-2">{t.modalTutorial || 'Tutorial'}</h3>
<<<<<<< HEAD
            {processedTutorial ? (<div className="prose prose-invert prose-base max-w-none prose-h3:text-primary prose-a:text-primary prose-li:marker:text-primary prose-a:no-underline hover:prose-a:underline" dangerouslySetInnerHTML={{ __html: processedTutorial }} />) : (<p className="text-gray-500">{t.modalNoTutorial || 'Tidak ada tutorial untuk airdrop ini.'}</p>)}
=======
             <div className="prose prose-base prose-invert max-w-none prose-h3:text-primary prose-a:text-primary prose-li:marker:text-primary prose-a:no-underline hover:prose-a:underline [&>div>iframe]:aspect-video [&>div>iframe]:w-full [&>div>iframe]:rounded-xl [&>div>iframe]:shadow-lg">
                <ReactMarkdown
                   children={airdrop.tutorial || ''}
                   remarkPlugins={[remarkGfm]}
                   rehypePlugins={[rehypeRaw, [rehypeVideo, { details: false }]]}
                />
            </div>
>>>>>>> 29cff5e (feat: implement react-markdown for video embeds)
          </div>
          {airdrop.link && (<div className="my-8 text-center"><a href={airdrop.link} target="_blank" rel="noopener noreferrer" className="btn-primary inline-flex items-center px-8 py-3 rounded-lg text-base">{t.modalLink || 'Kunjungi Halaman Airdrop'}<FontAwesomeIcon icon={faAngleDoubleRight} className="ml-2" /></a></div>)}

          <div ref={updatesSectionRef} className="my-8">
            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
              <h3 className="text-2xl font-bold text-white">Aktivitas & Updates</h3>
              {isAdmin && (
                <Link to={`/airdrops/${airdrop.slug}/update`} className="btn-primary text-xs px-3 py-1.5 rounded-md flex items-center">
                  <FontAwesomeIcon icon={faPlus} className="mr-1.5" /> Tambah Update
                </Link>
              )}
            </div>

            {updates.length > 0 ? (
              <div className="space-y-4">
                {updates.map(update => (
                  <AirdropUpdateItem
                    key={update.id}
                    update={update}
                    isAdmin={isAdmin}
                    airdropSlug={airdropSlug}
                    onDelete={handleDeleteUpdate}
                  />
                ))}
              </div>
            ) : (<p className="text-center text-gray-500 py-4">Belum ada update untuk airdrop ini.</p>)}
          </div>
        </div>
      </div>
    </div>
  );
}
