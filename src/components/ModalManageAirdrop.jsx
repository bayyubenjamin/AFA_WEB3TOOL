import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faSave } from "@fortawesome/free-solid-svg-icons";
import { useLanguage } from "../context/LanguageContext";
import translationsId from "../translations/id.json";
import translationsEn from "../translations/en.json";

const getTranslations = (lang) => {
  return lang === 'id' ? translationsId : translationsEn;
};

export default function ModalManageAirdrop({
  isOpen,
  onClose,
  onSave,
  initialData,
  categories,
  defaultCategoryKey
}) {
  const { language } = useLanguage();
  const t = getTranslations(language).modalManageAirdrop;

  const [formData, setFormData] = useState({
    id: null,
    name: '',
    link: '',
    description: '',
    status: 'inprogress',
    category_id: '',
    daily_done: false,
  });

  const isEditing = !!initialData;

  useEffect(() => {
    if (isEditing) {
      setFormData({
        id: initialData.id,
        name: initialData.name || '',
        link: initialData.link || '',
        description: initialData.description || '',
        status: initialData.status || 'inprogress',
        category_id: initialData.category_id || '',
        daily_done: initialData.daily_done || false,
      });
    } else {
      setFormData(prev => ({ ...prev, category_id: defaultCategoryKey || '' }));
    }
  }, [isEditing, initialData, defaultCategoryKey]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.category_id) {
        alert(t.requiredFieldsAlert);
        return;
    }
    onSave(formData);
  };

  return (
    <div className="modal active">
      <div className="modal-content">
        <div className="modal-header">
          <h3 className="modal-title">{isEditing ? t.editAirdropTitle : t.addAirdropTitle}</h3>
          <button onClick={onClose} className="modal-close-btn">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">{t.airdropNameLabel}</label>
            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} placeholder={t.airdropNamePlaceholder} required />
          </div>
          <div className="form-group">
            <label htmlFor="link">{t.link}</label>
            <input type="url" id="link" name="link" value={formData.link} onChange={handleChange} placeholder={t.linkPlaceholder} />
          </div>
          <div className="form-group">
            <label htmlFor="category_id">{t.category}</label>
            <select id="category_id" name="category_id" value={formData.category_id} onChange={handleChange} required>
              <option value="" disabled>{t.selectCategoryPlaceholder}</option>
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="status">{t.status}</label>
            <select id="status" name="status" value={formData.status} onChange={handleChange}>
              <option value="inprogress">{t.statusInProgress}</option>
              <option value="completed">{t.statusCompleted}</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="description">{t.shortDescription}</label>
            <textarea id="description" name="description" value={formData.description} onChange={handleChange} placeholder={t.shortDescriptionPlaceholder}></textarea>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-secondary">{t.cancelButton}</button>
            <button type="submit" className="btn-primary flex items-center">
                <FontAwesomeIcon icon={faSave} className="mr-2" />
                {t.saveButton}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
