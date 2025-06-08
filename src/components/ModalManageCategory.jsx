// src/components/ModalManageCategory.jsx - VERSI PERBAIKAN
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFolder, faTimes, faSave } from "@fortawesome/free-solid-svg-icons";
import { useLanguage } from "../context/LanguageContext";
import translationsId from "../translations/id.json";
import translationsEn from "../translations/en.json";

const getTranslations = (lang) => {
  return lang === 'id' ? translationsId : translationsEn;
};

export default function ModalManageCategory({ isOpen, onClose, onSave, initialData }) {
  const { language } = useLanguage();
  // ==================== PERBAIKAN DI SINI ====================
  // SEBELUM: const t = getTranslations(language).myWorkPage;
  // SESUDAH: Langsung menunjuk ke objek yang benar.
  const t = getTranslations(language).modalManageCategory;
  // ==========================================================

  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [iconColor, setIconColor] = useState(""); // State untuk menyimpan warna

  const isEditing = !!initialData;

  useEffect(() => {
    if (isEditing) {
      setName(initialData.name || "");
      setIcon(initialData.icon || "");
      setIconColor(initialData.iconColor || 'text-gray-400'); // Ambil warna dari data
    } else {
      setName("");
      setIcon("");
      setIconColor(""); // Kosongkan saat membuat baru
    }
  }, [isEditing, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert(t.emptyNameAlert);
      return;
    }
    // Kirim data termasuk iconColor
    onSave({ name, icon, iconColor });
  };
  
  return (
    <div className="modal active">
      <div className="modal-content">
        <form onSubmit={handleSubmit}>
          <div className="modal-header">
            <h2 className="modal-title flex items-center">
              <FontAwesomeIcon icon={faFolder} className="mr-2" />
              {isEditing ? t.editCategoryTitle : t.addCategoryTitle}
            </h2>
            <button type="button" onClick={onClose} className="modal-close-btn">
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          <div className="form-group">
            <label htmlFor="categoryName">{t.categoryNameLabel}</label>
            <input
              type="text"
              id="categoryName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.categoryNamePlaceholder}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="categoryIcon">{t.iconClassLabel}</label>
            <input
              type="text"
              id="categoryIcon"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder={t.iconClassPlaceholder}
            />
             <p className="text-xs text-gray-500 mt-1">{t.iconClassHint}</p>
          </div>
          
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-secondary">{t.cancelButton}</button>
            <button type="submit" className="btn-primary flex items-center">
              <FontAwesomeIcon icon={faSave} className="mr-2" />
              {isEditing ? t.saveChangesButton : t.saveCategoryButton}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
