/**
 * Контекст локализации приложения
 * Управление языком интерфейса
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import ru from './ru';
import en from './en';

const translations = {
  ru,
  en
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    // Получаем сохраненный язык или определяем по браузеру
    const saved = localStorage.getItem('app_language');
    if (saved && translations[saved]) {
      return saved;
    }
    
    // Определяем язык браузера
    const browserLang = navigator.language.split('-')[0];
    return translations[browserLang] ? browserLang : 'ru';
  });

  useEffect(() => {
    // Сохраняем выбранный язык
    localStorage.setItem('app_language', language);
  }, [language]);

  const changeLanguage = (newLang) => {
    if (translations[newLang]) {
      setLanguage(newLang);
    }
  };

  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage должен использоваться внутри LanguageProvider');
  }
  return context;
}
