import React, { useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  LanguageContext,
  Language,
  strings,
  LanguageContextType,
} from '../utils/i18n';
import { STORAGE_KEYS } from '../utils/constants';

interface LanguageProviderProps {
  children: ReactNode;
}

/**
 * LanguageProvider component
 * Manages app language state and persistence
 * Default language: Thai ('th')
 * Stores preference in AsyncStorage with key: @nfc_language
 */
export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [lang, setLangState] = useState<Language>('th');
  const [isLoading, setIsLoading] = useState(true);

  // Load language preference from storage on mount
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLang = await AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE);
        if (savedLang === 'en' || savedLang === 'th') {
          setLangState(savedLang as Language);
        }
      } catch (error) {
        console.warn('Failed to load language preference:', error);
        // Default to Thai on error
        setLangState('th');
      } finally {
        setIsLoading(false);
      }
    };

    loadLanguage();
  }, []);

  // Save language preference when it changes
  const setLang = async (newLang: Language) => {
    try {
      setLangState(newLang);
      await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, newLang);
    } catch (error) {
      console.warn('Failed to save language preference:', error);
      // Still update state even if storage fails
      setLangState(newLang);
    }
  };

  const value: LanguageContextType = {
    t: strings[lang],
    lang,
    setLang,
  };

  // Don't render children until language is loaded
  if (isLoading) {
    return null; // Or return a splash screen component
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageProvider;
