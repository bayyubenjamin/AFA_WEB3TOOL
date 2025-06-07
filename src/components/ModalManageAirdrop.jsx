// src/components/ModalManageAirdrop.jsx

export default function ModalManageAirdrop({ /* ...props... */ }) {
  const { language } = useLanguage();
  
  // ==================== PERBAIKI BARIS INI ====================
  // SEBELUM:
  // const t = getTranslations(language).myWorkPage;
  
  // SESUDAH:
  const t = getTranslations(language).modalManageAirdrop; // Langsung menunjuk ke objek yang benar
  // ==========================================================
  
  const [formData, setFormData] = useState({
    // ...
  });

  // ... sisa kode tidak perlu diubah ...

  return (
    <div className="modal active">
      <div className="modal-content max-w-2xl bg-gray-800 text-gray-100 rounded-xl shadow-lg">
        <div className="modal-header border-b border-gray-700 pb-4 mb-6">
            {/* Kode ini sekarang aman karena 't' sudah benar */}
            <h3 className="modal-title text-xl font-semibold text-white">{initialData ? t.editAirdropTitle : t.addAirdropTitle}</h3>
            {/* ... */}
        </div>
        {/* ... sisa JSX ... */}
      </div>
    </div>
  );
}
