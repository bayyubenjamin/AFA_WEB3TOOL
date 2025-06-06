import React, { useEffect, useState, useCallback, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTasks, faPlus, faFolderPlus, faEllipsisV, faArrowUp, faArrowDown, faEdit, faTrashAlt,
  faCheckCircle as fasFaCheckCircle, faSpinner, faExclamationTriangle,
  faFlask, faHistory, faMobileAlt, faTag, faCalendarCheck, faPuzzlePiece, faServer
} from "@fortawesome/free-solid-svg-icons";
import { faCheckCircle as farFaCheckCircle } from "@fortawesome/free-regular-svg-icons";
import { supabase } from '../supabaseClient';
import ModalManageAirdrop from "./ModalManageAirdrop";
import ModalManageCategory from "./ModalManageCategory";

// Komponen helper ConfirmDeleteModal
const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;
  return ( <div className="modal active"> <div className="modal-content max-w-sm"> <div className="modal-header"> <h3 className="modal-title">{title}</h3> <button className="modal-close-btn" onClick={onClose}>&times;</button> </div> <p className="text-gray-300 my-4">{message}</p> <div className="modal-footer"> <button onClick={onClose} className="btn-secondary">Batal</button> <button onClick={onConfirm} className="btn-danger">Ya, Hapus</button> </div> </div> </div> );
};

// Komponen helper untuk mendapatkan objek ikon FontAwesome
const getIconObjectFromString = (iconString) => {
  if (!iconString || typeof iconString !== 'string') return faTag;
  const iconName = iconString.replace('fas fa-', '');
  const iconMap = { flask: faFlask, history: faHistory, 'mobile-alt': faMobileAlt, tag: faTag, 'calendar-check': faCalendarCheck, 'puzzle-piece': faPuzzlePiece, server: faServer };
  return iconMap[iconName] || faTag;
};

// Definisikan daftar warna Tailwind CSS
const tailwindColors = [
  'text-blue-400', 'text-purple-400', 'text-green-400', 'text-orange-400', 
  'text-red-400', 'text-yellow-400', 'text-pink-400', 'text-teal-400', 
  'text-indigo-400', 'text-cyan-400', 'text-lime-400', 'text-fuchsia-400',
  'text-gray-400',
  'text-lime-500', 'text-emerald-500', 'text-sky-500', 'text-rose-500' 
];

// Fungsi untuk mendapatkan kelas warna acak
const getRandomColorClass = () => {
  const randomIndex = Math.floor(Math.random() * tailwindColors.length);
  return tailwindColors[randomIndex];
};

