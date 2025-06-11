// src/components/AirdropAdminForm.jsx - VERSI PERBAIKAN FINAL
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import translationsId from "../translations/id.json";
import translationsEn from "../translations/en.json";
import { supabase } from '../supabaseClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faSpinner, faTimes, faSave, faClock, faTrash } from '@fortawesome/free-solid-svg-icons';
import AirdropUpdateForm from './AirdropUpdateForm';

const getTranslations = (lang) => (lang === 'id' ? translationsId : translationsEn);

export default function AirdropAdminForm({ onSave, onClose, initialData = null, loading }) {
  const { language } = useLanguage();
  const t = getTranslations(language).pageAirdrops;

  const [formData, setFormData] = useState({
    title: '', slug: '', description: '', link: '', image_url: '',
    category: 'Testnet', status: 'upcoming', tutorial: '', date: ''
  });
  const [updates, setUpdates] = useState([]);
  const [loadingUpdates, setLoadingUpdates] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const tutorialTextareaRef = useRef(null);
  
  const isEditing = !!initialData;

  const fetchUpdates = useCallback(async () => {
    if (!initialData?.id) return;
    setLoadingUpdates(true);
    const { data, error } = await supabase
      .from('AirdropUpdates')
      .select('*')
      .eq('airdrop_id', initialData.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching updates:", error);
      alert("Gagal memuat daftar update.");
    } else {
      setUpdates(data || []);
    }
    setLoadingUpdates(false);
  }, [initialData?.id]);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      fetchUpdates();
    }
  }, [initialData, fetchUpdates]);
  
  const handleDeleteUpdate = async (updateId) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus update ini?")) return;
    
    const { error } = await supabase
      .from('AirdropUpdates')
      .delete()
      .eq('id', updateId);

    if (error) {
      alert("Gagal menghapus update: " + error.message);
    } else {
      alert("Update berhasil dihapus.");
      fetchUpdates();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newSlug = formData.slug;
    if (name === 'title' && !initialData) {
      newSlug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }
    setFormData(prev => ({ ...prev, [name]: value, ...(name === 'title' && { slug: newSlug }) }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.slug) {
      alert('Judul dan Slug wajib diisi!');
      return;
    }
    onSave(formData);
  };

  const handleImageUpload = async (event) => {
    try {
      setUploading(true);
      setUploadError(null);

      const file = event.target.files[0];
      if (!file) throw new Error("Kamu tidak memilih file untuk di-upload.");
      
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `public/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('tutorial-images').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('tutorial-images').getPublicUrl(filePath);
      const markdownLink = `![${file.name}](${publicUrl})\n`;
      const newTutorialText = formData.tutorial + (formData.tutorial ? '\n' : '') + markdownLink;
      
      setFormData(prev => ({ ...prev, tutorial: newTutorialText }));
      
    } catch (error) {
      setUploadError(error.message);
    } finally {
      setUploading(false);
      event.target.value = null; 
    }
  };

  const formTitle = initialData ? t.adminFormTitleEdit : t.adminFormTitleAdd;

  return (
    <div className="bg-card border border-white/10 rounded-2xl shadow-2xl w-full max-w-4xl mx-auto flex flex-col">
      <div className="p-6 border-b border-white/20 flex justify-between items-center">
        <h3 className="text-2xl font-bold text-white">{formTitle}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
            <FontAwesomeIcon icon={faTimes} size="lg" />
        </button>
      </div>
      
      {/* ======================= PERBAIKAN DI SINI ======================= */}
      {/* class 'overflow-y-auto' telah dihapus dari div di bawah ini */}
      <div className="p-6 space-y-4">
      {/* ================================================================= */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Form utama untuk detail airdrop */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">{t.adminFormLabelTitle}</label>
            <input type="text" name="title" id="title" value={formData.title} onChange={handleChange} className="w-full bg-white/5 border border-white/20 rounded-md p-2" required />
          </div>
          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-gray-300 mb-1">Slug (URL)</label>
            <input type="text" name="slug" id="slug" value={formData.slug} onChange={handleChange} className="w-full bg-white/5 border border-white/20 rounded-md p-2" required />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">{t.adminFormLabelDescription}</label>
            <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows="3" className="w-full bg-white/5 border border-white/20 rounded-md p-2"></textarea>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="link" className="block text-sm font-medium text-gray-300 mb-1">{t.adminFormLabelLink}</label>
              <input type="url" name="link" id="link" value={formData.link} onChange={handleChange} className="w-full bg-white/5 border border-white/20 rounded-md p-2" />
            </div>
            <div>
              <label htmlFor="image_url" className="block text-sm font-medium text-gray-300 mb-1">{t.adminFormLabelImageUrl}</label>
              <input type="url" name="image_url" id="image_url" value={formData.image_url} onChange={handleChange} className="w-full bg-white/5 border border-white/20 rounded-md p-2" />
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1">Kategori</label>
              <select name="category" id="category" value={formData.category} onChange={handleChange} className="w-full bg-dark border border-white/20 rounded-md p-2">
                <option value="Testnet">Testnet</option>
                <option value="Retroactive">Retroactive</option>
                <option value="Mainnet">Mainnet</option>
                <option value="NFT Drop">NFT Drop</option>
              </select>
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-1">{t.adminFormLabelStatus}</label>
              <select name="status" id="status" value={formData.status} onChange={handleChange} className="w-full bg-dark border border-white/20 rounded-md p-2">
                <option value="upcoming">{t.adminFormOptionUpcoming}</option>
                <option value="active">{t.adminFormOptionActive}</option>
                <option value="ended">{t.adminFormOptionEnded}</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-300 mb-1">Estimasi Tanggal</label>
            <input type="text" name="date" id="date" value={formData.date} onChange={handleChange} placeholder="Contoh: Q4 2025" className="w-full bg-white/5 border border-white/20 rounded-md p-2" />
          </div>
          <div>
            <label htmlFor="tutorial" className="block text-sm font-medium text-gray-300 mb-1">{t.adminFormLabelTutorial}</label>
            <textarea
              ref={tutorialTextareaRef}
              name="tutorial" id="tutorial" value={formData.tutorial} onChange={handleChange} rows="10" placeholder={t.adminFormPlaceholderTutorial}
              className="w-full bg-white/5 border border-white/20 rounded-md p-2"></textarea>
            <div className='mt-2'>
              <label htmlFor="image-upload" className="btn-secondary px-4 py-2 text-sm cursor-pointer inline-flex items-center gap-2 disabled:opacity-50" disabled={uploading}>
                <FontAwesomeIcon icon={faUpload} />
                Upload & Sisipkan Gambar
              </label>
              <input id="image-upload" type="file" className="hidden" onChange={handleImageUpload} accept="image/*" disabled={uploading}/>
              {uploading && <span className='ml-4 text-sm text-yellow-400 flex items-center gap-2'><FontAwesomeIcon icon={faSpinner} spin/> Mengunggah...</span>}
              {uploadError && <p className="text-red-400 text-sm mt-1">{uploadError}</p>}
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-4 border-t border-white/10 mt-4">
              <button type="button" onClick={onClose} disabled={loading || uploading} className="btn-secondary px-6 py-2">
                  <FontAwesomeIcon icon={faTimes} className="mr-2" />
                  {t.adminFormBtnCancel}
              </button>
              <button type="submit" disabled={loading || uploading} className="btn-primary px-6 py-2 flex items-center">
                  {loading ? <FontAwesomeIcon icon={faSpinner} spin className="mr-2" /> : <FontAwesomeIcon icon={faSave} className="mr-2" />}
                  {initialData ? t.adminFormBtnSave : t.adminFormBtnAdd}
              </button>
          </div>
        </form>

        {isEditing && (
          <div className="mt-8 border-t border-primary/20 pt-8">
            <h4 className="text-xl font-bold text-white mb-4">Kelola Update untuk Airdrop Ini</h4>
            <AirdropUpdateForm airdropId={initialData.id} onUpdateAdded={fetchUpdates} />
            <h5 className="text-lg font-semibold text-gray-300 mt-8 mb-4">Daftar Update Tersimpan</h5>
            {loadingUpdates ? (
              <div className="text-center text-gray-400"><FontAwesomeIcon icon={faSpinner} spin /> Memuat...</div>
            ) : updates.length > 0 ? (
              <div className="space-y-3">
                {updates.map(update => (
                  <div key={update.id} className="p-4 bg-dark rounded-lg flex justify-between items-start">
                    <div>
                      <p className="text-xs text-gray-500 mb-1 flex items-center">
                        <FontAwesomeIcon icon={faClock} className="mr-2" />
                        {new Date(update.created_at).toLocaleString('id-ID')}
                      </p>
                      <p className="font-bold text-base text-primary">{update.title}</p>
                      {update.content && <p className="mt-1 text-gray-400 text-sm whitespace-pre-wrap">{update.content}</p>}
                      {update.link && <a href={update.link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-xs mt-1 block break-all">{update.link}</a>}
                    </div>
                    <button onClick={() => handleDeleteUpdate(update.id)} className="btn-danger p-2 h-8 w-8 text-xs flex-shrink-0 ml-4">
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">Belum ada update untuk airdrop ini.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
