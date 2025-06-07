// src/components/BottomNav.jsx

import React from "react";
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

export default function BottomNav({ currentPage, navigateTo, currentUser }) {
  const { language } = useLanguage();
  // PERBAIKAN: Mengambil terjemahan dari objek "bottomNav" yang benar
  const t = getTranslations(language).bottomNav;

  // PERBAIKAN: Menggunakan terjemahan dari 't' untuk label
  const navItems = [
    { id: "home", icon: faHome, label: t.home },
    { id: "myWork", icon: faBriefcase, label: t.myWork },
    { id: "airdrops", icon: faParachuteBox, label: t.airdrops },
    { id: "forum", icon: faComments, label: t.forum },
    { id: "profile", icon: faUserCircle, label: t.profile },
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
        grid grid-cols-5
      "
    >
      {navItems.map((item) => {
        const isProfileItem = item.id === "profile";
        const isProfileActive = currentPage === "profile";
        const isActive = currentPage === item.id;

        return (
          <button
            key={item.id}
            onClick={() => navigateTo(item.id)}
            className={`nav-item flex flex-col items-center justify-center h-full text-gray-300 hover:text-primary transition-colors duration-200 ${
              isActive ? "active" : ""
            }`}
          >
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
          </button>
        );
      })}
    </nav>
  );
}
