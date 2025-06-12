// src/components/BottomNav.jsx - VERSI ROUTING

import React from "react";
// [TAMBAHAN]: Impor NavLink
import { NavLink } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faBriefcase,
  faParachuteBox,
  faComments,
  faUserCircle,
} from "@fortawesome/free-solid-svg-icons";
import { useLanguage } from "../context/LanguageContext";
import translationsId from "../translations/id.json";
import translationsEn from "../translations/en.json";

const getTranslations = (lang) => {
  return lang === 'id' ? translationsId : translationsEn;
};

// [DIUBAH]: Hapus props 'currentPage' dan 'navigateTo'
export default function BottomNav({ currentUser }) {
  const { language } = useLanguage();
  const t = getTranslations(language).bottomNav;

  // [DIUBAH]: Tambahkan properti 'path' untuk tujuan routing
  const navItems = [
    { id: "home", path: "/", icon: faHome, label: t.home },
    { id: "myWork", path: "/my-work", icon: faBriefcase, label: t.myWork },
    { id: "airdrops", path: "/airdrops", icon: faParachuteBox, label: t.airdrops },
    { id: "forum", path: "/forum", icon: faComments, label: t.forum },
    { id: "profile", path: "/profile", icon: faUserCircle, label: t.profile },
  ];

  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 w-full h-[var(--bottomnav-height)] pb-[env(safe-area-inset-bottom)] glassmorphism z-50 grid grid-cols-5"
    >
      {navItems.map((item) => {
        const isProfileItem = item.id === "profile";

        return (
          // [DIUBAH]: Menggunakan NavLink, bukan button
          <NavLink
            key={item.id}
            to={item.path}
            // `end` prop penting untuk root path "/" agar tidak selalu aktif
            end={item.path === "/"}
            // className sekarang menerima fungsi untuk mengecek state 'isActive'
            // [EDIT]: Menghapus 'text-gray-300' agar warna diambil dari class .nav-item di style.css
            className={({ isActive }) => 
              `nav-item flex flex-col items-center justify-center h-full hover:text-primary transition-colors duration-200 ${isActive ? "active" : ""}`
            }
          >
            {/* NavLink juga bisa menerima fungsi sebagai child untuk mendapatkan state 'isActive' */}
            {({ isActive }) => (
              <>
                {isProfileItem && currentUser?.id ? (
                  <img
                    src={currentUser.avatar_url || `https://placehold.co/100x100/7f5af0/FFFFFF?text=${currentUser.name ? currentUser.name.substring(0,1).toUpperCase() : "U"}`}
                    alt={currentUser.name || "User Avatar"}
                    className={`h-6 w-6 rounded-full object-cover mb-1 border-2 transition-all ${isActive ? 'border-primary' : 'border-transparent'}`}
                  />
                ) : (
                  <FontAwesomeIcon icon={item.icon} className="text-xl mb-1" />
                )}
                <span className="text-xs font-medium">{item.label}</span>
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
