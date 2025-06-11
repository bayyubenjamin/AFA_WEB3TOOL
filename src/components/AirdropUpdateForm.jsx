// src/components/AirdropUpdateForm.jsx
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlusCircle, faSpinner } from '@fortawesome/free-solid-svg-icons';

export default function AirdropUpdateForm({ airdropId, onUpdateAdded }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [link, setLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Judul tidak boleh kosong.');
      return;
    }
    setLoading(true);
    setError(null);

    const { error: insertError } = await supabase
      .from('AirdropUpdates')
      .insert({
        airdrop_id: airdropId,
        title,
        content,
        link,
      });

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
    } else {
      // Reset form dan panggil callback untuk refresh list
      setTitle('');
      setContent('');
      setLink('');
      if (onUpdateAdded) {
        onUpdateAdded();
      }
    }
  };

  return (
    <div className="my-8 p-6 bg-primary/10 border border-primary/50 rounded-lg">
      <h3 className="text-xl font-bold text-white mb-4">Tambah Update Baru</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="update-title" className="block text-sm font-medium text-gray-300 mb-1">Judul Update</label>
          <input
            id="update-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-dark border border-white/20 rounded-md p-2 text-sm"
            placeholder="Cth: Quest Galxe Minggu ke-3"
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="update-content" className="block text-sm font-medium text-gray-300 mb-1">Konten/Deskripsi (Opsional)</label>
          <textarea
            id="update-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows="3"
            className="w-full bg-dark border border-white/20 rounded-md p-2 text-sm"
            placeholder="Tulis detail atau langkah-langkah di sini..."
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="update-link" className="block text-sm font-medium text-gray-300 mb-1">Link (Opsional)</label>
          <input
            id="update-link"
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="w-full bg-dark border border-white/20 rounded-md p-2 text-sm"
            placeholder="https://galxe.com/..."
            disabled={loading}
          />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="text-right">
          <button type="submit" className="btn-primary px-5 py-2" disabled={loading}>
            {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faPlusCircle} className="mr-2" />}
            Posting Update
          </button>
        </div>
      </form>
    </div>
  );
}
