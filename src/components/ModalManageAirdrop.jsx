// src/components/ModalManageAirdrop.jsx
import React, { useState, useEffect } from "react";

export default function ModalManageAirdrop({ isOpen, onClose, onSave, initialData, categories, defaultCategoryKey }) {
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
    // Pastikan category_id diatur dengan defaultCategoryKey saat menambah baru
    // atau mempertahankan nilai existing saat mengedit
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
        ...prevFormData, // Pertahankan nilai dari state sebelumnya
        id: null,
        name: '',
        link: '',
        description: '',
        category_id: defaultCategoryKey || '', // Atur default category jika ada
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
          <h3 className="modal-title text-xl font-semibold text-white">{initialData ? "Edit Garapan" : "Tambah Garapan Baru"}</h3>
          <button className="modal-close-btn text-gray-400 hover:text-white transition-colors duration-200" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 pt-0">
          {/* Grouping Fields in Two Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-6">
            {/* Nama Proyek Airdrop */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Nama Proyek Airdrop <span className="text-red-500">*</span></label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="form-input w-full p-2.5 rounded-md bg-gray-700 border border-gray-600 focus:ring-primary focus:border-primary placeholder-gray-500 text-white"
                placeholder="Contoh: ZK Sync Mainnet"
                required
              />
            </div>

            {/* Link */}
            <div>
              <label htmlFor="link" className="block text-sm font-medium text-gray-300 mb-1">Link</label>
              <input
                type="url"
                id="link"
                name="link"
                value={formData.link}
                onChange={handleChange}
                className="form-input w-full p-2.5 rounded-md bg-gray-700 border border-gray-600 focus:ring-primary focus:border-primary placeholder-gray-500 text-white"
                placeholder="https://zeachain.com/testnet-tasks"
              />
            </div>

            {/* Kategori */}
            <div>
              <label htmlFor="category_id" className="block text-sm font-medium text-gray-300 mb-1">Kategori <span className="text-red-500">*</span></label>
              <select
                id="category_id"
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                className="form-input w-full p-2.5 rounded-md bg-gray-700 border border-gray-600 focus:ring-primary focus:border-primary text-white appearance-none"
                required
              >
                <option value="">--Pilih Kategori--</option>
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-1">Status <span className="text-red-500">*</span></label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="form-input w-full p-2.5 rounded-md bg-gray-700 border border-gray-600 focus:ring-primary focus:border-primary text-white appearance-none"
                required
              >
                <option value="in progress">Sedang dikerjakan (In Progress)</option>
                <option value="completed">Selesai</option>
              </select>
            </div>
          </div> {/* End of Two Columns */}

          {/* Deskripsi Tugas Singkat */}
          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">Deskripsi Tugas Singkat (Opsional)</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="form-input w-full p-2.5 h-24 rounded-md bg-gray-700 border border-gray-600 focus:ring-primary focus:border-primary placeholder-gray-500 text-white resize-y"
              placeholder="Contoh: Swap & Stake mingguan"
            ></textarea>
          </div>
          
          <div className="modal-footer flex justify-end space-x-3 pt-6 border-t border-gray-700">
            <button type="button" onClick={onClose} className="btn-secondary px-5 py-2.5 rounded-md font-semibold transition-colors duration-200">Batal</button>
            <button type="submit" className="btn-primary px-5 py-2.5 rounded-md font-semibold transition-colors duration-200">Simpan Garapan</button>
          </div>
        </form>
      </div>
    </div>
  );
}
