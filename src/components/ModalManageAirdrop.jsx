// src/components/ModalManageAirdrop.jsx
import React, { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext"; // Import useLanguage
import translationsId from "../translations/id.json";
import translationsEn from "../translations/en.json";

const getTranslations = (lang) => {
  return lang === 'id' ? translationsId : translationsEn;
};

export default function ModalManageAirdrop({ isOpen, onClose, onSave, initialData, categories, defaultCategoryKey }) {
  const { language } = useLanguage();
  const t = getTranslations(language).myWorkPage; // Menggunakan terjemahan dari PageMyWork

  const [formData, setFormData] = useState({
    id: initialData?.id || null,
    name: initialData?.name || '',
    link: initialData?.link || '',
    description: initialData?.description || '',
    category_id: initialData?.category_id || defaultCategoryKey || '',
    status: initialData?.status || 'in progress',
    daily_done: initialData?.daily_done || false,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id,
        name: initialData.name,
        link: initialData.link,
        description: initialData.description,
        category_id: initialData.category_id,
        status: initialData.status,
        daily_done: initialData.daily_done,
      });
    } else {
      setFormData(prevFormData => ({
        ...prevFormData,
        id: null,
        name: '',
        link: '',
        description: '',
        category_id: defaultCategoryKey || '',
        status: 'in progress',
        daily_done: false,
      }));
    }
  }, [initialData, defaultCategoryKey]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="modal active">
      <div className="modal-content max-w-2xl bg-gray-800 text-gray-100 rounded-xl shadow-lg">
        <div className="modal-header border-b border-gray-700 pb-4 mb-6">
          <h3 className="modal-title text-xl font-semibold text-white">{initialData ? t.modalManageAirdrop.editAirdropTitle : t.modalManageAirdrop.addAirdropTitle}</h3> {/* PERBAIKAN: Menggunakan kunci dari modalManageAirdrop */}
          <button className="modal-close-btn text-gray-400 hover:text-white transition-colors duration-200" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">{t.modalManageAirdrop.airdropNameLabel} <span className="text-red-500">*</span></label> {/* PERBAIKAN: Menggunakan kunci dari modalManageAirdrop */}
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="form-input w-full p-2.5 rounded-md bg-gray-700 border border-gray-600 focus:ring-primary focus:border-primary placeholder-gray-500 text-white"
                placeholder={t.modalManageAirdrop.airdropNamePlaceholder} {/* PERBAIKAN: Menggunakan kunci dari modalManageAirdrop */}
                required
              />
            </div>

            <div>
              <label htmlFor="link" className="block text-sm font-medium text-gray-300 mb-1">{t.modalManageAirdrop.link}</label> {/* PERBAIKAN: Menggunakan kunci dari modalManageAirdrop */}
              <input
                type="url"
                id="link"
                name="link"
                value={formData.link}
                onChange={handleChange}
                className="form-input w-full p-2.5 rounded-md bg-gray-700 border border-gray-600 focus:ring-primary focus:border-primary placeholder-gray-500 text-white"
                placeholder={t.modalManageAirdrop.linkPlaceholder} {/* PERBAIKAN: Menggunakan kunci dari modalManageAirdrop */}
              />
            </div>

            <div>
              <label htmlFor="category_id" className="block text-sm font-medium text-gray-300 mb-1">{t.modalManageAirdrop.category} <span className="text-red-500">*</span></label> {/* PERBAIKAN: Menggunakan kunci dari modalManageAirdrop */}
              <select
                id="category_id"
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                className="form-input w-full p-2.5 rounded-md bg-gray-700 border border-gray-600 focus:ring-primary focus:border-primary text-white appearance-none"
                required
              >
                <option value="">-- {t.modalManageAirdrop.selectCategoryPlaceholder} --</option> {/* PERBAIKAN: Menggunakan kunci dari modalManageAirdrop */}
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-1">{t.modalManageAirdrop.status} <span className="text-red-500">*</span></label> {/* PERBAIKAN: Menggunakan kunci dari modalManageAirdrop */}
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="form-input w-full p-2.5 rounded-md bg-gray-700 border border-gray-600 focus:ring-primary focus:border-primary text-white appearance-none"
                required
              >
                <option value="in progress">{t.modalManageAirdrop.statusInProgress}</option> {/* PERBAIKAN: Menggunakan kunci dari modalManageAirdrop */}
                <option value="completed">{t.modalManageAirdrop.statusCompleted}</option> {/* PERBAIKAN: Menggunakan kunci dari modalManageAirdrop */}
              </select>
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">{t.modalManageAirdrop.shortDescription}</label> {/* PERBAIKAN: Menggunakan kunci dari modalManageAirdrop */}
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="form-input w-full p-2.5 h-24 rounded-md bg-gray-700 border border-gray-600 focus:ring-primary focus:border-primary placeholder-gray-500 text-white resize-y"
              placeholder={t.modalManageAirdrop.shortDescriptionPlaceholder} {/* PERBAIKAN: Menggunakan kunci dari modalManageAirdrop */}
            ></textarea>
          </div>

          <div className="modal-footer flex justify-end space-x-3 pt-6 border-t border-gray-700">
            <button type="button" onClick={onClose} className="btn-secondary px-5 py-2.5 rounded-md font-semibold transition-colors duration-200">{t.modalManageAirdrop.cancelButton}</button> {/* PERBAIKAN: Menggunakan kunci dari modalManageAirdrop */}
            <button type="submit" className="btn-primary px-5 py-2.5 rounded-md font-semibold transition-colors duration-200">{t.modalManageAirdrop.saveButton}</button> {/* PERBAIKAN: Menggunakan kunci dari modalManageAirdrop */}
          </div>
        </form>
      </div>
    </div>
  );
}
