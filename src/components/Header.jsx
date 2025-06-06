// src/components/Header.jsx
import React from "react";

export default function Header({ title, currentUser, navigateTo }) {
  const handleProfileClick = () => {
    console.log("Header.jsx: Profile clicked. Current user:", currentUser?.name);
    if (navigateTo) {
      navigateTo('profile'); // Arahkan ke halaman profil dengan ID 'profile'
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-[60] p-4 flex items-center justify-between glassmorphism">
      {/* Bagian Kiri: Logo AFA */}
      <div className="flex-none">
        <img
          src="https://ik.imagekit.io/5spt6gb2z/IMG_2894.jpeg"
          alt="Logo AFA"
          className="h-10 w-10 rounded-full object-cover border-2 border-primary/50"
        />
      </div>

      {/* Bagian Tengah: Judul Halaman */}
      <h1
        id="headerTitle"
        className="text-xl sm:text-2xl font-bold futuristic-text-gradient mx-4 text-center flex-grow"
      >
        {title}
      </h1>

      {/* Bagian Kanan: Profil Pengguna */}
      <div 
        className="flex items-center space-x-2 cursor-pointer group flex-none" 
        onClick={handleProfileClick}
        style={{ minWidth: '40px' }}
      >
        {currentUser && currentUser.avatarUrl ? (
          <img
            src={currentUser.avatarUrl}
            alt={currentUser.name || "User Avatar"}
            className="h-10 w-10 rounded-full object-cover border-2 border-primary/70 group-hover:border-primary transition-all"
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-primary/30 flex items-center justify-center text-white text-lg font-semibold border-2 border-primary/70 group-hover:border-primary transition-all">
            {currentUser && currentUser.name ? currentUser.name.substring(0,1).toUpperCase() : "U"}
          </div>
        )}
      </div>
    </header>
  );
}
