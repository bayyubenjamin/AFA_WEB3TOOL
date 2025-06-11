// src/components/AirdropUpdateForm.jsx - BISA UNTUK TAMBAH & EDIT DENGAN FIELD GAMBAR
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlusCircle, faSave, faSpinner, faImage } from '@fortawesome/free-solid-svg-icons';

export default function AirdropUpdateForm({ airdropId, onUpdateAdded, initialData, onCancelEdit }) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [link, setLink] = useState('');
    const [imageUrl, setImageUrl] = useState(''); // Field untuk URL gambar
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const isEditing = !!initialData;

    useEffect(() => {
        if (isEditing) {
            setTitle(initialData.title || '');
            setContent(initialData.content || '');
            setLink(initialData.link || '');
            setImageUrl(initialData.image_url || '');
        } else {
            setTitle('');
            setContent('');
            setLink('');
            setImageUrl('');
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

        const updateData = { title, content, link };
        if (imageUrl) {
            updateData.content = `![]( <span class="math-inline">\{imageUrl\} \)\\n</span>{content}`; // Tambahkan URL gambar ke konten dengan Markdown
        }

        let result;
        if (isEditing) {
            result = await supabase
                .from('AirdropUpdates')
                .update(updateData)
                .eq('id', initialData.id);
        } else {
            result = await supabase
                .from('AirdropUpdates')
                .insert({ airdrop_id: airdropId, title, content: updateData.content, link });
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

    return (
        <div className="my-8 p-6 bg-primary/10 border border-primary/50 rounded-lg">
            <h3 className="text-xl font-bold text-white mb-4">
                {isEditing ? `Edit Update: "${initialData.title}"` : 'Tambah Update Baru'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="update-title" className="block text-sm font-medium text-gray-300 mb-1">Judul Update</label>
                    <input id="update-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-dark border border-white/20 rounded-md p-2 text-sm" placeholder="Cth: Quest Galxe Minggu ke-3" disabled={loading} required/>
                </div>
                <div>
                    <label htmlFor="update-image-url" className="block text-sm font-medium text-gray-300 mb-1 flex items-center">
                        <FontAwesomeIcon icon={faImage} className="mr-2" />
                        URL Gambar (Opsional, akan ditampilkan di atas konten)
                    </label>
                    <input id="update-image-url" type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="w-full bg-dark border border-white/20 rounded-md p-2 text-sm" placeholder="https://example.com/image.png" disabled={loading}/>
                </div>
                <div>
                    <label htmlFor="update-content" className="block text-sm font-medium text-gray-300 mb-1">Konten/Deskripsi (Mendukung Markdown)</label>
                    <textarea id="update-content" value={content} onChange={(e) => setContent(e.target.value)} rows="5" className="w-full bg-dark border border-white/20 rounded-md p-2 text-sm" placeholder="Tulis detail atau langkah-langkah di sini. Gunakan Markdown untuk formatting." disabled={loading}/>
                </div>
                <div>
                    <label htmlFor="update-link" className="block text-sm font-medium text-gray-300 mb-1">Link (Opsional)</label>
                    <input id="update-link" type="url" value={link} onChange={(e) => setLink(e.target.value)} className="w-full bg-dark border border-white/20 rounded-md p-2 text-sm" placeholder="https://galxe.com/..." disabled={loading}/>
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
