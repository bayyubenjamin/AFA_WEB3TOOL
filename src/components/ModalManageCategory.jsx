// src/components/ModalManageCategory.jsx
import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFolderPlus, faEdit } from "@fortawesome/free-solid-svg-icons";
import { useLanguage } from "../context/LanguageContext"; // Import useLanguage
import translationsId from "../translations/id.json";
import translationsEn from "../translations/en.json";

const getTranslations = (lang) => {
  return lang === 'id' ? translationsId : translationsEn;
};

export default function ModalManageCategory({ isOpen, onClose, onSave, initialData }) {
  const { language } = useLanguage();
  const t = getTranslations(language).pageMyWork; // Menggunakan terjemahan dari PageMyWork

  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");

  const isEditing = Boolean(initialData && initialData.key);

  useEffect(() => {
    if (isOpen) {
      if (isEditing && initialData) {
        setName(initialData.name || "");
        setIcon(initialData.icon || "fas fa-tag text-gray-400");
      } else {
        setName("");
        setIcon("fas fa-tag text-gray-400");
      }
    }
  }, [isOpen, initialData, isEditing]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      let finalIcon = icon.trim() || 'fas fa-tag text-gray-400';
      let finalIconColor = 'text-gray-400';
      const colorMatch = finalIcon.match(/text-([a-z]+(?:-\d+)?(?:-\d+)?)/);
      if (colorMatch && colorMatch[0]) {
        finalIconColor = colorMatch[0];
      }
      onSave({
        key: initialData?.key,
        name: name.trim(),
        icon: finalIcon,
        iconColor: finalIconColor,
      });
      onClose();
    } else {
      alert(t.categoryNameEmpty); // Menggunakan terjemahan
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal active">
      <div className="modal-content">
        <form onSubmit={handleSubmit}>
          <div className="modal-header">
            <h2 className="modal-title flex items-center">
              <FontAwesomeIcon icon={isEditing ? faEdit : faFolderPlus} className="mr-2 w-5 h-5" />
              {isEditing ? t.modalEditCategoryTitle : t.modalAddCategoryTitle}
            </h2>
            <button type="button" className="modal-close-btn" onClick={onClose}>&times;</button>
          </div>
          <div className="form-group">
            <label htmlFor="categoryNameInputModal">{t.categoryName}</label>
            <input
              id="categoryNameInputModal"
              type="text"
              className="w-full p-2.5 px-3 rounded-md bg-white/5 border border-white/20 text-gray-200 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder={t.categoryNamePlaceholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="categoryIconInputModal">{t.categoryIcon}</label>
            <input
              id="categoryIconInputModal"
              type="text"
              className="w-full p-2.5 px-3 rounded-md bg-white/5 border border-white/20 text-gray-200 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder={t.categoryIconPlaceholder}
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              {t.categoryIconHint}
            </p>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-secondary px-4 py-2 text-sm rounded">
              {t.cancel}
            </button>
            <button type="submit" className="btn-primary px-4 py-2 text-sm rounded">
              {isEditing ? t.saveCategoryChanges : t.saveCategory}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
