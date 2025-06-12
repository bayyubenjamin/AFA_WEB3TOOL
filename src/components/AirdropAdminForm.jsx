// src/components/AirdropAdminForm.jsx - DENGAN TAMBAHAN VIDEO URL
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faSave, faSpinner, faPlus } from '@fortawesome/free-solid-svg-icons';
import { useLanguage } from "../context/LanguageContext";
import translationsId from "../translations/id.json";
import translationsEn from "../translations/en.json";

const getTranslations = (lang) => (lang === 'id' ? translationsId : translationsEn);

const generateSlug = (title) => {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};


export default function AirdropAdminForm({ onSave, onClose, initialData, loading }) {
  const { language } = useLanguage();
  const t = getTranslations(language).pageAirdrops;

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    link: '',
    // [PERUBAHAN 1]: Tambahkan video_url di sini
    video_url: '', 
    category: 'Retroactive',
    status: 'upcoming',
    image_url: '',
    description: '',
    date: '',
    tutorial: '',
    raise_amount: '',
    confirmation_status: 'Potential'
  });

  const isEditing = !!initialData;

  useEffect(() => {
    if (isEditing) {
      // Pastikan semua field terisi dari initialData, termasuk yang mungkin null
      setFormData({
        ...formData, // Ambil default state
        ...initialData // Timpa dengan data yang ada
      });
    }
  }, [initialData, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newState = { ...prev, [name]: value };
      if (name === 'title' && !isEditing) {
        newState.slug = generateSlug(value);
      }
      return newState;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.slug) {
      alert("Judul dan Slug wajib diisi!");
      return;
    }
    onSave(formData);
  };

  const formTitle = isEditing ? t.adminFormTitleEdit : t.adminFormTitleAdd;

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={onClose} className="text-sm text-primary hover:underline mb-6 inline-flex items-center">
        <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
        Kembali ke Admin Panel
      </button>

      <form onSubmit={handleSubmit} className="bg-card border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
        <h2 className="text-2xl font-bold text-white border-b border-white/10 pb-4">
          {formTitle}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="form-group">
            <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1.5">{t.adminFormLabelTitle}</label>
            <input type="text" name="title" id="title" value={formData.title} onChange={handleChange} className="form-input" required />
          </div>
          <div className="form-group">
            <label htmlFor="slug" className="block text-sm font-medium text-gray-300 mb-1.5">Slug (URL)</label>
            <input type="text" name="slug" id="slug" value={formData.slug} onChange={handleChange} className="form-input" placeholder="otomatis-terisi-dari-judul" required />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="form-group">
            <label htmlFor="link" className="block text-sm font-medium text-gray-300 mb-1.5">{t.adminFormLabelLink}</label>
            <input type="url" name="link" id="link" value={formData.link} onChange={handleChange} className="form-input" placeholder="https://" />
          </div>
          <div className="form-group">
            <label htmlFor="image_url" className="block text-sm font-medium text-gray-300 mb-1.5">{t.adminFormLabelImageUrl}</label>
            <input type="url" name="image_url" id="image_url" value={formData.image_url} onChange={handleChange} className="form-input" placeholder="https://" required />
          </div>
        </div>
        
        {/* [PERUBAHAN 2]: Tambahkan field untuk Video URL di sini */}
        <div className="form-group">
            <label htmlFor="video_url" className="block text-sm font-medium text-gray-300 mb-1.5">Link Video Tutorial (Opsional)</label>
            <input type="url" name="video_url" id="video_url" value={formData.video_url || ''} onChange={handleChange} className="form-input" placeholder="https://youtube.com/watch?v=..." />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
                <label htmlFor="raise_amount" className="block text-sm font-medium text-gray-300 mb-1.5">Raise Amount</label>
                <input type="text" name="raise_amount" id="raise_amount" value={formData.raise_amount} onChange={handleChange} className="form-input" placeholder="Cth: $258M" />
            </div>
            <div className="form-group">
                <label htmlFor="confirmation_status" className="block text-sm font-medium text-gray-300 mb-1.5">Confirmation Status</label>
                <select name="confirmation_status" id="confirmation_status" value={formData.confirmation_status} onChange={handleChange} className="form-input">
                    <option value="Potential">Potential</option>
                    <option value="Confirmed">Confirmed</option>
                </select>
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="form-group">
                <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1.5">{t.adminFormLabelType}</label>
                <select name="category" id="category" value={formData.category} onChange={handleChange} className="form-input">
                    <option>Retroactive</option>
                    <option>Testnet</option>
                    <option>Mainnet</option>
                    <option>NFT Drop</option>
                </select>
            </div>
            <div className="form-group">
                <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-1.5">{t.adminFormLabelStatus}</label>
                <select name="status" id="status" value={formData.status} onChange={handleChange} className="form-input">
                    <option value="active">{t.adminFormOptionActive}</option>
                    <option value="upcoming">{t.adminFormOptionUpcoming}</option>
                    <option value="ended">{t.adminFormOptionEnded}</option>
                </select>
            </div>
            <div className="form-group">
                <label htmlFor="date" className="block text-sm font-medium text-gray-300 mb-1.5">Tanggal/Estimasi</label>
                <input type="text" name="date" id="date" value={formData.date} onChange={handleChange} className="form-input" placeholder="Cth: Q4 2025 atau Ongoing" />
            </div>
        </div>

        <div className="form-group">
          <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1.5">{t.adminFormLabelDescription}</label>
          <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows="4" className="form-input"></textarea>
        </div>

        <div className="form-group">
          <label htmlFor="tutorial" className="block text-sm font-medium text-gray-300 mb-1.5">{t.adminFormLabelTutorial} (Mendukung Markdown untuk Teks)</label>
          <textarea name="tutorial" id="tutorial" value={formData.tutorial} onChange={handleChange} rows="10" className="form-input font-mono text-sm" placeholder="Tuliskan langkah-langkah tutorial berupa teks di sini..."></textarea>
        </div>
        
        <div className="flex justify-end gap-4 pt-4">
          <button type="button" onClick={onClose} disabled={loading} className="btn-secondary px-6 py-2.5 rounded-lg text-sm">{t.adminFormBtnCancel}</button>
          <button type="submit" disabled={loading} className="btn-primary px-6 py-2.5 rounded-lg text-sm flex items-center">
            {loading ? <FontAwesomeIcon icon={faSpinner} spin className="mr-2" /> : <FontAwesomeIcon icon={isEditing ? faSave : faPlus} className="mr-2" />}
            {isEditing ? t.adminFormBtnSave : t.adminFormBtnAdd}
          </button>
        </div>
      </form>
    </div>
  );
}
