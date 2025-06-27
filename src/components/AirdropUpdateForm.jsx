import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlusCircle, faSave, faSpinner } from '@fortawesome/free-solid-svg-icons';

export default function AirdropUpdateForm({ airdropId, onUpdateAdded, initialData, onCancelEdit }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [link, setLink] = useState('');
  const [videoUrl, setVideoUrl] = useState(''); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isEditing = !!initialData;

  useEffect(() => {
    if (isEditing) {
      setTitle(initialData.title || '');
      setContent(initialData.content || '');
      setLink(initialData.link || '');
      setVideoUrl(initialData.video_url || ''); 
    } else {
      setTitle('');
      setContent('');
      setLink('');
      setVideoUrl('');
    }
  }, [initialData, isEditing]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Judul tidak boleh kosong.');
      return;
    }
    setLoading(true);
    setError(null);

    const dataToSubmit = { title, content, link, video_url: videoUrl };

    let result;
    if (isEditing) {
      result = await supabase
        .from('AirdropUpdates')
        .update(dataToSubmit)
        .eq('id', initialData.id);
    } else {
      result = await supabase
        .from('AirdropUpdates')
        .insert({ ...dataToSubmit, airdrop_id: airdropId });
    }

    setLoading(false);

    if (result.error) {
      setError(result.error.message);
    } else {
      if (onUpdateAdded) {
        onUpdateAdded();
      }
    }
  };
  
  const formInputClass = "w-full bg-light-bg dark:bg-dark-bg border border-black/20 dark:border-white/20 rounded-md p-2 text-sm text-light-text dark:text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary";
  const formLabelClass = "block text-sm font-medium text-light-subtle dark:text-gray-300 mb-1";

  return (
    <div className="my-8 p-6 bg-primary/10 border border-primary/50 rounded-lg">
      <h3 className="text-xl font-bold text-light-text dark:text-white mb-4">
        {isEditing ? `Edit Update: "${initialData.title}"` : 'Tambah Update Baru'}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="update-title" className={formLabelClass}>Judul Update</label>
          <input id="update-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={formInputClass} placeholder="Cth: Quest Galxe Minggu ke-3" disabled={loading} required/>
        </div>
        <div>
          <label htmlFor="update-content" className={formLabelClass}>Konten/Deskripsi (Opsional)</label>
          <textarea id="update-content" value={content} onChange={(e) => setContent(e.target.value)} rows="3" className={formInputClass} placeholder="Tulis detail atau langkah-langkah di sini..." disabled={loading}/>
        </div>
        <div>
          <label htmlFor="update-link" className={formLabelClass}>Link Eksternal (Opsional)</label>
          <input id="update-link" type="url" value={link} onChange={(e) => setLink(e.target.value)} className={formInputClass} placeholder="https://galxe.com/..." disabled={loading}/>
        </div>
        <div>
          <label htmlFor="update-video-url" className={formLabelClass}>Link Video (Opsional)</label>
          <input id="update-video-url" type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} className={formInputClass} placeholder="https://www.youtube.com/watch?v=XXXXXXXXXXX..." disabled={loading}/>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="text-right flex justify-end gap-3">
          {isEditing && (
            <button type="button" onClick={onCancelEdit} disabled={loading} className="btn-secondary px-5 py-2">
              Batal
            </button>
          )}
          <button type="submit" className="btn-primary px-5 py-2" disabled={loading}>
            {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={isEditing ? faSave : faPlusCircle} className="mr-2" />}
            {isEditing ? 'Simpan Perubahan' : 'Posting Update'}
          </button>
        </div>
      </form>
    </div>
  );
}
