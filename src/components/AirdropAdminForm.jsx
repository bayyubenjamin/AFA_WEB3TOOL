import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, 
  faSave, 
  faSpinner, 
  faPlus, 
  faGlobe, 
  faVideo, 
  faImage, 
  faLayerGroup,
  faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import { useLanguage } from "../context/LanguageContext";
import translationsId from "../translations/id.json";
import translationsEn from "../translations/en.json";

// --- Utility Functions ---
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

// --- Reusable UI Components for Cleaner Code ---
const SectionTitle = ({ icon, title }) => (
  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
    <FontAwesomeIcon icon={icon} className="text-primary text-sm" />
    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
  </div>
);

const InputGroup = ({ label, id, type = "text", value, onChange, placeholder, required, icon, readOnly }) => (
  <div className="flex flex-col gap-1.5 w-full">
    <label htmlFor={id} className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative group">
      {icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
          <FontAwesomeIcon icon={icon} />
        </div>
      )}
      <input
        type={type}
        name={id}
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        readOnly={readOnly}
        className={`w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 ${icon ? 'pl-10' : 'pl-4'} pr-4 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 ease-in-out shadow-sm ${readOnly ? 'bg-gray-100 dark:bg-gray-900 cursor-not-allowed opacity-70' : ''}`}
      />
    </div>
  </div>
);

