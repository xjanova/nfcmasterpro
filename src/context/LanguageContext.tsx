import React, { useState, useEffect, ReactNode } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
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
      setLangState(newLang);
    }
  };

  const value: LanguageContextType = {
    t: strings[lang],
    lang,
    setLang,
  };

  // Show dark loading screen while language preference loads
  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="small" color="#6366f1" />
      </View>
    );
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LanguageProvider;
