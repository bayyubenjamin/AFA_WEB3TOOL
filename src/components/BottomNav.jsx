// src/components/BottomNav.jsx

import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faBriefcase,
  faParachuteBox,
  faComments,
  faUserCircle, // Menambahkan ikon untuk profil
} from "@fortawesome/free-solid-svg-icons";

export default function BottomNav({ currentPage, navigateTo, currentUser }) { // Menerima currentUser
  const navItems = [
    { id: "profile", icon: faUserCircle, label: "Profil" }, // Pindahkan Profil ke paling kiri
    { id: "home", icon: faHome, label: "Home" },
    { id: "myWork", icon: faBriefcase, label: "Garapanku" },
    { id: "airdrops", icon: faParachuteBox, label: "Airdrop" },
    { id: "forum", icon: faComments, label: "Forum" },
  ];

  return (
    <nav
      aria-label="Main navigation"
      className="
        fixed bottom-0 left-0 w-full
        h-[var(--bottomnav-height)]
        pb-[env(safe-area-inset-bottom)]
        glassmorphism
        z-50
        grid grid-cols-5                      {/* Ganti menjadi 5 kolom */}
      "
    >
      {navItems.map((item) => {
        // Logika untuk menampilkan avatar atau ikon default untuk Profil
        const isProfileItem = item.id === "profile";
        const isProfileActive = currentPage === "profile";
        
        return (
          <button
            key={item.id}
            onClick={() => navigateTo(item.id)}
            className={`nav-item flex flex-col items-center justify-center h-full text-gray-300 hover:text-primary transition-colors duration-200 ${
              currentPage === item.id ? "active" : ""
            }`}
          >
            {isProfileItem && currentUser ? (
              <img
                src={currentUser.avatar_url || `https://placehold.co/100x100/7f5af0/FFFFFF?text=${currentUser.name ? currentUser.name.substring(0,1).toUpperCase() : "U"}`}
                alt={currentUser.name || "User Avatar"}
                className="h-6 w-6 rounded-full object-cover mb-1 border-2 border-transparent group-hover:border-primary transition-all"
              />
            ) : (
              <FontAwesomeIcon icon={item.icon} className="text-xl mb-1" />
            )}
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
