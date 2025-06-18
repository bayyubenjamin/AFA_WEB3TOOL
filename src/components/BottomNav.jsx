// src/components/BottomNav.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faBriefcase,
  faParachuteBox,
  faCalendarCheck,
  faUserCircle,
  faShieldHalved // Impor ikon untuk Admin
} from "@fortawesome/free-solid-svg-icons";
import { useLanguage } from "../context/LanguageContext";
import translationsId from "../translations/id.json";
import translationsEn from "../translations/en.json";

const getTranslations = (lang) => {
  return lang === 'id' ? translationsId : translationsEn;
};

// ID Admin Anda
const ADMIN_USER_ID = '9a405075-260e-407b-a7fe-2f05b9bb5766';

export default function BottomNav({ currentUser }) {
  const { language } = useLanguage();
  const t = getTranslations(language).bottomNav;
  const isAdmin = currentUser?.id === ADMIN_USER_ID;

  // Daftar item navigasi dasar
  const baseNavItems = [
    { id: "home", path: "/", icon: faHome, label: t.home },
    { id: "myWork", path: "/my-work", icon: faBriefcase, label: t.myWork },
    { id: "airdrops", path: "/airdrops", icon: faParachuteBox, label: t.airdrops },
    { id: "events", path: "/events", icon: faCalendarCheck, label: t.events },
    { id: "profile", path: "/profile", icon: faUserCircle, label: t.profile },
  ];

  // Buat daftar item navigasi akhir
  const navItems = [...baseNavItems];
  
  // Jika pengguna adalah admin, sisipkan tombol Admin di tengah
  if (isAdmin) {
    navItems.splice(2, 0, { id: "admin", path: "/admin", icon: faShieldHalved, label: "Admin" });
  }

  // Sesuaikan jumlah kolom grid berdasarkan apakah admin atau bukan
  const gridColsClass = isAdmin ? 'grid-cols-6' : 'grid-cols-5';

  return (
    <nav
      aria-label="Main navigation"
      className={`fixed bottom-0 left-0 w-full h-[var(--bottomnav-height)] pb-[env(safe-area-inset-bottom)] glassmorphism z-50 grid ${gridColsClass}`}
    >
      {navItems.map((item) => {
        const isProfileItem = item.id === "profile";
        return (
          <NavLink
            key={item.id}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) => 
              `nav-item flex flex-col items-center justify-center h-full hover:text-primary transition-colors duration-200 ${isActive ? "active" : ""}`
            }
          >
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

