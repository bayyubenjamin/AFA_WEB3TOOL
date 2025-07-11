// src/components/PageHome.jsx

import React from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFingerprint, faRocket, faTasks, faComments, faArrowRight, faShieldHalved,
  faSignInAlt, faGift, faUserCheck, faBullseye, faChartLine, faHandshake, faCubesStacked,
  faUsers, faChartSimple, faHashtag, faCheckCircle
} from "@fortawesome/free-solid-svg-icons";
import { faTelegram, faDiscord, faXTwitter } from "@fortawesome/free-brands-svg-icons";
import { useLanguage } from "../context/LanguageContext";
import translationsId from "../translations/id.json";
import translationsEn from "../translations/en.json";

// Helper function to get translations
const getTranslations = (lang) => {
  return lang === 'id' ? translationsId : translationsEn;
};

// --- Re-usable Components ---

const FeatureCard = ({ icon, title, description, actionText, actionTarget, color }) => (
  <div className="relative bg-light-card dark:bg-dark-card p-6 rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 group transform transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-primary/20">
    <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-gradient-radial from-primary/15 to-transparent opacity-0 group-hover:opacity-50 transition-opacity duration-500 animate-spin-slow"></div>
    <div className="relative z-10 flex flex-col h-full">
      <div className={`mb-5 text-4xl ${color}`}><FontAwesomeIcon icon={icon} /></div>
      <h3 className="text-2xl font-bold text-[#333333] dark:text-[#E0E8F4] mb-3">{title}</h3>
      <p className="text-[#444444] dark:text-[#94A3B8] text-base mb-6 flex-grow leading-relaxed">{description}</p>
      <Link to={actionTarget} className="mt-auto font-semibold text-primary hover:text-light-text dark:hover:text-white transition-colors duration-200 flex items-center group/link">
        {actionText}
        <FontAwesomeIcon icon={faArrowRight} className="ml-2 h-3.5 w-3.5 transform transition-transform duration-300 group-hover/link:translate-x-1" />
      </Link>
    </div>
  </div>
);

// --- REVISED HowItWorksStep Component (Numbers Removed) ---
const HowItWorksStep = ({ icon, title, description }) => (
    <div className="bg-light-card dark:bg-dark-card p-8 rounded-2xl border border-black/10 dark:border-white/10 text-center h-full flex flex-col items-center">
        <div className="flex items-center justify-center mx-auto mb-5 w-20 h-20 rounded-full bg-primary/10 text-primary">
            <FontAwesomeIcon icon={icon} className="text-4xl" />
        </div>
        <h3 className="text-2xl font-bold text-[#333333] dark:text-[#E0E8F4] mb-3">{title}</h3>
        <p className="text-base text-[#444444] dark:text-[#94A3B8] leading-relaxed">{description}</p>
    </div>
);


const TestimonialCard = ({ quote, author, role }) => (
    <div className="card p-6 text-center h-full flex flex-col justify-center items-center bg-light-card/50 dark:bg-dark-card/50">
        <p className="italic text-lg text-[#444444] dark:text-[#94A3B8]">"{quote}"</p>
        <p className="mt-4 font-bold text-primary dark:text-accent-dark">{author}</p>
        <p className="text-sm text-light-subtle dark:text-gray-500">{role}</p>
    </div>
);

const SponsorLogo = ({ src, alt }) => (
    <div className="flex justify-center items-center h-20 px-4">
        <img src={src} alt={alt} className="max-h-10 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300" />
    </div>
);

const SocialLink = ({ icon, href, name }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="text-light-subtle dark:text-gray-400 hover:text-primary dark:hover:text-white transition-transform duration-300 transform hover:-translate-y-1 group">
    <FontAwesomeIcon icon={icon} className="text-4xl md:text-5xl" />
    <span className="mt-2 text-sm font-semibold tracking-wider block">{name}</span>
  </a>
);

const StatCard = ({ icon, value, label }) => (
    <div className="text-center">
        <FontAwesomeIcon icon={icon} className="text-4xl text-primary mb-2" />
        <p className="text-4xl font-bold text-slate-800 dark:text-white">{value}</p>
        <p className="text-sm uppercase tracking-wider text-slate-500 dark:text-gray-400">{label}</p>
    </div>
);

// --- Page Component ---

