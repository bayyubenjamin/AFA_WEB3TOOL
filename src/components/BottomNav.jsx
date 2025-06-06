// src/components/BottomNav.jsx
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faBriefcase,
  faParachuteBox,
  faComments, // Ikon untuk Forum
} from "@fortawesome/free-solid-svg-icons";

export default function BottomNav({ currentPage, navigateTo }) {
  const navItems = [
    { id: "home", icon: faHome, label: "Home" },
    { id: "myWork", icon: faBriefcase, label: "Garapanku" },
    { id: "airdrops", icon: faParachuteBox, label: "Airdrop" },
    { id: "forum", icon: faComments, label: "Forum" },
  ];

  return (
    <nav className="glassmorphism sticky bottom-0 left-0 right-0 shadow-t-lg z-50"> {/* sticky bottom-0 */}
      <div className="max-w-md mx-auto grid grid-cols-4">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => navigateTo(item.id)}
            className={`nav-item flex flex-col items-center justify-center py-3 text-gray-300 hover:text-primary transition-colors duration-200 ${
              currentPage === item.id ? "active" : ""
            }`}
          >
            <FontAwesomeIcon icon={item.icon} className="text-xl mb-1" />
            <span className="text-xs">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
