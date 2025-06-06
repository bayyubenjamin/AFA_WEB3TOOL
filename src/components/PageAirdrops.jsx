// src/components/PageAirdrops.jsx
import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faStar, faGift, faPlus, faEdit, faTrashAlt, 
  faCalendarAlt, faLink, faInfoCircle, faCheckCircle, faTimesCircle, faClock, faAngleDoubleRight, faCodeBranch,
  faTools, faHourglassHalf, faRocket, faBell // Menambahkan ikon baru untuk Coming Soon
} from "@fortawesome/free-solid-svg-icons";
import { faTelegramPlane, faDiscord, faTwitter } from "@fortawesome/free-brands-svg-icons"; // Menambahkan ikon brand baru

// --- Komponen Pembantu (Sebaiknya dipisah ke file terpisah di aplikasi nyata) ---

// Komponen untuk menampilkan satu kartu Airdrop
const AirdropCard = ({ airdrop, isAdminMode, onEdit, onDelete, onShowDetail }) => {
  const statusColor = {
    'active': 'bg-green-500/20 text-green-300',
    'upcoming': 'bg-blue-500/20 text-blue-300',
    'ended': 'bg-red-500/20 text-red-300'
  }[airdrop.status] || 'bg-gray-500/20 text-gray-300';

  const statusText = {
    'active': 'Aktif',
    'upcoming': 'Mendatang',
    'ended': 'Selesai'
  }[airdrop.status] || 'Unknown';

  return (
    <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden flex flex-col h-full">
      {airdrop.image_url && (
        <img 
          src={airdrop.image_url} 
          alt={airdrop.title} 
          className="w-full h-40 object-cover" 
          onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/400x160/2d2d2d/ffffff?text=Image+Not+Found"; }}
        />
      )}
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-xl font-semibold text-white mb-2">{airdrop.title}</h3>
        <p className="text-gray-300 text-sm mb-4 flex-grow">{airdrop.description}</p>
        <div className="flex flex-wrap gap-2 text-xs font-medium mb-4">
          <span className={`px-2.5 py-1 rounded-full ${statusColor}`}>
            <FontAwesomeIcon icon={faInfoCircle} className="mr-1" /> {statusText}
          </span>
          {airdrop.date && (
            <span className="px-2.5 py-1 rounded-full bg-gray-600/20 text-gray-400">
              <FontAwesomeIcon icon={faCalendarAlt} className="mr-1" /> {airdrop.date}
            </span>
          )}
        </div>
        <button 
          onClick={() => onShowDetail(airdrop)} // Panggil fungsi untuk menampilkan detail modal
          className="btn-primary w-full text-center py-2 rounded-lg font-semibold mt-auto"
        >
          <FontAwesomeIcon icon={faAngleDoubleRight} className="mr-2" /> Detail Airdrop
        </button>
        {isAdminMode && (
          <div className="flex justify-end gap-2 mt-4">
            <button 
              onClick={() => onEdit(airdrop)} 
              className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md transition-colors duration-200"
              title="Edit Airdrop"
            >
              <FontAwesomeIcon icon={faEdit} />
            </button>
            <button 
              onClick={() => onDelete(airdrop.id)} 
              className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-md transition-colors duration-200"
              title="Hapus Airdrop"
            >
              <FontAwesomeIcon icon={faTrashAlt} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Komponen untuk Form Admin Airdrop (Tambah/Edit)
const AdminAirdropForm = ({ airdropToEdit, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    id: airdropToEdit?.id || null,
    title: airdropToEdit?.title || '',
    description: airdropToEdit?.description || '',
    link: airdropToEdit?.link || '',
    type: airdropToEdit?.type || 'free',
    status: airdropToEdit?.status || 'active',
    image_url: airdropToEdit?.image_url || '',
    date: airdropToEdit?.date || '',
    tutorial: airdropToEdit?.tutorial || ''
  });

  useEffect(() => {
    if (airdropToEdit) {
      setFormData({
        id: airdropToEdit.id, title: airdropToEdit.title, description: airdropToEdit.description,
        link: airdropToEdit.link, type: airdropToEdit.type, status: airdropToEdit.status,
        image_url: airdropToEdit.image_url, date: airdropToEdit.date, tutorial: airdropToEdit.tutorial || ''
      });
    } else {
      setFormData({
        id: null, title: '', description: '', link: '', 
        type: 'free', status: 'active', image_url: '', date: '', tutorial: ''
      });
    }
  }, [airdropToEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-lg mb-8">
      <h3 className="text-xl font-semibold text-white mb-4">{airdropToEdit ? "Edit Airdrop" : "Tambah Airdrop Baru"}</h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">Judul Airdrop <span className="text-red-500">*</span></label>
          <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} required className="form-input w-full p-2.5 rounded-md bg-gray-700 border border-gray-600 focus:ring-purple-500 focus:border-purple-500 placeholder-gray-500 text-white"/>
        </div>
        {/* Link */}
        <div>
          <label htmlFor="link" className="block text-sm font-medium text-gray-300 mb-1">Link Airdrop <span className="text-red-500">*</span></label>
          <input type="url" id="link" name="link" value={formData.link} onChange={handleChange} required className="form-input w-full p-2.5 rounded-md bg-gray-700 border border-gray-600 focus:ring-purple-500 focus:border-purple-500 placeholder-gray-500 text-white"/>
        </div>
        {/* Type */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-1">Tipe Airdrop</label>
          <select id="type" name="type" value={formData.type} onChange={handleChange} className="form-input w-full p-2.5 rounded-md bg-gray-700 border border-gray-600 focus:ring-purple-500 focus:border-purple-500 text-white appearance-none">
            <option value="free">Gratis</option>
            <option value="premium">Premium</option>
          </select>
        </div>
        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-1">Status</label>
          <select id="status" name="status" value={formData.status} onChange={handleChange} className="form-input w-full p-2.5 rounded-md bg-gray-700 border border-gray-600 focus:ring-purple-500 focus:border-purple-500 text-white appearance-none">
            <option value="active">Aktif</option>
            <option value="upcoming">Mendatang</option>
            <option value="ended">Selesai</option>
          </select>
        </div>
        {/* Image URL */}
        <div className="col-span-1 md:col-span-2">
          <label htmlFor="image_url" className="block text-sm font-medium text-gray-300 mb-1">URL Gambar (Thumbnail)</label>
          <input type="url" id="image_url" name="image_url" value={formData.image_url} onChange={handleChange} className="form-input w-full p-2.5 rounded-md bg-gray-700 border border-gray-600 focus:ring-purple-500 focus:border-purple-500 placeholder-gray-500 text-white"/>
        </div>
        {/* Description */}
        <div className="col-span-1 md:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">Deskripsi</label>
          <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows="3" className="form-input w-full p-2.5 rounded-md bg-gray-700 border border-gray-600 focus:ring-purple-500 focus:border-purple-500 placeholder-gray-500 text-white resize-y"></textarea>
        </div>
        {/* Tutorial (New Field) */}
        <div className="col-span-1 md:col-span-2">
          <label htmlFor="tutorial" className="block text-sm font-medium text-gray-300 mb-1">Tutorial (HTML/Markdown)</label>
          <textarea id="tutorial" name="tutorial" value={formData.tutorial} onChange={handleChange} rows="6" className="form-input w-full p-2.5 rounded-md bg-gray-700 border border-gray-600 focus:ring-purple-500 focus:border-purple-500 placeholder-gray-500 text-white resize-y" placeholder="Tuliskan langkah-langkah tutorial di sini. Bisa berupa HTML atau Markdown sederhana."></textarea>
        </div>

        {/* Buttons */}
        <div className="col-span-1 md:col-span-2 flex justify-end gap-3 mt-4">
          <button type="button" onClick={onCancel} className="btn-secondary px-5 py-2.5 rounded-md font-semibold">Batal</button>
          <button type="submit" className="btn-primary px-5 py-2.5 rounded-md font-semibold">{airdropToEdit ? "Simpan Perubahan" : "Tambah Airdrop"}</button>
        </div>
      </form>
    </div>
  );
};

// Komponen Modal Detail Airdrop (Versi Full Layar)
const AirdropDetailModal = ({ isOpen, onClose, airdrop }) => {
  if (!isOpen || !airdrop) return null;

  const renderTutorialContent = () => {
    if (!airdrop.tutorial) return <p className="text-gray-400 italic">Tidak ada tutorial yang tersedia untuk airdrop ini.</p>;
    return (
      <div 
        className="prose prose-invert max-w-none text-gray-200" // Kelas Tailwind Typography
        dangerouslySetInnerHTML={{ __html: airdrop.tutorial }} 
      />
    );
  };

  return (
    // Outer div: Overlay gelap dan centering, sekarang full screen
    <div className="fixed top-0 left-0 w-screen h-screen bg-black bg-opacity-95 flex flex-col justify-center items-center z-[9999]">
      {/* Modal Content container - Mengisi hampir seluruh ruang */}
      <div className="relative bg-gray-800 text-gray-100 rounded-lg shadow-2xl w-full h-full max-w-screen-lg max-h-full m-4 overflow-hidden flex flex-col">
        <div className="modal-header border-b border-gray-700 p-4 flex-shrink-0">
          <h3 className="modal-title text-2xl font-semibold text-white">{airdrop.title}</h3>
          <button className="modal-close-btn text-gray-400 hover:text-white transition-colors duration-200" onClick={onClose}>&times;</button>
        </div>
        
        {/* Konten yang dapat discroll */}
        <div className="p-4 flex-grow overflow-y-auto">
          {airdrop.image_url && (
            <img 
              src={airdrop.image_url} 
              alt={airdrop.title} 
              className="w-full h-auto max-h-56 object-cover rounded-md mb-6"
              onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/800x200/2d2d2d/ffffff?text=Image+Not+Found"; }}
            />
          )}

          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-300 mb-2">Deskripsi</h4>
            <p className="text-gray-300 text-base">{airdrop.description || 'Tidak ada deskripsi.'}</p>
          </div>

          <div className="flex flex-wrap gap-4 mb-6">
            <div className="text-sm font-medium text-gray-300">
              <FontAwesomeIcon icon={faLink} className="mr-2 text-purple-400" />
              <a href={airdrop.link} target="_blank" rel="noopener noreferrer" className="hover:underline text-purple-300">Kunjungi Halaman Airdrop</a>
            </div>
            {airdrop.date && (
                <div className="text-sm font-medium text-gray-300">
                    <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-blue-400" />
                    Perkiraan: {airdrop.date}
                </div>
            )}
            <div className="text-sm font-medium text-gray-300">
                <FontAwesomeIcon icon={faInfoCircle} className="mr-2 text-green-400" />
                Status: {airdrop.status === 'active' ? 'Aktif' : airdrop.status === 'upcoming' ? 'Mendatang' : 'Selesai'}
            </div>
          </div>
          
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-300 mb-2 flex items-center">
                <FontAwesomeIcon icon={faCodeBranch} className="mr-2 text-orange-400" /> Tutorial
            </h4>
            {renderTutorialContent()}
          </div>
        </div>
        
        <div className="modal-footer flex-shrink-0 flex justify-end p-4 border-t border-gray-700">
          <button type="button" onClick={onClose} className="btn-secondary px-5 py-2.5 rounded-md font-semibold">Tutup</button>
        </div>
      </div>
    </div>
  );
};


// --- Komponen Utama Halaman Airdrops --- 
export default function PageAirdrops({ currentUser }) {
  // Hanya dua mock data (tetap di sini untuk demo fungsionalitas)
  const [airdrops, setAirdrops] = useState([
    {
      id: 1,
      title: "ZK Sync Era Mainnet Airdrop",
      description: "Airdrop untuk pengguna awal ZK Sync Era Mainnet. Jangan lewatkan kesempatan ini!",
      link: "https://zksync.io/",
      type: "free",
      status: "active",
      image_url: "https://www.cryptoblogs.io/wp-content/uploads/2024/06/What-is-zkSync.jpg",
      date: "Q3 2024",
      tutorial: "<p><b>Langkah 1:</b> Bridge ETH ke ZK Sync Era menggunakan <a href='https://portal.zksync.io/bridge' target='_blank'>jembatan resmi</a>.</p><p><b>Langkah 2:</b> Lakukan beberapa transaksi (swap, add liquidity) di DEX seperti SyncSwap atau Mute.io.</p><p><b>Langkah 3:</b> Mint NFT atau deploy smart contract (opsional, tapi direkomendasikan).</p>"
    },
    {
      id: 2,
      title: "LayerZero Airdrop",
      description: "Airdrop token ZRO untuk pengguna LayerZero yang aktif di berbagai chain. Lakukan bridging dan transaksi omnichain.",
      link: "https://layerzero.network/",
      type: "premium",
      status: "upcoming",
      image_url: "https://cdn.betakit.com/wp-content/uploads/2023/04/LayerZero-Labs-770x513.jpg",
      date: "Q4 2024",
      tutorial: "<ul><li>Gunakan Stargate Finance untuk bridge aset antar chain.</li><li>Gunakan aplikasi yang dibangun di atas LayerZero (misal: Radiant Capital, Aptos Bridge).</li><li>Pastikan volume transaksi Anda mencukupi.</li></ul>"
    }
  ]);

  const [isAdminMode, setIsAdminMode] = useState(false);
  const [editingAirdrop, setEditingAirdrop] = useState(null);
  const [showingDetailAirdrop, setShowingDetailAirdrop] = useState(null);

  useEffect(() => {
    // Placeholder untuk status admin. Akan diganti dengan currentUser?.is_admin
    const isCurrentUserAdmin = currentUser?.id === "admin_user_id_mock"; // Ganti dengan ID admin asli Anda
    setIsAdminMode(isCurrentUserAdmin); 
  }, [currentUser]);


  const handleSaveAirdrop = (airdropData) => {
    if (airdropData.id) {
      setAirdrops(prevAirdrops => prevAirdrops.map(a => a.id === airdropData.id ? airdropData : a));
      console.log("Airdrop updated:", airdropData);
    } else {
      const newId = Math.max(...airdrops.map(a => a.id)) + 1;
      const newAirdrop = { ...airdropData, id: newId };
      setAirdrops(prevAirdrops => [...prevAirdrops, newAirdrop]);
      console.log("New airdrop added:", newAirdrop);
    }
    setEditingAirdrop(null);
  };

  const handleDeleteAirdrop = (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus airdrop ini?")) {
      setAirdrops(prevAirdrops => prevAirdrops.filter(a => a.id !== id));
      console.log("Airdrop deleted:", id);
    }
  };

  const handleEditClick = (airdrop) => {
    setEditingAirdrop(airdrop);
  };

  const handleCancelEdit = () => {
    setEditingAirdrop(null);
  };

  const handleShowDetail = (airdrop) => {
    setShowingDetailAirdrop(airdrop);
    // Tambahkan kelas ke body untuk mencegah scroll halaman utama
    document.body.style.overflow = 'hidden'; 
  };

  const handleCloseDetailModal = () => {
    setShowingDetailAirdrop(null);
    // Hapus kelas dari body untuk mengizinkan scroll halaman utama kembali
    document.body.style.overflow = ''; 
  };


  return (
    <section id="airdrops" className="page-content space-y-8 pt-6">
      
      {/* SPANDUK COMING SOON! (BARU DITAMBAHKAN) */}
      <div className="card rounded-xl p-6 md:p-10 bg-gray-800 border border-gray-700 shadow-xl max-w-2xl mx-auto flex flex-col items-center justify-center text-center">
        <FontAwesomeIcon icon={faTools} className="text-primary text-6xl mb-6 animate-pulse" />
        <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight">
          COMING SOON!
        </h2>
        <p className="text-gray-300 text-lg md:text-xl mb-8">
          Kami sedang bekerja keras untuk membawa Anda ke daftar airdrop terbaru dan terkurasi.
          Persiapkan diri Anda untuk peluang-peluang menarik!
        </p>

        <div className="bg-purple-600/20 border border-purple-500 text-purple-300 px-6 py-4 rounded-lg relative mb-8 flex items-center justify-center text-lg w-full">
          <FontAwesomeIcon icon={faHourglassHalf} className="mr-3 text-purple-400" />
          <strong className="font-bold">STATUS:</strong> <span className="ml-2">Dalam Pengembangan!</span>
        </div>

        <div className="mb-8 w-full">
          <p className="text-gray-300 mb-4 text-base">
            Dapatkan update tercepat dan informasi eksklusif langsung di channel komunitas kami.
          </p>
          <a
            href="https://t.me/airdrop4ll"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg text-xl shadow-lg inline-flex items-center justify-center transition-colors duration-200 w-full"
          >
            <FontAwesomeIcon icon={faTelegramPlane} className="mr-3" />
            Gabung Channel Telegram
          </a>
        </div>

        <div className="flex space-x-6 text-3xl mb-4">
          <a href="https://twitter.com/airdrop4ll" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition-colors duration-200" title="Twitter">
            <FontAwesomeIcon icon={faTwitter} />
          </a>
          <a href="https://discord.gg/airdrop4ll" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-purple-400 transition-colors duration-200" title="Discord">
            <FontAwesomeIcon icon={faDiscord} />
          </a>
        </div>
        <p className="text-gray-500 text-sm mt-6">
          Tetap pantau untuk pengumuman resmi!
        </p>
      </div> {/* END SPANDUK COMING SOON */}


      {isAdminMode && (
        <div className="admin-controls mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Panel Admin Airdrop</h2>
          <button 
            onClick={() => setEditingAirdrop({})} 
            className="btn-primary flex items-center px-4 py-2 rounded-lg font-semibold text-lg"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" /> Tambah Airdrop Baru
          </button>

          {editingAirdrop && (
            <AdminAirdropForm 
              airdropToEdit={editingAirdrop.id ? editingAirdrop : null} 
              onSave={handleSaveAirdrop} 
              onCancel={handleCancelEdit} 
            />
          )}

          <div className="mt-8">
            <h3 className="text-xl font-semibold text-white mb-4">Daftar Airdrop yang Terkelola</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {airdrops.map(airdrop => (
                <AirdropCard 
                  key={airdrop.id} 
                  airdrop={airdrop} 
                  isAdminMode={true} 
                  onEdit={handleEditClick} 
                  onDelete={handleDeleteAirdrop} 
                  onShowDetail={handleShowDetail} 
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tampilan Publik: Semua Airdrop (Tetap ada di bawah Coming Soon) */}
      <div className="card rounded-xl p-6 md:p-8">
        <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-primary flex items-center justify-center">
          <FontAwesomeIcon icon={faGift} className="mr-3 text-purple-400" />
          Daftar Semua Airdrop Terbaru
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {airdrops.map(airdrop => ( 
            <AirdropCard 
              key={airdrop.id} 
              airdrop={airdrop} 
              isAdminMode={false} 
              onShowDetail={handleShowDetail} 
            />
          ))}
          {airdrops.length === 0 && !isAdminMode && (
              <p className="col-span-full text-gray-400 text-center py-4">Belum ada airdrop yang tersedia saat ini.</p>
          )}
        </div>
        
        <div className="bg-blue-600/20 border border-blue-700 text-blue-300 px-6 py-4 rounded-lg mt-8 text-center">
            <h3 className="text-xl font-semibold mb-3">Informasi Lebih Lanjut</h3>
            <p className="text-gray-200 mb-4">
              Dapatkan update airdrop terbaru dan diskusi komunitas di channel Telegram resmi kami.
            </p>
            <a
              href="https://t.me/airdrop4ll"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2.5 px-6 rounded-lg text-lg shadow-md inline-flex items-center justify-center transition-colors duration-200"
            >
              <FontAwesomeIcon icon={faTelegramPlane} className="mr-2" />
              Kunjungi Channel Telegram
            </a>
        </div>
      </div>

      {/* Modal Detail Airdrop */}
      {showingDetailAirdrop && (
        <AirdropDetailModal 
          isOpen={!!showingDetailAirdrop} 
          onClose={handleCloseDetailModal} 
          airdrop={showingDetailAirdrop} 
        />
      )}
    </section>
  );
}
