import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../utils/translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('amanot_lang') || 'bn';
  });

  useEffect(() => {
    localStorage.setItem('amanot_lang', lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const t = (key) => {
    const currentDict = translations[lang] || translations.bn;
    return currentDict[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
