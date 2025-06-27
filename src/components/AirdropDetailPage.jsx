import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, faCalendarAlt, faInfoCircle, faSpinner, faExclamationTriangle, 
  faClock, faAngleDoubleRight, faBell, faEdit, faTrashAlt, faPlus, faVideo,
  faCoins, faClipboardQuestion 
} from '@fortawesome/free-solid-svg-icons';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import ReactPlayer from 'react-player/youtube';

import { useLanguage } from "../context/LanguageContext";
import { supabase } from '../supabaseClient';
import translationsId from "../translations/id.json";
import translationsEn from "../translations/en.json";

const ADMIN_USER_ID = 'e866df86-3206-4019-890f-01a61b989f15';
const getTranslations = (lang) => (lang === 'id' ? translationsId : translationsEn);

const AirdropUpdateItem = ({ update, isAdmin, airdropSlug, onDelete }) => {
  const navigate = useNavigate();
  const handleEdit = () => navigate(`/airdrops/${airdropSlug}/update/${update.id}`);
  
  const authorName = update.profiles?.username || 'Admin';
  const authorAvatar = update.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${authorName.charAt(0)}&background=2a2a3a&color=fff`;

  return (
    // [EDIT]
    <div className="p-4 bg-black/5 dark:bg-dark rounded-lg relative group border border-black/10 dark:border-transparent">
      {isAdmin && (
        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={handleEdit} className="bg-blue-600 hover:bg-blue-500 text-white w-7 h-7 rounded-md flex items-center justify-center text-xs shadow" title="Edit Update"><FontAwesomeIcon icon={faEdit} /></button>
          <button onClick={() => onDelete(update.id)} className="bg-red-600 hover:bg-red-500 text-white w-7 h-7 rounded-md flex items-center justify-center text-xs shadow" title="Hapus Update"><FontAwesomeIcon icon={faTrashAlt} /></button>
        </div>
      )}
      <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <img src={authorAvatar} alt={authorName} className="w-6 h-6 rounded-full object-cover border-2 border-primary/50" />
            {/* [EDIT] */}
            <span className="text-sm font-semibold text-light-text dark:text-gray-300">{authorName}</span>
          </div>
          {/* [EDIT] */}
          <p className="text-xs text-light-subtle dark:text-gray-500 flex items-center"><FontAwesomeIcon icon={faClock} className="mr-1.5" />{new Date(update.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
      </div>
      
      <h4 className="font-bold text-lg text-primary mt-1 mb-2">{update.title}</h4>
      
      {update.content && (
        <div className="prose prose-sm max-w-none dark:prose-invert text-light-text dark:text-current prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
          <ReactMarkdown
            children={update.content}
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
          />
        </div>
      )}
      {update.video_url && (
        <div className="my-4 aspect-video w-full overflow-hidden rounded-lg shadow-md">
            <ReactPlayer url={update.video_url} width="100%" height="100%" controls={true} />
        </div>
      )}
      {update.link && (<a href={update.link} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs mt-4 inline-block px-4 py-1.5">Kunjungi Link</a>)}
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

      const { data: updatesData, error: updatesError } = await supabase.from('AirdropUpdates').select('*, profiles(username, avatar_url)').eq('airdrop_id', airdropData.id).order('created_at', { ascending: true });
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
  
  const confirmationStyles = {
    'Potential': 'border-yellow-500/50 bg-yellow-500/10 text-yellow-300',
    'Confirmed': 'border-green-500/50 bg-green-500/10 text-green-300'
  };
  const confirmationStyle = confirmationStyles[airdrop.confirmation_status] || 'border-gray-500/50 bg-gray-500/10 text-gray-400';

  return (
    <div className="page-content py-6 md:py-8 max-w-4xl mx-auto">
      <Link to="/airdrops" className="text-sm text-primary hover:underline mb-6 inline-flex items-center">
        <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
        {language === 'id' ? 'Kembali ke Daftar Airdrop' : 'Back to Airdrop List'}
      </Link>
      {/* [EDIT] Menggunakan class .card yang theme-aware */}
      <div className="card rounded-2xl shadow-2xl overflow-hidden">
        <div className="relative w-full h-48 md:h-64 overflow-hidden"><img src={airdrop.image_url} alt={airdrop.title} className="w-full h-full object-cover" onError={(e) => { e.target.src = "https://placehold.co/600x400/0a0a1a/7f5af0?text=AFA"; }} />
          {/* [EDIT] */}
          <div className="absolute inset-0 bg-gradient-to-t from-light-card dark:from-card via-light-card/70 dark:via-card/70 to-transparent"></div>
        </div>
        <div className="p-6 md:p-8">
          <div className={`inline-block text-xs font-bold py-1 px-3 mb-4 rounded-full ${categoryColor}`}>{airdrop.category}</div>
          <div className="flex justify-between items-start gap-4 mb-3">
            {/* [EDIT] */}
            <h1 className="text-3xl md:text-4xl font-bold text-light-text dark:text-white">{airdrop.title}</h1>
            <button onClick={handleScrollToUpdates} className="btn-secondary text-xs px-4 py-2 rounded-lg inline-flex items-center flex-shrink-0 whitespace-nowrap" title="Lihat Aktivitas & Updates">
              <FontAwesomeIcon icon={faBell} className="mr-2" />Check Update
            </button>
          </div>

          {/* [EDIT] Hapus prose-invert dan text-gray-400, tambahkan dark:prose-invert dan text-light-subtle */}
          <div className="prose prose-base max-w-none dark:prose-invert text-light-subtle prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
             <ReactMarkdown
                children={airdrop.description || ''}
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
             />
          </div>

          <div className="mt-6 flex flex-wrap gap-4 text-sm">
            {airdrop.raise_amount && (
              // [EDIT]
              <div className="flex items-center px-3 py-1.5 rounded-full font-semibold text-xs border border-black/10 dark:border-white/20 bg-black/5 dark:bg-white/5 text-light-subtle dark:text-gray-300">
                <FontAwesomeIcon icon={faCoins} className="mr-2 text-yellow-400"/>
                Raise: {airdrop.raise_amount}
              </div>
            )}
            {airdrop.confirmation_status && (
              <div className={`flex items-center px-3 py-1.5 rounded-full font-semibold text-xs ${confirmationStyle}`}>
                <FontAwesomeIcon icon={faClipboardQuestion} className="mr-2"/>
                {airdrop.confirmation_status}
              </div>
            )}
            <div className={`flex items-center px-3 py-1.5 rounded-full font-semibold text-xs ${statusInfo.color}`}><FontAwesomeIcon icon={faInfoCircle} className="mr-2" />{t.modalStatus || 'Status'}: {statusInfo.text}</div>
            {/* [EDIT] */}
            {airdrop.date && (<div className="flex items-center px-3 py-1.5 rounded-full font-semibold text-xs border border-black/10 dark:border-white/20 bg-black/5 dark:bg-white/5 text-light-subtle dark:text-gray-300"><FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />{t.modalEstimated || 'Estimasi'}: {airdrop.date}</div>)}
          </div>
          
          <div className="my-8">
            {/* [EDIT] */}
            <h3 className="text-2xl font-bold text-light-text dark:text-white mb-4 border-b border-black/10 dark:border-white/10 pb-2">{t.modalTutorial || 'Tutorial'}</h3>
            {/* [EDIT] Hapus prose-invert */}
            <div className="prose prose-base max-w-none dark:prose-invert prose-h3:text-primary prose-a:text-primary prose-li:marker:text-primary prose-a:no-underline hover:prose-a:underline">
                <ReactMarkdown
                   children={airdrop.tutorial || ''}
                   remarkPlugins={[remarkGfm]}
                   rehypePlugins={[rehypeRaw]}
                />
            </div>
          </div>

          {airdrop.link && (<div className="my-8 text-center"><a href={airdrop.link} target="_blank" rel="noopener noreferrer" className="btn-primary inline-flex items-center px-8 py-3 rounded-lg text-base">{t.modalLink || 'Kunjungi Halaman Airdrop'}<FontAwesomeIcon icon={faAngleDoubleRight} className="ml-2" /></a></div>)}
          
          {airdrop.video_url && (
            <div className="my-8">
              {/* [EDIT] */}
              <h3 className="text-2xl font-bold text-light-text dark:text-white mb-4 border-b border-black/10 dark:border-white/10 pb-2 flex items-center">
                <FontAwesomeIcon icon={faVideo} className="mr-3 text-primary" />
                Video Tutorial
              </h3>
              <div className="my-4 aspect-video w-full overflow-hidden rounded-xl shadow-lg">
                <ReactPlayer url={airdrop.video_url} width="100%" height="100%" controls={true} />
              </div>
            </div>
          )}

          <div ref={updatesSectionRef} className="my-8">
            {/* [EDIT] */}
            <div className="flex justify-between items-center mb-4 border-b border-black/10 dark:border-white/10 pb-2">
              <h3 className="text-2xl font-bold text-light-text dark:text-white">Aktivitas & Updates</h3>
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
            ) : (<p className="text-center text-light-subtle dark:text-gray-500 py-4">Belum ada update untuk airdrop ini.</p>)}
          </div>
        </div>
      </div>
    </div>
  );
}
