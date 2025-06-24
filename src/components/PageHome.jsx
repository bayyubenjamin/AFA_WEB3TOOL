// src/components/PageHome.jsx - KODE LENGKAP DENGAN PENYESUAIAN WARNA SOFT & SELARAS

import React from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFingerprint, faRocket, faTasks, faComments, faArrowRight, faShieldHalved, faSignInAlt, faGift
} from "@fortawesome/free-solid-svg-icons";
import { useLanguage } from "../context/LanguageContext";
import translationsId from "../translations/id.json";
import translationsEn from "../translations/en.json";

const getTranslations = (lang) => {
  return lang === 'id' ? translationsId : translationsEn;
};

// Komponen Card Fitur dengan warna teks yang telah disesuaikan
const FeatureCard = ({ icon, title, description, actionText, actionTarget, color }) => (
  <div className="relative bg-light-card dark:bg-dark-card p-6 rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 group transform transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl">
    <div className="absolute top-0 left-0 w-full h-full bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-gradient-radial from-primary/20 to-transparent opacity-0 group-hover:opacity-50 transition-opacity duration-500 animate-spin-slow"></div>
    <div className="relative z-10 flex flex-col h-full">
      <div className={`mb-5 text-4xl ${color}`}>
        <FontAwesomeIcon icon={icon} />
      </div>
      {/* Warna Judul Kartu: #333333 (terang) & #E0E8F4 (gelap) */}
      <h3 className="text-2xl font-bold text-[#333333] dark:text-dark-text mb-3">{title}</h3>
      
      {/* Warna Deskripsi Kartu: #444444 (terang) & #94A3B8 (gelap) + leading-relaxed */}
      <p className="text-[#444444] dark:text-[#94A3B8] text-base mb-6 flex-grow leading-relaxed">{description}</p>
      
      <Link
        to={actionTarget}
        className="mt-auto font-semibold text-primary hover:text-light-text dark:hover:text-white transition-colors duration-200 flex items-center group/link"
      >
        {actionText}
        <FontAwesomeIcon icon={faArrowRight} className="ml-2 h-3.5 w-3.5 transform transition-transform duration-300 group-hover/link:translate-x-1" />
      </Link>
    </div>
  </div>
);

export default function PageHome({ currentUser, navigate }) {
  const { language } = useLanguage();
  const tHome = getTranslations(language).homePage;
  const tHeader = getTranslations(language).header;

  const isLoggedIn = !!(currentUser && currentUser.id);

  const features = [
    {
      icon: faRocket,
      title: tHome.feature1Title,
      description: tHome.feature1Description,
      actionText: tHome.feature1Action,
      actionTarget: "/airdrops",
      color: "text-primary",
    },
    {
      icon: faTasks,
      title: tHome.feature2Title,
      description: tHome.feature2Description,
      actionText: tHome.feature2Action,
      actionTarget: "/my-work",
      color: "text-blue-400",
    },
    {
      icon: faComments,
      title: tHome.feature3Title,
      description: tHome.feature3Description,
      actionText: tHome.feature3Action,
      actionTarget: "/forum",
      color: "text-teal-400",
    },
    {
      icon: faGift,
      title: tHome.feature4Title || "Special Events",
      description: tHome.feature4Description || "Don't miss our exclusive giveaways and events for community members!",
      actionText: tHome.feature4Action || "Join Events",
      actionTarget: "/events",
      color: "text-green-400",
    },
  ];
  
  const handleMainAction = () => {
    if (isLoggedIn) {
      navigate('/identity');
    } else {
      navigate('/login');
    }
  };

  return (
    <section id="home" className="page-content space-y-20 md:space-y-28 py-10 md:py-16 overflow-x-hidden">
      <div className="relative text-center max-w-4xl mx-auto px-4 z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-gradient-radial from-primary/10 via-transparent to-transparent -z-10 rounded-full blur-3xl"></div>
        
        <h1 className="font-sans text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white text-stroke-primary leading-tight">
          {tHome.heroTitle}
        </h1>
        
        {/* Warna deskripsi di bawah judul utama: #444444 (terang) & #94A3B8 (gelap) */}
        <p className="mt-6 text-lg md:text-xl text-[#444444] dark:text-[#94A3B8] max-w-2xl mx-auto leading-relaxed">
          {tHome.heroSubtitle}
        </p>
        
        <div className="mt-10">
          <button
            onClick={handleMainAction}
            className="btn-primary text-white font-bold py-4 px-10 rounded-xl text-lg shadow-2xl shadow-primary/20 transform hover:scale-105 transition-transform duration-300 inline-flex items-center"
          >
            <FontAwesomeIcon icon={isLoggedIn ? faFingerprint : faSignInAlt} className="mr-3 h-5 w-5" />
            {isLoggedIn ? tHome.mintCta : tHeader.login}
          </button>
        </div>
      </div>

      <div className="space-y-12 px-4">
        <div className="text-center max-w-2xl mx-auto">
          
          {/* Warna judul bagian: #333333 (terang) & #E0E8F4 (gelap) */}
          <h2 className="text-3xl md:text-4xl font-bold text-[#333333] dark:text-dark-text mb-3 flex items-center justify-center">
            <FontAwesomeIcon icon={faShieldHalved} className="mr-3 text-primary" /> {tHome.featuresTitle}
          </h2>

          {/* Warna subjudul bagian: #444444 (terang) & #94A3B8 (gelap) + leading-relaxed */}
          <p className="text-[#444444] dark:text-[#94A3B8] text-lg leading-relaxed">
            {tHome.featuresSubtitle}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              actionText={feature.actionText}
              actionTarget={feature.actionTarget}
              color={feature.color}
            />
          ))}
        </div>
      </div>

      <div className="text-center pt-8 px-4">
        <div className="relative max-w-3xl mx-auto p-8 md:p-12 card rounded-2xl border border-primary/20 overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 to-transparent"></div>
           <div className="relative z-10">
              
              {/* Warna judul bagian: #333333 (terang) & #E0E8F4 (gelap) */}
              <h3 className="text-3xl md:text-4xl font-bold text-[#333333] dark:text-dark-text mb-4">
                {tHome.joinCtaTitle}
              </h3>

              {/* Warna subjudul bagian: #444444 (terang) & #94A3B8 (gelap) + leading-relaxed */}
              <p className="text-[#444444] dark:text-[#94A3B8] mb-8 text-lg leading-relaxed">
                {tHome.joinCtaSubtitle}
              </p>
              <button
                onClick={handleMainAction}
                className="btn-secondary font-semibold py-3 px-8 rounded-lg text-lg transform hover:scale-105 transition-transform duration-300 inline-flex items-center"
              >
                {tHome.startNow}
                <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
              </button>
           </div>
        </div>
      </div>
    </section>
  );
}