// Komponen Notifikasi Toast
const Notification = ({ message, type, onClose }) => {
  if (!message) return null;
  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
  return (
    <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg text-white ${bgColor} z-50`}>
      <div className="flex justify-between items-center">
        <span>{message}</span>
        <button onClick={onClose} className="ml-4 text-white font-bold">&times;</button>
      </div>
    </div>
  );
};


export default function PageMyWork({ currentUser }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [expandedCategories, setExpandedCategories] = useState(new Set()); 
  const [notification, setNotification] = useState(null); // State untuk notifikasi

  const [showManageCategoryModal, setShowManageCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showManageAirdropModal, setShowManageAirdropModal] = useState(false);
  const [editingAirdrop, setEditingAirdrop] = useState(null);
  const [categoryForNewAirdrop, setCategoryForNewAirdrop] = useState(null);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [openDropdownKey, setOpenDropdownKey] = useState(null);
  const dropdownRefs = useRef({});

  // Fungsi utama untuk mengambil semua data dari Supabase (Hanya dipanggil saat mount pertama)
  const fetchData = useCallback(async () => {
    if (!currentUser || !currentUser.id) {
        setLoading(false);
        setError("Anda harus login untuk melihat data garapan.");
        return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('user_categories')
        .select(`*, user_airdrops (*)`)
        .eq('user_id', currentUser.id)
        .order('display_order', { ascending: true });

      if (fetchError) throw fetchError;
      
      const sortedData = data.map(cat => ({
          ...cat,
          user_airdrops: cat.user_airdrops ? cat.user_airdrops.sort((a, b) => (a.name || '').localeCompare(b.name || '')) : []
      }));
      
      setCategories(sortedData || []);
      console.log("Fetched categories:", sortedData);

    } catch (err) {
      console.error("Error fetching my work data:", err);
      setError("Gagal memuat data garapan. Pastikan RLS Policy sudah benar.");
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Efek untuk memuat data pertama kali saat komponen di-mount atau currentUser berubah
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // Efek untuk handle klik di luar dropdown
  useEffect(() => { 
    const handleClickOutside = (event) => { 
      if (openDropdownKey && dropdownRefs.current[openDropdownKey] && !dropdownRefs.current[openDropdownKey].contains(event.target)) { 
        setOpenDropdownKey(null); 
      } 
    }; 
    document.addEventListener("mousedown", handleClickOutside); 
    return () => { document.removeEventListener("mousedown", handleClickOutside); }; 
  }, [openDropdownKey]);

  // Efek untuk menghilangkan notifikasi setelah beberapa detik
  useEffect(() => {
      if (notification) {
          const timer = setTimeout(() => {
              setNotification(null);
          }, 3000); // Notifikasi akan hilang setelah 3 detik
          return () => clearTimeout(timer);
      }
  }, [notification]);
  
  // ===========================================
  // FUNGSI-FUNGSI CRUD (Update State Secara Langsung)
  // ===========================================

  const handleSaveCategory = async ({ key, name, icon, iconColor }) => {
    if (!name.trim() || !currentUser) return;

    let categoryData = {
        name: name,
        icon: icon,
        user_id: currentUser.id,
    };
    
    let error;
    if (editingCategory) {
        categoryData.iconColor = iconColor;
        // UPDATE DATABASE
        ({ error } = await supabase.from('user_categories').update({ name, icon, iconColor }).eq('id', editingCategory.id).eq('user_id', currentUser.id));

        if (!error) {
            // UPDATE STATE LOKAL
            setCategories(prevCategories => prevCategories.map(cat => 
                cat.id === editingCategory.id ? { ...cat, ...categoryData } : cat
            ));
            setNotification({ message: "Kategori berhasil diperbarui!", type: "success" });
        }
    } else {
        categoryData.iconColor = getRandomColorClass();
        const { count } = await supabase.from('user_categories').select('*', { count: 'exact', head: true }).eq('user_id', currentUser.id);
        categoryData.display_order = count || 0;
        
        // INSERT DATABASE
        const { data: newCategoryArr, error: insertError } = await supabase.from('user_categories').insert(categoryData).select(); // Tambahkan .select() untuk mendapatkan ID baru

        if (insertError) {
            error = insertError; // Set error agar masuk ke block alert error
        } else if (newCategoryArr && newCategoryArr.length > 0) {
            const newCategory = { ...newCategoryArr[0], user_airdrops: [] }; // Inisialisasi airdrops kosong
            // UPDATE STATE LOKAL
            setCategories(prevCategories => [...prevCategories, newCategory].sort((a,b) => a.display_order - b.display_order));
            setNotification({ message: "Kategori baru berhasil ditambahkan!", type: "success" });
        } else {
            error = { message: "Gagal menambahkan kategori: Data tidak ditemukan setelah insert." };
        }
    }

    if (error) { 
      console.error("Error saving category:", error);
      setNotification({ message: "Gagal menyimpan kategori: " + error.message, type: "error" }); 
    }
    
    setShowManageCategoryModal(false);
    setEditingCategory(null);
  };
  
  const handleConfirmDelete = async () => {
    if (!deleteTarget || !currentUser) return;

    let error;
    if (deleteTarget.type === 'category') {
        // DELETE DATABASE
        ({ error } = await supabase.from('user_categories').delete().eq('id', deleteTarget.id).eq('user_id', currentUser.id));
        if (!error) {
            // UPDATE STATE LOKAL
            setCategories(prevCategories => prevCategories.filter(cat => cat.id !== deleteTarget.id));
            setNotification({ message: `Berhasil menghapus kategori "${deleteTarget.name}"!`, type: "success" });
        }
    } else if (deleteTarget.type === 'item') {
        // DELETE DATABASE
        ({ error } = await supabase.from('user_airdrops').delete().eq('id', deleteTarget.id).eq('user_id', currentUser.id));
        if (!error) {
            // UPDATE STATE LOKAL
            setCategories(prevCategories => prevCategories.map(cat => ({
                ...cat,
                user_airdrops: cat.user_airdrops.filter(item => item.id !== deleteTarget.id)
            })));
            setNotification({ message: `Berhasil menghapus garapan "${deleteTarget.name}"!`, type: "success" });
        }
    }
    
    if (error) { 
      console.error("Error deleting item:", error);
      setNotification({ message: `Gagal menghapus: ${error.message}`, type: "error" }); 
    }
    
    setShowConfirmDeleteModal(false);
    setDeleteTarget(null);
  };
  
  const handleSaveAirdrop = async (airdropData) => {
    if (!airdropData.name || !airdropData.category_id || !currentUser) {
        setNotification({ message: "Nama dan Kategori Airdrop wajib diisi.", type: "error" }); return;
    }
    
    const dataToSave = { ...airdropData, user_id: currentUser.id };
    if (!editingAirdrop) { delete dataToSave.id; }

    let error;
    if (editingAirdrop) {
        // UPDATE DATABASE
        ({ error } = await supabase.from('user_airdrops').update(dataToSave).eq('id', editingAirdrop.id).eq('user_id', currentUser.id));

        if (!error) {
            // UPDATE STATE LOKAL
            setCategories(prevCategories => prevCategories.map(cat => {
                if (cat.id === airdropData.category_id) { // Cari kategori yang relevan
                    return {
                        ...cat,
                        user_airdrops: cat.user_airdrops.map(item =>
                            item.id === editingAirdrop.id ? { ...item, ...dataToSave } : item
                        ).sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                    };
                }
                return cat;
            }));
            setNotification({ message: "Garapan berhasil diperbarui!", type: "success" });
        }

    } else {
        // INSERT DATABASE
        const { data: newAirdropArr, error: insertError } = await supabase.from('user_airdrops').insert(dataToSave).select(); // Dapatkan ID baru
        if (insertError) {
            error = insertError;
        } else if (newAirdropArr && newAirdropArr.length > 0) {
            const newAirdrop = newAirdropArr[0];
            // UPDATE STATE LOKAL
            setCategories(prevCategories => prevCategories.map(cat => {
                if (cat.id === newAirdrop.category_id) {
                    return {
                        ...cat,
                        user_airdrops: [...cat.user_airdrops, newAirdrop].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                    };
                }
                return cat;
            }));
            setNotification({ message: "Garapan baru berhasil ditambahkan!", type: "success" });
        } else {
            error = { message: "Gagal menambahkan garapan: Data tidak ditemukan setelah insert." };
        }
    }

    if (error) { 
      console.error("Error saving airdrop:", error);
      setNotification({ message: "Gagal menyimpan garapan: " + error.message, type: "error" }); 
    }
    
    setShowManageAirdropModal(false);
    setEditingAirdrop(null);
    setCategoryForNewAirdrop(null);
  };

  const handleToggleDailyDone = async (item) => {
      const newDailyDoneStatus = !item.daily_done;
      // UPDATE DATABASE
      const { error } = await supabase.from('user_airdrops').update({ daily_done: newDailyDoneStatus }).eq('id', item.id).eq('user_id', currentUser.id);
      
      if(error) { 
        console.error("Error toggling daily done:", error);
        setNotification({ message: "Gagal update status daily: " + error.message, type: "error" }); 
      } 
      else { 
        // UPDATE STATE LOKAL
        setCategories(prevCategories => prevCategories.map(cat => ({
            ...cat,
            user_airdrops: cat.user_airdrops.map(airdrop => 
                airdrop.id === item.id ? { ...airdrop, daily_done: newDailyDoneStatus } : airdrop
            )
        })));
        setNotification({ message: "Status garapan diperbarui!", type: "success" }); 
      }
  };
  
  // ===========================================
  // FUNGSI UNTUK MEMINDAHKAN KATEGORI (RE-ORDER)
  // ===========================================
  const handleMoveCategory = useCallback(async (catId, direction) => {
    if (!currentUser || !currentUser.id) {
        setNotification({ message: "Anda harus login untuk memindahkan kategori.", type: "error" });
        return;
    }

    // Buat salinan dan urutkan berdasarkan display_order untuk menemukan indeks yang benar
    const currentCategories = [...categories].sort((a, b) => a.display_order - b.display_order);
    
    const categoryToMoveIndex = currentCategories.findIndex(cat => cat.id === catId);
    if (categoryToMoveIndex === -1) return;

    const categoryToMove = currentCategories[categoryToMoveIndex];
    let targetCategoryIndex;

    if (direction === 'up') {
      if (categoryToMoveIndex === 0) {
        setNotification({ message: "Kategori sudah paling atas.", type: "info" });
        return;
      }
      targetCategoryIndex = categoryToMoveIndex - 1;
    } else { // direction === 'down'
      if (categoryToMoveIndex === currentCategories.length - 1) {
        setNotification({ message: "Kategori sudah paling bawah.", type: "info" });
        return;
      }
      targetCategoryIndex = categoryToMoveIndex + 1;
    }

    const targetCategory = currentCategories[targetCategoryIndex];

    // Swap display_order values (sementara di lokal untuk persiapan update)
    const newOrderCategoryToMove = targetCategory.display_order;
    const newOrderTargetCategory = categoryToMove.display_order;

    try {
      // UPDATE DATABASE (2 kali update)
      const { error: error1 } = await supabase
        .from('user_categories')
        .update({ display_order: newOrderCategoryToMove })
        .eq('id', categoryToMove.id)
        .eq('user_id', currentUser.id); 

      if (error1) throw error1;

      const { error: error2 } = await supabase
        .from('user_categories')
        .update({ display_order: newOrderTargetCategory })
        .eq('id', targetCategory.id)
        .eq('user_id', currentUser.id); 

      if (error2) throw error2;

      // UPDATE STATE LOKAL SETELAH SUKSES DI DATABASE
      setCategories(prevCategories => {
        const updatedCategories = prevCategories.map(cat => {
          if (cat.id === categoryToMove.id) {
            return { ...cat, display_order: newOrderCategoryToMove };
          }
          if (cat.id === targetCategory.id) {
            return { ...cat, display_order: newOrderTargetCategory };
          }
          return cat;
        });
        // Pastikan untuk mengurutkan ulang array setelah perubahan display_order
        return updatedCategories.sort((a, b) => a.display_order - b.display_order);
      });
      
      setOpenDropdownKey(null); 
      setNotification({ message: "Kategori berhasil dipindahkan!", type: "success" }); 
    } catch (err) {
      console.error("Error moving category:", err);
      setNotification({ message: "Gagal memindahkan kategori: " + err.message, type: "error" }); 
    }
  }, [categories, currentUser, setNotification]);

  // Fungsi untuk buka/tutup kategori
  const handleToggleCategory = useCallback((categoryId) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  }, []);

  // Fungsi UI
  const handleToggleDropdown = useCallback((catKey) => setOpenDropdownKey(p => p === catKey ? null : catKey), []);
  const openNewCategoryModal = useCallback(() => { setEditingCategory(null); setShowManageCategoryModal(true); }, []);
  const openEditCategoryModal = useCallback((cat) => { setEditingCategory(cat); setShowManageCategoryModal(true); setOpenDropdownKey(null); }, []);
  const confirmDeleteCategory = useCallback((cat) => { setDeleteTarget({ type: 'category', id: cat.id, name: cat.name }); setShowConfirmDeleteModal(true); setOpenDropdownKey(null); }, []);
  const openNewAirdropModal = useCallback((catId) => { setCategoryForNewAirdrop(catId); setEditingAirdrop(null); setShowManageAirdropModal(true); setOpenDropdownKey(null); }, []);
  const openEditAirdropModal = useCallback((item) => { setEditingAirdrop(item); setCategoryForNewAirdrop(item.category_id); setShowManageAirdropModal(true); }, []);
  const confirmDeleteAirdropItem = useCallback((item) => { setDeleteTarget({ type: 'item', id: item.id, name: item.name }); setShowConfirmDeleteModal(true); }, []);

  if (loading) { return <div className="flex justify-center items-center h-full pt-20"><FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-primary"/></div>; }
  if (error) { return <div className="flex flex-col justify-center items-center h-full text-center text-red-400 pt-20"><FontAwesomeIcon icon={faExclamationTriangle} size="2x" className="mb-3"/><p>{error}</p></div>; }

  return (
    <React.Fragment>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      <section className="page-content space-y-6 pt-6">
        <div className="card rounded-xl p-4 md:p-6">
          <div className="main-category-header">
            <h2 className="text-xl font-semibold text-primary flex items-center"> <FontAwesomeIcon icon={faTasks} className="mr-2 w-5 h-5" /> Daftar Garapan Airdrop </h2>
            <div className="flex space-x-2"> <button onClick={openNewCategoryModal} className="btn-secondary text-xs px-3 py-1.5 rounded-md flex items-center"> <FontAwesomeIcon icon={faFolderPlus} className="mr-1.5 w-3 h-3" />Kategori </button> </div>
          </div>
          {categories.length === 0 && ( <p className="text-gray-400 text-sm text-center py-4">Belum ada kategori. Klik "+ Kategori" untuk memulai.</p> )}
          <div className="space-y-4">
            {categories.map((category, index) => {
              const itemsInCategory = category.user_airdrops || [];
              const categoryIsEmpty = itemsInCategory.length === 0;
              const iconObject = getIconObjectFromString(category.icon);
              const isExpanded = expandedCategories.has(category.id); 

              const categoryColorClass = category.iconColor || 'text-gray-400';

              return (
                <div key={category.id} className="category-wrapper">
                  <div 
                      className="category-header" 
                      role="button" 
                      tabIndex={0} 
                      onClick={() => handleToggleCategory(category.id)} 
                  >
                    <div className={`category-title-container flex items-center ${categoryColorClass}`}> 
                      <FontAwesomeIcon icon={iconObject} className={`mr-2 w-4 h-4`} /> 
                      <span className="category-title-text">{category.name}</span> 
                      <span className="category-count">({itemsInCategory.length})</span> 
                    </div>
                    <div className="category-settings-dropdown" ref={el => dropdownRefs.current[category.id] = el}>
                      <button onClick={(e) => { e.stopPropagation(); handleToggleDropdown(category.id); }} className="category-settings-dropdown-button" title="Pengaturan Kategori"><FontAwesomeIcon icon={faEllipsisV} className="w-4 h-4" /></button>
                      <div className={`category-settings-dropdown-content ${openDropdownKey === category.id ? 'active' : ''}`}>
                          <button onClick={(e) => {e.stopPropagation(); handleMoveCategory(category.id, 'up');}} disabled={index === 0}> <FontAwesomeIcon icon={faArrowUp} /> Pindah ke Atas </button>
                          <button onClick={(e) => {e.stopPropagation(); handleMoveCategory(category.id, 'down');}} disabled={index === categories.length - 1}> <FontAwesomeIcon icon={faArrowDown} /> Pindah ke Bawah </button>
                          <button onClick={(e) => {e.stopPropagation(); openEditCategoryModal(category);}} className="edit-option"> <FontAwesomeIcon icon={faEdit} /> Edit Kategori </button>
                          <button onClick={(e) => {e.stopPropagation(); openNewAirdropModal(category.id);}} className="add-option"> <FontAwesomeIcon icon={faPlus} /> Tambah Garapan </button>
                          <button onClick={(e) => {e.stopPropagation(); confirmDeleteCategory(category);}} className="delete-option"> <FontAwesomeIcon icon={faTrashAlt} /> Hapus Kategori </button>
                      </div>
                    </div>
                  </div>
                  <ul className={`airdrop-list-container ${isExpanded ? 'expanded' : 'collapsed'}`}> 
                    {categoryIsEmpty ? ( <p className="empty-category-message">Belum ada garapan di kategori ini.</p> ) : ( itemsInCategory.map(item => ( <li key={item.id} className="airdrop-list-item"> <div className="airdrop-item-main"> <button onClick={() => handleToggleDailyDone(item)} className={`btn-done-today ${item.daily_done ? 'marked' : ''}`} > <FontAwesomeIcon icon={item.daily_done ? fasFaCheckCircle : farFaCheckCircle} className="w-4 h-4" /> </button> <a href={item.link} target="_blank" rel="noopener noreferrer" className="airdrop-link"> <div className="ml-1"> <span className="name">{item.name}</span> <p className="task-desc">{item.description || 'Tidak ada deskripsi'}</p> </div> </a> </div> <span className={`status-badge ${item.status === 'completed' ? 'status-completed' : 'status-inprogress'}`}> {item.status === 'completed' ? 'Selesai' : 'Dikerjakan'} </span> <div className="airdrop-item-actions"> <button onClick={() => openEditAirdropModal(item)} className="edit-btn" title="Edit Garapan"> <FontAwesomeIcon icon={faEdit} className="w-3.5 h-3.5" /> </button> <button onClick={() => confirmDeleteAirdropItem(item)} className="delete-btn" title="Hapus Garapan"> <FontAwesomeIcon icon={faTrashAlt} className="w-3.5 h-3.5" /> </button> </div> </li> )) )}
                  </ul>
                </div> 
              );
            })}
          </div>
        </div>
        {showManageCategoryModal && ( <ModalManageCategory isOpen={showManageCategoryModal} onClose={() => setShowManageCategoryModal(false)} onSave={handleSaveCategory} initialData={editingCategory} /> )}
        {showManageAirdropModal && (
          <ModalManageAirdrop
            isOpen={showManageAirdropModal}
            onClose={() => setShowManageAirdropModal(false)}
            onSave={handleSaveAirdrop}
            initialData={editingAirdrop}
            categories={categories.map(c => ({ value: c.id, label: c.name }))}
            defaultCategoryKey={categoryForNewAirdrop}
          />
        )}
        <ConfirmDeleteModal isOpen={showConfirmDeleteModal} onClose={() => setShowConfirmDeleteModal(false)} onConfirm={handleConfirmDelete} title={`Konfirmasi Hapus ${deleteTarget?.type === 'category' ? 'Kategori' : 'Garapan'}`} message={`Apakah Anda yakin ingin menghapus "${deleteTarget?.name}"? ${deleteTarget?.type === 'category' ? 'Semua garapan di dalamnya juga akan dihapus (jika ON DELETE CASCADE aktif).' : ''} Tindakan ini tidak dapat diurungkan.`} />
      </section>
    </React.Fragment>
  );
}