const SelectGroup = ({ label, id, value, onChange, options }) => (
  <div className="flex flex-col gap-1.5 w-full">
    <label htmlFor={id} className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
      {label}
    </label>
    <div className="relative">
        <select
          name={id}
          id={id}
          value={value}
          onChange={onChange}
          className="w-full appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 pl-4 pr-10 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 shadow-sm cursor-pointer"
        >
          {options.map((opt, idx) => (
            <option key={idx} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
        </div>
    </div>
  </div>
);

// --- Main Component ---
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

  const pageTitle = isEditing ? t.adminFormTitleEdit : t.adminFormTitleAdd;

  return (
    <div className="max-w-5xl mx-auto pb-20 animate-fade-in">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button 
            onClick={onClose} 
            className="group flex items-center text-sm font-medium text-gray-500 hover:text-primary transition-colors mb-1"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="mr-2 group-hover:-translate-x-1 transition-transform" />
            Kembali
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{pageTitle}</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Section 1: Basic Info & Image */}
        <div className="bg-white dark:bg-[#1a1b1e] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
          <SectionTitle icon={faInfoCircle} title="Informasi Utama" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-5">
              <InputGroup 
                label={t.adminFormLabelTitle} 
                id="title" 
                value={formData.title} 
                onChange={handleChange} 
                required 
                placeholder="Nama Proyek Airdrop"
              />
              <InputGroup 
                label="Slug (URL)" 
                id="slug" 
                value={formData.slug} 
                onChange={handleChange} 
                required 
                placeholder="project-name-slug"
                readOnly={!isEditing} // Sedikit UX tweak: readOnly saat create biar user fokus ke title
              />
               <InputGroup 
                label={t.adminFormLabelImageUrl} 
                id="image_url" 
                value={formData.image_url} 
                onChange={handleChange} 
                required 
                icon={faImage}
                placeholder="https://example.com/image.png"
              />
            </div>
            {/* Image Preview Area */}
            <div className="lg:col-span-4">
               <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 block">Preview Gambar</label>
               <div className="aspect-video w-full rounded-xl bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center overflow-hidden relative group">
                  {formData.image_url ? (
                    <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover transition-opacity duration-300" onError={(e) => e.target.style.display = 'none'} />
                  ) : (
                    <div className="text-center p-4">
                      <FontAwesomeIcon icon={faImage} className="text-3xl text-gray-300 mb-2" />
                      <p className="text-xs text-gray-400">Masukkan URL gambar untuk melihat preview</p>
                    </div>
                  )}
               </div>
            </div>
          </div>
        </div>

        {/* Section 2: Details, Status & Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-[#1a1b1e] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 h-full">
                <SectionTitle icon={faLayerGroup} title="Klasifikasi & Status" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <SelectGroup 
                        label={t.adminFormLabelType} 
                        id="category" 
                        value={formData.category} 
                        onChange={handleChange}
                        options={[
                            { value: 'Retroactive', label: 'Retroactive' },
                            { value: 'Testnet', label: 'Testnet' },
                            { value: 'Mainnet', label: 'Mainnet' },
                            { value: 'NFT Drop', label: 'NFT Drop' }
                        ]}
                    />
                    <SelectGroup 
                        label={t.adminFormLabelStatus} 
                        id="status" 
                        value={formData.status} 
                        onChange={handleChange}
                        options={[
                            { value: 'active', label: t.adminFormOptionActive },
                            { value: 'upcoming', label: t.adminFormOptionUpcoming },
                            { value: 'ended', label: t.adminFormOptionEnded }
                        ]}
                    />
                     <SelectGroup 
                        label="Confirmation Status" 
                        id="confirmation_status" 
                        value={formData.confirmation_status} 
                        onChange={handleChange}
                        options={[
                            { value: 'Potential', label: 'Potential' },
                            { value: 'Confirmed', label: 'Confirmed' }
                        ]}
                    />
                     <InputGroup 
                        label="Raise Amount" 
                        id="raise_amount" 
                        value={formData.raise_amount} 
                        onChange={handleChange} 
                        placeholder="$10M"
                    />
                    <div className="sm:col-span-2">
                        <InputGroup 
                            label="Tanggal / Estimasi" 
                            id="date" 
                            value={formData.date} 
                            onChange={handleChange} 
                            placeholder="Q1 2026 or TBA"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-[#1a1b1e] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 h-full">
                 <SectionTitle icon={faGlobe} title="Tautan Eksternal" />
                 <div className="space-y-5">
                    <InputGroup 
                        label={t.adminFormLabelLink} 
                        id="link" 
                        value={formData.link} 
                        onChange={handleChange} 
                        icon={faGlobe}
                        placeholder="https://project-website.com"
                    />
                    <InputGroup 
                        label="Video Tutorial (Opsional)" 
                        id="video_url" 
                        value={formData.video_url} 
                        onChange={handleChange} 
                        icon={faVideo}
                        placeholder="https://youtube.com/..."
                    />
                    <div className="mt-4">
                        <label htmlFor="description" className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 block">
                            {t.adminFormLabelDescription}
                        </label>
                        <textarea 
                            name="description" 
                            id="description" 
                            value={formData.description} 
                            onChange={handleChange} 
                            rows="4" 
                            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none shadow-sm placeholder-gray-400"
                            placeholder="Deskripsi singkat mengenai proyek ini..."
                        ></textarea>
                    </div>
                 </div>
            </div>
        </div>

        {/* Section 3: Tutorial Content */}
        <div className="bg-white dark:bg-[#1a1b1e] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faLayerGroup} className="text-primary text-sm" />
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t.adminFormLabelTutorial}</h3>
                </div>
                <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">Markdown Supported</span>
            </div>
            <textarea 
                name="tutorial" 
                id="tutorial" 
                value={formData.tutorial} 
                onChange={handleChange} 
                rows="12" 
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-sm font-mono text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-inner" 
                placeholder="# Langkah 1&#10;Lakukan swap pada..."
            ></textarea>
        </div>

        {/* Sticky Action Footer */}
        <div className="fixed bottom-6 left-0 right-0 px-4 flex justify-center z-50 pointer-events-none">
             <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-200 dark:border-gray-700 p-2 rounded-2xl shadow-xl flex gap-3 pointer-events-auto transform hover:scale-105 transition-transform duration-300">
                <button 
                    type="button" 
                    onClick={onClose} 
                    disabled={loading} 
                    className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                    {t.adminFormBtnCancel}
                </button>
                <button 
                    type="submit" 
                    disabled={loading} 
                    className="bg-primary hover:bg-primary-dark text-white px-8 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-primary/30 flex items-center gap-2 transition-all active:scale-95"
                >
                    {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={isEditing ? faSave : faPlus} />}
                    {isEditing ? t.adminFormBtnSave : t.adminFormBtnAdd}
                </button>
             </div>
        </div>

      </form>
    </div>
  );
}
