// src/components/ModalManageCategory.jsx

export default function ModalManageCategory({ isOpen, onClose, onSave, initialData }) {
  const { language } = useLanguage();
  
  // ==================== PERBAIKI BARIS INI ====================
  // SEBELUM:
  // const t = getTranslations(language).myWorkPage;
  
  // SESUDAH:
  const t = getTranslations(language).modalManageCategory; // Langsung menunjuk ke objek yang benar
  // ==========================================================

  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");

  // ... sisa kode tidak perlu diubah ...
  
  const handleSubmit = (e) => {
    // ...
    // Kode ini sekarang aman karena 't' sudah benar
    // Contoh: alert(t.emptyNameAlert); 
  };

  return (
    <div className="modal active">
      <div className="modal-content">
        <form onSubmit={handleSubmit}>
          <div className="modal-header">
            <h2 className="modal-title flex items-center">
              <FontAwesomeIcon /* ... */ />
              {/* Kode ini sekarang aman karena 't' sudah benar */}
              {isEditing ? t.editCategoryTitle : t.addCategoryTitle}
            </h2>
            {/* ... */}
          </div>
          {/* ... sisa JSX ... */}
        </form>
      </div>
    </div>
  );
}
