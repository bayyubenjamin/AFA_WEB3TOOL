// src/components/BottomNav.jsx

import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faBriefcase,
  faParachuteBox,
  faComments,
} from "@fortawesome/free-solid-svg-icons";

export default function BottomNav({ currentPage, navigateTo }) {
  const navItems = [
    { id: "home", icon: faHome, label: "Home" },
    { id: "myWork", icon: faBriefcase, label: "Garapanku" },
    { id: "airdrops", icon: faParachuteBox, label: "Airdrop" },
    { id: "forum", icon: faComments, label: "Forum" },
  ];

  return (
    // PERBAIKAN UTAMA DI SINI:
    <nav
      aria-label="Main navigation" // Tambahan untuk aksesibilitas
      className="
        fixed bottom-0 left-0 w-full         /* 1. Ganti 'sticky' menjadi 'fixed' dan 'w-full' */
        h-[var(--bottomnav-height)]           /* 2. Tambahkan tinggi eksplisit dari variabel CSS Anda */
        pb-[env(safe-area-inset-bottom)]      /* 3. PENTING: Beri padding bawah untuk area aman di iPhone (home bar) */
        glassmorphism                         /* Class Anda sudah benar */
        z-50                                  /* Pastikan z-index ada */
        grid grid-cols-4                      /* 4. Pindahkan grid langsung ke <nav> */
      "
    >
      {/* Struktur map sudah benar, tidak perlu diubah */}
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => navigateTo(item.id)}
          // Class di sini juga sudah bagus, hanya perlu memastikan tinggi itemnya pas
          className={`nav-item flex flex-col items-center justify-center h-full text-gray-300 hover:text-primary transition-colors duration-200 ${
            currentPage === item.id ? "active" : ""
          }`}
        >
          <FontAwesomeIcon icon={item.icon} className="text-xl mb-1" />
          <span className="text-xs font-medium">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
