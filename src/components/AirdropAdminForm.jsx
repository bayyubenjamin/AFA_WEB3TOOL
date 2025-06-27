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
    title: '', slug: '', link: '', video_url: '', category: 'Retroactive',
    status: 'upcoming', image_url: '', description: '', date: '',
    tutorial: '', raise_amount: '', confirmation_status: 'Potential'
  });

  const isEditing = !!initialData;

  useEffect(() => {
    if (isEditing) {
      setFormData(initialData);
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
  
  const formInputClass = "w-full bg-light-bg dark:bg-dark-bg border border-black/20 dark:border-white/20 rounded-md p-2 text-sm text-light-text dark:text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary";
  const formLabelClass = "block text-sm font-medium text-light-subtle dark:text-gray-300 mb-1.5";
  const formTitle = isEditing ? t.adminFormTitleEdit : t.adminFormTitleAdd;

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={onClose} className="text-sm text-primary hover:underline mb-6 inline-flex items-center">
        <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
        Kembali ke Admin Panel
      </button>

      <form onSubmit={handleSubmit} className="bg-light-card dark:bg-dark-card border border-black/10 dark:border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
        <h2 className="text-2xl font-bold text-light-text dark:text-white border-b border-black/10 dark:border-white/10 pb-4">
          {formTitle}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="form-group">
            <label htmlFor="title" className={formLabelClass}>{t.adminFormLabelTitle}</label>
            <input type="text" name="title" id="title" value={formData.title} onChange={handleChange} className={formInputClass} required />
          </div>
          <div className="form-group">
            <label htmlFor="slug" className={formLabelClass}>Slug (URL)</label>
            <input type="text" name="slug" id="slug" value={formData.slug} onChange={handleChange} className={formInputClass} placeholder="otomatis-terisi-dari-judul" required />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
                <label htmlFor="link" className={formLabelClass}>{t.adminFormLabelLink}</label>
                <input type="url" name="link" id="link" value={formData.link} onChange={handleChange} className={formInputClass} placeholder="https://proyek-airdrop.com" />
            </div>
            <div className="form-group">
                <label htmlFor="video_url" className={formLabelClass}>Link Video Tutorial (Opsional)</label>
                <input type="url" name="video_url" id="video_url" value={formData.video_url} onChange={handleChange} className={formInputClass} placeholder="https://www.youtube.com/watch?v=XXXXXXXXXXX..." />
            </div>
        </div>
        
        <div className="form-group">
            <label htmlFor="image_url" className={formLabelClass}>{t.adminFormLabelImageUrl}</label>
            <input type="url" name="image_url" id="image_url" value={formData.image_url} onChange={handleChange} className={formInputClass} placeholder="https://" required />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
                <label htmlFor="raise_amount" className={formLabelClass}>Raise Amount</label>
                <input type="text" name="raise_amount" id="raise_amount" value={formData.raise_amount} onChange={handleChange} className={formInputClass} placeholder="Cth: $258M" />
            </div>
            <div className="form-group">
                <label htmlFor="confirmation_status" className={formLabelClass}>Confirmation Status</label>
                <select name="confirmation_status" id="confirmation_status" value={formData.confirmation_status} onChange={handleChange} className={formInputClass}>
                    <option value="Potential">Potential</option>
                    <option value="Confirmed">Confirmed</option>
                </select>
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="form-group">
                <label htmlFor="category" className={formLabelClass}>{t.adminFormLabelType}</label>
                <select name="category" id="category" value={formData.category} onChange={handleChange} className={formInputClass}>
                    <option>Retroactive</option>
                    <option>Testnet</option>
                    <option>Mainnet</option>
                    <option>NFT Drop</option>
                </select>
            </div>
            <div className="form-group">
                <label htmlFor="status" className={formLabelClass}>{t.adminFormLabelStatus}</label>
                <select name="status" id="status" value={formData.status} onChange={handleChange} className={formInputClass}>
                    <option value="active">{t.adminFormOptionActive}</option>
                    <option value="upcoming">{t.adminFormOptionUpcoming}</option>
                    <option value="ended">{t.adminFormOptionEnded}</option>
                </select>
            </div>
            <div className="form-group">
                <label htmlFor="date" className={formLabelClass}>Tanggal/Estimasi</label>
                <input type="text" name="date" id="date" value={formData.date} onChange={handleChange} className={formInputClass} placeholder="Cth: Q4 2025 atau Ongoing" />
            </div>
        </div>

        <div className="form-group">
          <label htmlFor="description" className={formLabelClass}>{t.adminFormLabelDescription}</label>
          <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows="4" className={formInputClass}></textarea>
        </div>

        <div className="form-group">
          <label htmlFor="tutorial" className={formLabelClass}>{t.adminFormLabelTutorial} (Mendukung Markdown untuk Teks)</label>
          <textarea name="tutorial" id="tutorial" value={formData.tutorial} onChange={handleChange} rows="10" className={`${formInputClass} font-mono`} placeholder="Tuliskan langkah-langkah tutorial berupa teks di sini..."></textarea>
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
