// src/contexts/LanguageContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'; //
import en from '../translations/en.json'; //
import id from '../translations/id.json'; //

const LanguageContext = createContext(); //

const translations = { //
  en, //
  id //
}; //

export const LanguageProvider = ({ children }) => { //
  // Ambil bahasa dari localStorage, default ke 'en' jika tidak ada
  const [language, setLanguage] = useState(() => { //
    const storedLang = localStorage.getItem('appLanguage'); //
    return storedLang || 'en'; //
  }); //

  const t = useCallback((key) => { //
    const keys = key.split('.'); //
    let result = translations[language]; //
    for (let i = 0; i < keys.length; i++) { //
      if (result && typeof result === 'object' && keys[i] in result) { //
        result = result[keys[i]]; //
      } else { //
        // Fallback to English if key not found in current language
        let fallbackResult = translations['en']; //
        for (let j = 0; j < keys.length; j++) { //
          if (fallbackResult && typeof fallbackResult === 'object' && keys[j] in fallbackResult) { //
            fallbackResult = fallbackResult[keys[j]]; //
          } else { //
            return key; // Return original key if not found in English either
          } //
        } //
        return fallbackResult; //
      } //
    } //
    return result || key; //
  }, [language]); //

  const changeLanguage = (lang) => { //
    setLanguage(lang); //
    localStorage.setItem('appLanguage', lang); // Simpan preferensi bahasa ke localStorage
  }; //

  const value = { language, t, changeLanguage }; //

  return ( //
    <LanguageContext.Provider value={value}> {/* */}
      {children} {/* */}
    </LanguageContext.Provider> //
  ); //
}; //

export const useLanguage = () => { //
  return useContext(LanguageContext); //
}; //
