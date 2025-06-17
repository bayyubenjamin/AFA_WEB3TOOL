// src/components/PageHome.jsx - VERSI ROUTING

import React from "react";
import { Link } from "react-router-dom"; // [TAMBAHAN]: Impor Link
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFingerprint, faRocket, faTasks, faComments, faArrowRight, faShieldHalved, faSignInAlt, faGift // [TAMBAHAN]: Tambahkan faGift untuk ikon event
} from "@fortawesome/free-solid-svg-icons";
import { useLanguage } from "../context/LanguageContext";
import translationsId from "../translations/id.json";
import translationsEn from "../translations/en.json";

const getTranslations = (lang) => {
  return lang === 'id' ? translationsId : translationsEn;
};

// [DIUBAH]: FeatureCard sekarang menggunakan Link, bukan onAction
const FeatureCard = ({ icon, title, description, actionText, actionTarget, color }) => (
  // [EDIT]: Menambahkan class untuk light/dark mode
  <div className="relative bg-light-card dark:bg-card p-6 rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 group transform transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl">
    <div className="absolute top-0 left-0 w-full h-full bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-gradient-radial from-primary/20 to-transparent opacity-0 group-hover:opacity-50 transition-opacity duration-500 animate-spin-slow"></div>
    <div className="relative z-10 flex flex-col h-full">
      <div className={`mb-5 text-4xl ${color}`}>
        <FontAwesomeIcon icon={icon} />
      </div>
      {/* [EDIT]: Menambahkan class untuk light/dark mode */}
      <h3 className="text-2xl font-bold text-light-text dark:text-white mb-3">{title}</h3>
      <p className="text-light-subtle dark:text-gray-400 text-base mb-6 flex-grow">{description}</p>
      {/* Mengganti <button> dengan <Link> dan memberikan styling yang sama */}
      <Link
        to={actionTarget}
        // [EDIT]: Menambahkan class untuk light/dark mode
        className="mt-auto font-semibold text-primary hover:text-light-text dark:hover:text-white transition-colors duration-200 flex items-center group/link"
      >
        {actionText}
        <FontAwesomeIcon icon={faArrowRight} className="ml-2 h-3.5 w-3.5 transform transition-transform duration-300 group-hover/link:translate-x-1" />
      </Link>
    </div>
  </div>
);

// [DIUBAH]: Props 'navigateTo' diganti dengan 'navigate' dari hook useNavigate
export default function PageHome({ currentUser, onMintNft, navigate }) {
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
      actionTarget: "/airdrops", // [DIUBAH]: Menjadi path URL
      color: "text-primary",
    },
    {
      icon: faTasks,
      title: tHome.feature2Title,
      description: tHome.feature2Description,
      actionText: tHome.feature2Action,
      actionTarget: "/my-work", // [DIUBAH]: Menjadi path URL
      color: "text-blue-400",
    },
    {
      icon: faComments,
      title: tHome.feature3Title,
      description: tHome.feature3Description,
      actionText: tHome.feature3Action,
      actionTarget: "/forum", // [DIUBAH]: Menjadi path URL
      color: "text-teal-400",
    },
    // [TAMBAHAN]: Kartu baru untuk Event
    {
      icon: faGift, // Menggunakan ikon hadiah
      title: tHome.feature4Title || "Special Events", // Tambahkan terjemahan di id.json dan en.json
      description: tHome.feature4Description || "Don't miss our exclusive giveaways and events for community members!", // Tambahkan terjemahan
      actionText: tHome.feature4Action || "Join Events", // Tambahkan terjemahan
      actionTarget: "/events", // Arahkan ke halaman events
      color: "text-green-400", // Warna hijau
    },
  ];
  
  const handleMainAction = () => {
    if (isLoggedIn) {
      onMintNft();
    } else {
      navigate('/profile'); // [DIUBAH]: Menggunakan navigate dari hook
    }
  };

  return (
    <section id="home" className="page-content space-y-20 md:space-y-28 py-10 md:py-16">
      <div className="relative text-center max-w-4xl mx-auto px-4 z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-gradient-radial from-primary/10 via-transparent to-transparent -z-10 rounded-full blur-3xl"></div>
        {/* [EDIT]: Menambahkan class untuk light/dark mode */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-light-text dark:text-white leading-tight">
          {tHome.heroTitle}
        </h1>
        {/* [EDIT]: Menambahkan class untuk light/dark mode */}
        <p className="mt-6 text-lg md:text-xl text-light-subtle dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
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
          {/* [EDIT]: Menambahkan class untuk light/dark mode */}
          <h2 className="text-3xl md:text-4xl font-bold text-light-text dark:text-white mb-3 flex items-center justify-center">
            <FontAwesomeIcon icon={faShieldHalved} className="mr-3 text-primary" /> {tHome.featuresTitle}
          </h2>
          {/* [EDIT]: Menambahkan class untuk light/dark mode */}
          <p className="text-light-subtle dark:text-gray-400 text-lg">
            {tHome.featuresSubtitle}
          </p>
        </div>
        {/* [UBAH]: Sesuaikan grid agar muat 4 kartu jika ada, atau 3 jika hanya 3 fitur */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"> {/* [UBAH] grid-cols-4 */}
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              actionText={feature.actionText}
              actionTarget={feature.actionTarget} // Prop ini sekarang berisi path URL
              color={feature.color}
            />
          ))}
        </div>
      </div>

      <div className="text-center pt-8 px-4">
         {/* [EDIT]: Menggunakan class .card yang sudah di-update di style.css */}
        <div className="relative max-w-3xl mx-auto p-8 md:p-12 card rounded-2xl border border-primary/20 overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 to-transparent"></div>
           <div className="relative z-10">
              {/* [EDIT]: Menambahkan class untuk light/dark mode */}
              <h3 className="text-3xl md:text-4xl font-bold text-light-text dark:text-white mb-4">
                {tHome.joinCtaTitle}
              </h3>
              {/* [EDIT]: Menambahkan class untuk light/dark mode */}
              <p className="text-light-subtle dark:text-gray-400 mb-8 text-lg">
                {tHome.joinCtaSubtitle}
              </p>
              <button
                onClick={handleMainAction}
                // [EDIT]: Menghapus text-white karena sudah diatur di .btn-secondary
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