export default function PageHome({ currentUser, navigate }) {
  const { language } = useLanguage();
  const tHome = getTranslations(language).homePage;
  const tHeader = getTranslations(language).header;
  const isLoggedIn = !!(currentUser && currentUser.id);

  const features = [
    { icon: faRocket, title: tHome.feature1Title, description: tHome.feature1Description, actionText: tHome.feature1Action, actionTarget: "/airdrops", color: "text-primary" },
    { icon: faTasks, title: tHome.feature2Title, description: tHome.feature2Description, actionText: tHome.feature2Action, actionTarget: "/my-work", color: "text-blue-400" },
    { icon: faComments, title: tHome.feature3Title, description: tHome.feature3Description, actionText: tHome.feature3Action, actionTarget: "/forum", color: "text-teal-400" },
    { icon: faGift, title: tHome.feature4Title, description: tHome.feature4Description, actionText: tHome.feature4Action, actionTarget: "/events", color: "text-green-400" },
  ];

  const sponsorBenefits = [
      tHome.benefit1, tHome.benefit2, tHome.benefit3
  ];

  const handleMainAction = () => {
    if (isLoggedIn) navigate('/identity');
    else navigate('/login');
  };

  return (
    <section id="home" className="page-content space-y-20 md:space-y-28 py-10 md:py-16 overflow-x-hidden">

      {/* Hero Section */}
      <div className="relative text-center max-w-4xl mx-auto px-4 z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[150%] bg-gradient-radial from-primary/10 via-transparent to-transparent -z-10 rounded-full blur-3xl"></div>
        <h1 className="font-sans text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white text-stroke-primary leading-tight">
          {tHome.heroTitle}
        </h1>
        <p className="mt-6 text-lg md:text-xl text-[#444444] dark:text-[#94A3B8] max-w-3xl mx-auto leading-relaxed">
          {tHome.heroSubtitle}
        </p>
        <div className="mt-10">
          <button onClick={handleMainAction} className="btn-primary text-white font-bold py-4 px-10 rounded-xl text-lg shadow-2xl shadow-primary/20 transform hover:scale-105 transition-transform duration-300 inline-flex items-center">
            <FontAwesomeIcon icon={isLoggedIn ? faFingerprint : faSignInAlt} className="mr-3 h-5 w-5" />
            {isLoggedIn ? tHome.mintCta : tHeader.login}
          </button>
        </div>
      </div>
      
      {/* How It Works Section */}
      <div className="px-4 py-16 bg-light-card/30 dark:bg-dark-card/30 rounded-3xl">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[#333333] dark:text-[#E0E8F4] mb-3">{tHome.howItWorksTitle}</h2>
          <p className="text-[#444444] dark:text-[#94A3B8] text-lg leading-relaxed">{tHome.howItWorksSubtitle}</p>
        </div>
        <div className="max-w-6xl mx-auto">
            <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12">
                {/* Arrow Connector Line - (visible on desktop) */}
                <div className="hidden md:block absolute top-1/2 -translate-y-1/2 left-0 w-full h-1 bg-primary/20"></div>

                {/* Steps */}
                <HowItWorksStep icon={faUserCheck} title={tHome.step1Title} description={tHome.step1Description} />
                <HowItWorksStep icon={faBullseye} title={tHome.step2Title} description={tHome.step2Description} />
                <HowItWorksStep icon={faChartLine} title={tHome.step3Title} description={tHome.step3Description} />
            </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="space-y-12 px-4 py-16 bg-light-card/30 dark:bg-dark-card/30 rounded-3xl">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-[#333333] dark:text-[#E0E8F4] mb-3 flex items-center justify-center">
            <FontAwesomeIcon icon={faCubesStacked} className="mr-3 text-primary" /> {tHome.featuresTitle}
          </h2>
          <p className="text-[#444444] dark:text-[#94A3B8] text-lg leading-relaxed">
            {tHome.featuresSubtitle}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => <FeatureCard key={index} {...feature} />)}
        </div>
      </div>
      
      {/* Sponsor Logos Section */}
      <div className="py-8 px-4">
        <h2 className="text-center text-sm font-bold uppercase text-slate-500 dark:text-gray-500 tracking-widest mb-6">{tHome.sponsorsTitle}</h2>
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-8">
          <SponsorLogo src="https://img.favpng.com/2/16/5/coming-soon-logo-comingsoon-net-brand-png-favpng-hdzG8G7m7cEf1RKDeDTUutnQD.jpg" alt="Binance Logo" />
          <SponsorLogo src="https://cdn.brandfetch.io/id6XsSOVVS/w/400/h/400/theme/dark/icon.jpeg" alt="Coinbase Logo" />
          <SponsorLogo src="https://www.nftgators.com/wp-content/uploads/2024/11/Vlayer.jpg" alt="Metamask Logo" />
          <SponsorLogo src="https://ik.imagekit.io/5spt6gb2z/IMG_2894.jpeg" alt="Polygon Logo" />
          <SponsorLogo src="https://img.favpng.com/2/16/5/coming-soon-logo-comingsoon-net-brand-png-favpng-hdzG8G7m7cEf1RKDeDTUutnQD.jpg" alt="Chainlink Logo" />
        </div>
      </div>

      {/* Sponsor Attraction Card */}
      <div className="px-4">
        <div className="py-16 px-4 bg-slate-100 dark:bg-gradient-to-br dark:from-[#1a1a2e] dark:to-[#16213e] rounded-3xl">
            <div className="text-center max-w-3xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white mb-3 flex items-center justify-center">
                    <FontAwesomeIcon icon={faHandshake} className="mr-3 text-primary" /> {tHome.sponsorAttractionTitle}
                </h2>
                <p className="text-slate-600 dark:text-[#94A3B8] text-lg leading-relaxed mb-12">{tHome.sponsorAttractionSubtitle}</p>
            </div>
            
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <StatCard icon={faUsers} value="10K+" label={tHome.stat1Label} />
                <StatCard icon={faChartSimple} value="25K+" label={tHome.stat2Label} />
                <StatCard icon={faHashtag} value="50K+" label={tHome.stat3Label} />
            </div>
            <div className="max-w-2xl mx-auto text-center">
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">{tHome.benefitsTitle}</h3>
                  <ul className="space-y-3 text-slate-600 dark:text-[#94A3B8] mb-10 text-lg">
                      {sponsorBenefits.map((benefit, index) => (
                          <li key={index} className="flex items-center justify-center">
                              <FontAwesomeIcon icon={faCheckCircle} className="text-green-400 mr-3" />
                              {benefit}
                          </li>
                      ))}
                  </ul>
                  <a href="mailto:partnership@afa.com" className="btn-secondary font-semibold py-3 px-8 rounded-lg text-lg transform hover:scale-105 transition-transform duration-300 inline-flex items-center">
                      {tHome.sponsorAttractionCta}
                  </a>
            </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="space-y-12 px-4">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-[#333333] dark:text-[#E0E8F4] mb-3">{tHome.testimonialsTitle}</h2>
          <p className="text-[#444444] dark:text-[#94A3B8] text-lg leading-relaxed">{tHome.testimonialsSubtitle}</p>
        </div>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <TestimonialCard quote={tHome.testimonial1Quote} author={tHome.testimonial1Author} role={tHome.testimonial1Role} />
          <TestimonialCard quote={tHome.testimonial2Quote} author={tHome.testimonial2Author} role={tHome.testimonial2Role} />
          <TestimonialCard quote={tHome.testimonial3Quote} author={tHome.testimonial3Author} role={tHome.testimonial3Role} />
        </div>
      </div>
      
      {/* Community Section */}
      <div className="space-y-8 px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-[#333333] dark:text-[#E0E8F4]">{tHome.communityTitle}</h2>
        <p className="text-[#444444] dark:text-[#94A3B8] text-lg max-w-2xl mx-auto leading-relaxed">{tHome.communitySubtitle}</p>
        <div className="flex justify-center items-center space-x-10 md:space-x-16 pt-4">
          <SocialLink icon={faTelegram} name="Telegram" href="https://t.me/yourchannel" />
          <SocialLink icon={faDiscord} name="Discord" href="https://discord.gg/yourserver" />
          <SocialLink icon={faXTwitter} name="X.com" href="https://x.com/yourprofile" />
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="text-center pt-8 px-4">
        <div className="relative max-w-3xl mx-auto p-8 md:p-12 card rounded-2xl border border-primary/20 overflow-hidden bg-gradient-to-br from-primary/10 to-transparent">
          <div className="relative z-10">
            <h3 className="text-3xl md:text-4xl font-bold text-[#333333] dark:text-[#E0E8F4] mb-4">
              {tHome.joinCtaTitle}
            </h3>
            <p className="text-[#444444] dark:text-[#94A3B8] mb-8 text-lg leading-relaxed">
              {tHome.joinCtaSubtitle}
            </p>
            <a href="/signup" className="btn-secondary font-semibold py-3 px-8 rounded-lg text-lg transform hover:scale-105 transition-transform duration-300 inline-flex items-center">
              {tHome.startNow}
              <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
            </a>
          </div>
        </div>
      </div>

    </section>
  );
}
