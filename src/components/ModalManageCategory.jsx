// src/components/ModalManageCategory.jsx
import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFolderPlus, faEdit } from "@fortawesome/free-solid-svg-icons";

export default function ModalManageCategory({ isOpen, onClose, onSave, initialData }) {
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
      alert("Nama kategori tidak boleh kosong.");
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
              {isEditing ? "Edit Kategori" : "Tambah Kategori Baru"}
            </h2>
            <button type="button" className="modal-close-btn" onClick={onClose}>&times;</button>
          </div>
          <div className="form-group">
            <label htmlFor="categoryNameInputModal">Nama Kategori</label>
            <input
              id="categoryNameInputModal"
              type="text"
              className="w-full p-2.5 px-3 rounded-md bg-white/5 border border-white/20 text-gray-200 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="Contoh: DeFi Tasks"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="categoryIconInputModal">Kelas Ikon Font Awesome (Opsional)</label>
            <input
              id="categoryIconInputModal"
              type="text"
              className="w-full p-2.5 px-3 rounded-md bg-white/5 border border-white/20 text-gray-200 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="fas fa-coins atau fas fa-rocket text-blue-400"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Format: `prefix nama-ikon warna-tailwind` (mis: `fas fa-flask text-green-400`).
            </p>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-secondary px-4 py-2 text-sm rounded">
              Batal
            </button>
            <button type="submit" className="btn-primary px-4 py-2 text-sm rounded">
              {isEditing ? "Simpan Perubahan" : "Simpan Kategori"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
