// src/components/PageHome.jsx
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFingerprint,
  faRocket,
  faTasks,
  faComments,
  faArrowRight
} from "@fortawesome/free-solid-svg-icons";
import { useLanguage } from "../context/LanguageContext"; // Import useLanguage
import translationsId from "../translations/id.json"; // Import terjemahan ID
import translationsEn from "../translations/en.json"; // Import terjemahan EN

const getTranslations = (lang) => {
  return lang === 'id' ? translationsId : translationsEn;
};

export default function PageHome({ onMintNft, navigateTo }) {
  const { language } = useLanguage(); // Dapatkan bahasa saat ini
  const t = getTranslations(language).home; // Dapatkan objek terjemahan untuk halaman home

  const features = [
    {
      icon: faRocket,
      title: t.feature1Title, // Gunakan terjemahan
      description: t.feature1Description, // Gunakan terjemahan
      actionText: t.feature1Action, // Gunakan terjemahan
      actionTarget: "airdrops",
      color: "text-purple-400",
    },
    {
      icon: faTasks,
      title: t.feature2Title,
      description: t.feature2Description,
      actionText: t.feature2Action,
      actionTarget: "myWork",
      color: "text-blue-400",
    },
    {
      icon: faComments,
      title: t.feature3Title,
      description: t.feature3Description,
      actionText: t.feature3Action,
      actionTarget: "forum",
      color: "text-teal-400",
    },
  ];

  return (
    <section id="home" className="page-content space-y-12 md:space-y-16 py-8 md:py-12">
      {/* Hero Section */}
      <div className="text-center space-y-6 max-w-3xl mx-auto px-4">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">
          <span className="futuristic-text-gradient">{t.heroTitlePart1}</span> {t.heroTitlePart2}
          <span className="text-primary"> {t.heroTitlePart3}</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-300 leading-relaxed">
          {t.heroDescription}
        </p>
        <div className="pt-4">
          <button
            onClick={onMintNft}
            className="btn-primary text-white font-semibold py-3 px-8 md:py-4 md:px-10 rounded-lg text-lg md:text-xl shadow-xl transform hover:scale-105 transition-transform duration-300 inline-flex items-center"
          >
            <FontAwesomeIcon icon={faFingerprint} className="mr-3 h-5 w-5" />
            {t.mintIdentityButton}
          </button>
        </div>
      </div>

      {/* Fitur Utama Section */}
      <div className="space-y-10 px-4">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-semibold text-white mb-2">
            {t.featuresSectionTitlePart1} <span className="text-primary">{t.featuresSectionTitlePart2}</span>{t.featuresSectionTitlePart3}
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            {t.featuresSectionSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="card rounded-xl p-6 transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 flex flex-col"
            >
              <div className={`mb-4 text-3xl ${feature.color}`}>
                <FontAwesomeIcon icon={feature.icon} />
              </div>
              <h3 className={`text-xl font-semibold mb-2 text-white`}>{feature.title}</h3>
              <p className="text-gray-400 text-sm mb-4 flex-grow">{feature.description}</p>
              <button
                onClick={() => navigateTo(feature.actionTarget)}
                className={`mt-auto btn-secondary text-sm py-2 px-4 rounded-md w-full hover:bg-primary/20 hover:text-primary transition-colors duration-200 flex items-center justify-center group`}
              >
                {feature.actionText}
                <FontAwesomeIcon icon={faArrowRight} className="ml-2 h-3 w-3 transform transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* (Opsional) Ajakan Bergabung atau Info Tambahan */}
      <div className="text-center pt-8 px-4">
        <h3 className="text-2xl md:text-3xl font-semibold text-white mb-4">
          {t.ctaTitle}
        </h3>
        <p className="text-gray-400 mb-6 max-w-lg mx-auto">
          {t.ctaDescription}
        </p>
        <button
          onClick={onMintNft}
          className="btn-primary text-white font-semibold py-3 px-8 rounded-lg text-lg shadow-lg"
        >
          {t.ctaButton}
        </button>
      </div>
    </section>
  );
}
