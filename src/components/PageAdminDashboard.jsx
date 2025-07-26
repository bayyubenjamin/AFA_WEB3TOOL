import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShieldHalved, faParachuteBox, faGift, faArrowLeft, faStore } from '@fortawesome/free-solid-svg-icons';

export default function PageAdminDashboard() {
  return (
    <section className="page-content space-y-8 pt-8">
      <Link to="/" className="text-sm text-primary hover:underline mb-6 inline-flex items-center">
        <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
        Kembali ke Beranda
      </Link>
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold futuristic-text-gradient mb-3 flex items-center justify-center gap-3">
           <FontAwesomeIcon icon={faShieldHalved}/> Admin Dashboard
        </h1>
        <p className="text-lg text-light-subtle dark:text-gray-400">Pilih panel yang ingin Anda kelola.</p>
      </div>

      <div className="max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link to="/airdrops/postairdrops" className="card rounded-2xl p-8 text-center group transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:bg-primary/5">
          <FontAwesomeIcon icon={faParachuteBox} className="text-5xl text-primary mb-4 transition-transform duration-300 group-hover:scale-110" />
          <h2 className="text-2xl font-bold text-light-text dark:text-white">Kelola Airdrops</h2>
          <p className="text-light-subtle dark:text-gray-400 mt-2">Buat, edit, dan hapus postingan airdrop.</p>
        </Link>
        <Link to="/admin/events" className="card rounded-2xl p-8 text-center group transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:bg-primary/5">
          <FontAwesomeIcon icon={faGift} className="text-5xl text-primary mb-4 transition-transform duration-300 group-hover:scale-110" />
          <h2 className="text-2xl font-bold text-light-text dark:text-white">Kelola Events</h2>
          <p className="text-light-subtle dark:text-gray-400 mt-2">Buat, edit, dan kelola giveaway.</p>
        </Link>
        {/* --- TOMBOL BARU DITAMBAHKAN DI SINI --- */}
        <Link to="/admin-warung" className="card rounded-2xl p-8 text-center group transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:bg-primary/5 md:col-span-2">
          <FontAwesomeIcon icon={faStore} className="text-5xl text-primary mb-4 transition-transform duration-300 group-hover:scale-110" />
          <h2 className="text-2xl font-bold text-light-text dark:text-white">Kelola Warung Kripto</h2>
          <p className="text-light-subtle dark:text-gray-400 mt-2">Atur kurs jual/beli dan konfirmasi transaksi pengguna.</p>
        </Link>
      </div>
    </section>
  );
}
