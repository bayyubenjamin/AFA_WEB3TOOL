// src/components/PageMyWork.jsx
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
import { useLanguage } from "../context/LanguageContext"; // PERBAIKAN DI SINI: Ganti "../context/LanguageContext"
import translationsId from "../translations/id.json";
import translationsEn from "../translations/en.json";

const getTranslations = (lang) => {
  return lang === 'id' ? translationsId : translationsEn;
};

// Komponen helper ConfirmDeleteModal
const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, title, message, cancelText, confirmText }) => {
  if (!isOpen) return null;
  return (
    <div className="modal active">
      <div className="modal-content max-w-sm">
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>
        <p className="text-gray-300 my-4">{message}</p>
        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">{cancelText}</button>
          <button onClick={onConfirm} className="btn-danger">{confirmText}</button>
        </div>
      </div>
    </div>
  );
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
  const { language } = useLanguage();
  const t = getTranslations(language);
  const pageMyWorkT = t.myWorkPage;
  const modalAirdropT = t.modalManageAirdrop;

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [notification, setNotification] = useState(null);

  const [showManageCategoryModal, setShowManageCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showManageAirdropModal, setShowManageAirdropModal] = useState(false);
  const [editingAirdrop, setEditingAirdrop] = useState(null);
  const [categoryForNewAirdrop, setCategoryForNewAirdrop] = useState(null);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [openDropdownKey, setOpenDropdownKey] = useState(null);
  const dropdownRefs = useRef({});

  const fetchData = useCallback(async () => {
    if (!currentUser || !currentUser.id) {
        setLoading(false);
        setError(pageMyWorkT.errorAuth);
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

      // ========================= PERBAIKAN UTAMA PENYEBAB CRASH =========================
      const processedData = data.map(cat => {
          const validAirdrops = (cat.user_airdrops || []).filter(item => item != null);
          validAirdrops.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
          return {
              ...cat,
              user_airdrops: validAirdrops
          };
      });
      // ==================================================================================

      setCategories(processedData || []);
    } catch (err) {
      console.error("Error fetching my work data:", err);
      setError(pageMyWorkT.errorFetch);
    } finally {
      setLoading(false);
    }
  }, [currentUser, pageMyWorkT]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdownKey && dropdownRefs.current[openDropdownKey] && !dropdownRefs.current[openDropdownKey].contains(event.target)) {
        setOpenDropdownKey(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => { document.removeEventListener("mousedown", handleClickOutside); };
  }, [openDropdownKey]);

  useEffect(() => {
      if (notification) {
          const timer = setTimeout(() => {
              setNotification(null);
          }, 3000);
          return () => clearTimeout(timer);
      }
  }, [notification]);

  const handleSaveCategory = async ({ name, icon, iconColor }) => {
    if (!name.trim() || !currentUser) return;

    let categoryData = {
        name: name,
        icon: icon,
        user_id: currentUser.id,
    };

    let error;
    if (editingCategory) {
        categoryData.iconColor = iconColor;
        ({ error } = await supabase.from('user_categories').update({ name, icon, iconColor }).eq('id', editingCategory.id).eq('user_id', currentUser.id));

        if (!error) {
            setCategories(prevCategories => prevCategories.map(cat =>
                cat.id === editingCategory.id ? { ...cat, name, icon, iconColor } : cat
            ));
            setNotification({ message: pageMyWorkT.notificationSaveCategorySuccess, type: "success" });
        }
    } else {
        categoryData.iconColor = getRandomColorClass();
        const { count } = await supabase.from('user_categories').select('*', { count: 'exact', head: true }).eq('user_id', currentUser.id);
        categoryData.display_order = count || 0;

        const { data: newCategoryArr, error: insertError } = await supabase.from('user_categories').insert(categoryData).select();

        if (insertError) {
            error = insertError;
        } else if (newCategoryArr && newCategoryArr.length > 0) {
            const newCategory = { ...newCategoryArr[0], user_airdrops: [] };
            setCategories(prevCategories => [...prevCategories, newCategory].sort((a,b) => a.display_order - b.display_order));
            setNotification({ message: pageMyWorkT.notificationSaveCategorySuccess, type: "success" });
        } else {
            error = { message: pageMyWorkT.notificationSaveCategoryError + "Data not found after insert." };
        }
    }

    if (error) {
      console.error("Error saving category:", error);
      setNotification({ message: pageMyWorkT.notificationSaveCategoryError + error.message, type: "error" });
    }

    setShowManageCategoryModal(false);
    setEditingCategory(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || !currentUser) return;

    let error;
    if (deleteTarget.type === 'category') {
        ({ error } = await supabase.from('user_categories').delete().eq('id', deleteTarget.id).eq('user_id', currentUser.id));
        if (!error) {
            setCategories(prevCategories => prevCategories.filter(cat => cat.id !== deleteTarget.id));
            setNotification({ message: pageMyWorkT.notificationDeleteCategorySuccess.replace('{name}', deleteTarget.name), type: "success" });
        }
    } else if (deleteTarget.type === 'item') {
        ({ error } = await supabase.from('user_airdrops').delete().eq('id', deleteTarget.id).eq('user_id', currentUser.id));
        if (!error) {
            setCategories(prevCategories => prevCategories.map(cat => ({
                ...cat,
                user_airdrops: cat.user_airdrops.filter(item => item.id !== deleteTarget.id)
            })));
            const message = (pageMyWorkT.notificationDeleteTaskSuccess || "Successfully deleted task \"{name}\"!").replace('{name}', deleteTarget.name);
            setNotification({ message, type: "success" }); 
        }
    }

    if (error) {
      console.error("Error deleting item:", error);
      setNotification({ message: pageMyWorkT.notificationDeleteCategoryError + error.message, type: "error" });
    }

    setShowConfirmDeleteModal(false);
    setDeleteTarget(null);
  };

  const handleSaveAirdrop = async (airdropData) => {
    if (!airdropData.name || !airdropData.category_id || !currentUser) {
        setNotification({ message: modalAirdropT.requiredFieldsAlert, type: "error" }); 
        return;
    }

    const dataToSave = { ...airdropData, user_id: currentUser.id };
    if (!editingAirdrop) { delete dataToSave.id; }

    let error;
    if (editingAirdrop) {
        ({ error } = await supabase.from('user_airdrops').update(dataToSave).eq('id', editingAirdrop.id).eq('user_id', currentUser.id));
    } else {
        ({ error } = await supabase.from('user_airdrops').insert(dataToSave).select());
    }

    if (error) {
        console.error("Error saving airdrop:", error);
        setNotification({ message: pageMyWorkT.notificationSaveAirdropError + error.message, type: "error" });
    } else {
        await fetchData();
        setNotification({ message: pageMyWorkT.notificationSaveAirdropSuccess, type: "success" });
    }

    setShowManageAirdropModal(false);
    setEditingAirdrop(null);
    setCategoryForNewAirdrop(null);
  };

  const handleToggleDailyDone = async (item) => {
      const newDailyDoneStatus = !item.daily_done;
      const { error } = await supabase.from('user_airdrops').update({ daily_done: newDailyDoneStatus }).eq('id', item.id).eq('user_id', currentUser.id);

      if(error) {
        console.error("Error toggling daily done:", error);
        setNotification({ message: "Failed to update daily status: " + error.message, type: "error" });
      } else {
        setCategories(prevCategories => prevCategories.map(cat => ({
            ...cat,
            user_airdrops: cat.user_airdrops.map(airdrop =>
                airdrop.id === item.id ? { ...airdrop, daily_done: newDailyDoneStatus } : airdrop
            )
        })));
      }
  };

  const handleMoveCategory = useCallback(async (catId, direction) => {
    if (!currentUser || !currentUser.id) {
        setNotification({ message: pageMyWorkT.errorAuth, type: "error" });
        return;
    }

    const currentCategories = [...categories].sort((a, b) => a.display_order - b.display_order);

    const categoryToMoveIndex = currentCategories.findIndex(cat => cat.id === catId);
    if (categoryToMoveIndex === -1) return;

    const categoryToMove = currentCategories[categoryToMoveIndex];
    let targetCategoryIndex;

    if (direction === 'up') {
      if (categoryToMoveIndex === 0) return;
      targetCategoryIndex = categoryToMoveIndex - 1;
    } else {
      if (categoryToMoveIndex === currentCategories.length - 1) return;
      targetCategoryIndex = categoryToMoveIndex + 1;
    }

    const targetCategory = currentCategories[targetCategoryIndex];
    const newOrderCategoryToMove = targetCategory.display_order;
    const newOrderTargetCategory = categoryToMove.display_order;

    try {
      await supabase.from('user_categories').update({ display_order: newOrderCategoryToMove }).eq('id', categoryToMove.id);
      await supabase.from('user_categories').update({ display_order: newOrderTargetCategory }).eq('id', targetCategory.id);
      await fetchData(); 
      setOpenDropdownKey(null);
      setNotification({ message: pageMyWorkT.categoryMoved, type: "success" });
    } catch (err) {
      console.error("Error moving category:", err);
      setNotification({ message: "Failed to move category: " + err.message, type: "error" });
    }
  }, [categories, currentUser, pageMyWorkT, fetchData]);

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
            <h2 className="text-xl font-semibold text-primary flex items-center"> <FontAwesomeIcon icon={faTasks} className="mr-2 w-5 h-5" /> {pageMyWorkT.mainHeader} </h2>
            <div className="flex space-x-2"> <button onClick={openNewCategoryModal} className="btn-secondary text-xs px-3 py-1.5 rounded-md flex items-center"> <FontAwesomeIcon icon={faFolderPlus} className="mr-1.5 w-3 h-3" />{pageMyWorkT.addCategory} </button> </div>
          </div>
          {categories.length === 0 && ( <p className="text-gray-400 text-sm text-center py-4">{pageMyWorkT.emptyCategory}</p> )}
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
                      <span className="category-count">({itemsInCategory.length} {pageMyWorkT.itemsInCategory})</span>
                    </div>
                    <div className="category-settings-dropdown" ref={el => dropdownRefs.current[category.id] = el}>
                      <button onClick={(e) => { e.stopPropagation(); handleToggleDropdown(category.id); }} className="category-settings-dropdown-button" title={pageMyWorkT.categorySettings}><FontAwesomeIcon icon={faEllipsisV} className="w-4 h-4" /></button>
                      <div className={`category-settings-dropdown-content ${openDropdownKey === category.id ? 'active' : ''}`}>
                          <button onClick={(e) => {e.stopPropagation(); handleMoveCategory(category.id, 'up');}} disabled={index === 0}> <FontAwesomeIcon icon={faArrowUp} /> {pageMyWorkT.moveUp} </button>
                          <button onClick={(e) => {e.stopPropagation(); handleMoveCategory(category.id, 'down');}} disabled={index === categories.length - 1}> <FontAwesomeIcon icon={faArrowDown} /> {pageMyWorkT.moveDown} </button>
                          <button onClick={(e) => {e.stopPropagation(); openEditCategoryModal(category);}} className="edit-option"> <FontAwesomeIcon icon={faEdit} /> {pageMyWorkT.editCategory} </button>
                          <button onClick={(e) => {e.stopPropagation(); openNewAirdropModal(category.id);}} className="add-option"> <FontAwesomeIcon icon={faPlus} /> {pageMyWorkT.addAirdrop} </button>
                          <button onClick={(e) => {e.stopPropagation(); confirmDeleteCategory(category);}} className="delete-option"> <FontAwesomeIcon icon={faTrashAlt} /> {pageMyWorkT.deleteCategory} </button>
                      </div>
                    </div>
                  </div>
                  <ul className={`airdrop-list-container ${isExpanded ? 'expanded' : 'collapsed'}`}>
                    {categoryIsEmpty ? ( <p className="empty-category-message">{pageMyWorkT.noTasksInCategory}</p> ) : ( itemsInCategory.map(item => ( <li key={item.id} className="airdrop-list-item"> <div className="airdrop-item-main"> <button onClick={() => handleToggleDailyDone(item)} className={`btn-done-today ${item.daily_done ? 'marked' : ''}`} > <FontAwesomeIcon icon={item.daily_done ? fasFaCheckCircle : farFaCheckCircle} className="w-4 h-4" /> </button> <a href={item.link} target="_blank" rel="noopener noreferrer" className="airdrop-link"> <div className="ml-1"> <span className="name">{item.name}</span> <p className="task-desc">{item.description || pageMyWorkT.descriptionPlaceholder}</p> </div> </a> </div> <span className={`status-badge ${item.status === 'completed' ? 'status-completed' : 'status-inprogress'}`}> {item.status === 'completed' ? pageMyWorkT.statusCompleted : pageMyWorkT.statusInProgress} </span> <div className="airdrop-item-actions"> <button onClick={() => openEditAirdropModal(item)} className="edit-btn" title={pageMyWorkT.editTask}> <FontAwesomeIcon icon={faEdit} className="w-3.5 h-3.5" /> </button> <button onClick={() => confirmDeleteAirdropItem(item)} className="delete-btn" title={pageMyWorkT.deleteTask}> <FontAwesomeIcon icon={faTrashAlt} className="w-3.5 h-3.5" /> </button> </div> </li> )) )}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
        {showManageCategoryModal && ( <ModalManageCategory language={language} isOpen={showManageCategoryModal} onClose={() => setShowManageCategoryModal(false)} onSave={handleSaveCategory} initialData={editingCategory} /> )}
        {showManageAirdropModal && (
          <ModalManageAirdrop
            language={language}
            isOpen={showManageAirdropModal}
            onClose={() => setShowManageAirdropModal(false)}
            onSave={handleSaveAirdrop}
            initialData={editingAirdrop}
            categories={categories.map(c => ({ value: c.id, label: c.name }))}
            defaultCategoryKey={categoryForNewAirdrop}
          />
        )}
        <ConfirmDeleteModal
          isOpen={showConfirmDeleteModal}
          onClose={() => setShowConfirmDeleteModal(false)}
          onConfirm={handleConfirmDelete}
          title={deleteTarget?.type === 'category' ? pageMyWorkT.confirmDeleteTitleCategory : pageMyWorkT.confirmDeleteTitleItem}
          message={deleteTarget?.type === 'category' ? pageMyWorkT.confirmDeleteMessageCategory.replace('{name}', deleteTarget.name) : pageMyWorkT.confirmDeleteMessageItem.replace('{name}', deleteTarget.name)}
          cancelText={pageMyWorkT.cancel} 
          confirmText={pageMyWorkT.yesDelete}
        />
      </section>
    </React.Fragment>
  );
}
