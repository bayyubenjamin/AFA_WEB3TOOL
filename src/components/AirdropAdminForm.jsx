// src/components/AirdropAdminForm.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import translationsId from "../translations/id.json";
import translationsEn from "../translations/en.json";
// [TAMBAHAN]: Impor yang diperlukan untuk fitur upload
import { supabase } from '../supabaseClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faSpinner } from '@fortawesome/free-solid-svg-icons';

const getTranslations = (lang) => (lang === 'id' ? translationsId : translationsEn);

export default function AirdropAdminForm({ onSave, onClose, initialData = null, loading }) {
  const { language } = useLanguage();
  const t = getTranslations(language).pageAirdrops;

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    link: '',
    image_url: '',
    category: 'Testnet',
    status: 'upcoming',
    tutorial: '',
    date: ''
  });

  // [TAMBAHAN] State dan Ref untuk fitur upload
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const tutorialTextareaRef = useRef(null);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newSlug = formData.slug;
    if (name === 'title' && !initialData) { // Hanya generate slug otomatis saat membuat baru
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

  // [TAMBAHAN] Fungsi untuk menangani upload gambar ke Supabase Storage
  const handleImageUpload = async (event) => {
    try {
      setUploading(true);
      setUploadError(null);

      const file = event.target.files[0];
      if (!file) {
        throw new Error("Kamu tidak memilih file untuk di-upload.");
      }

      // Buat nama file yang unik untuk menghindari konflik
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `public/${fileName}`;

      // Upload file ke bucket 'tutorial-images'
      let { error: uploadError } = await supabase.storage
        .from('tutorial-images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Jika berhasil, dapatkan URL publiknya
      const { data: { publicUrl } } = supabase.storage
        .from('tutorial-images')
        .getPublicUrl(filePath);
      
      // Buat format link Markdown dan tambahkan ke textarea tutorial
      const markdownLink = `![${file.name}](${publicUrl})\n`;
      const newTutorialText = formData.tutorial + (formData.tutorial ? '\n' : '') + markdownLink;
      
      setFormData(prev => ({ ...prev, tutorial: newTutorialText }));
      
    } catch (error) {
      console.error('Error uploading image:', error);
      setUploadError(error.message);
    } finally {
      setUploading(false);
      // Reset input file agar bisa upload file yang sama lagi jika perlu
      event.target.value = null; 
    }
  };

  const formTitle = initialData ? t.adminFormTitleEdit : t.adminFormTitleAdd;

  return (
    <div className="fixed inset-0 bg-dark/80 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
      <div className="bg-card border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-white/20">
          <h3 className="text-2xl font-bold text-white">{formTitle}</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
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
              name="tutorial" id="tutorial" value={formData.tutorial} onChange={handleChange} rows="8" placeholder={t.adminFormPlaceholderTutorial}
              className="w-full bg-white/5 border border-white/20 rounded-md p-2"></textarea>
            
             {/* [TAMBAHAN] Tombol Upload dan statusnya */}
             <div className='mt-2'>
              <label htmlFor="image-upload" className="btn-secondary px-4 py-2 text-sm cursor-pointer inline-flex items-center gap-2 disabled:opacity-50" disabled={uploading}>
                <FontAwesomeIcon icon={faUpload} />
                Upload & Sisipkan Gambar
              </label>
              <input id="image-upload" type="file" className="hidden" onChange={handleImageUpload} accept="image/*" disabled={uploading}/>
              {uploading && (
                <span className='ml-4 text-sm text-yellow-400 flex items-center gap-2'>
                  <FontAwesomeIcon icon={faSpinner} spin/>
                  Mengunggah...
                </span>
              )}
              {uploadError && <p className="text-red-400 text-sm mt-1">{uploadError}</p>}
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-4">
            <button type="button" onClick={onClose} disabled={loading || uploading} className="btn-secondary px-6 py-2">{t.adminFormBtnCancel}</button>
            <button type="submit" disabled={loading || uploading} className="btn-primary px-6 py-2">{loading ? "Menyimpan..." : (initialData ? t.adminFormBtnSave : t.adminFormBtnAdd)}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
