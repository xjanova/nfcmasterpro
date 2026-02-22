import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, FontSizes, Spacing, Radius } from '../utils/theme';
import { useLanguage } from '../utils/i18n';

interface LanguageToggleProps {
  compact?: boolean;
}

const LanguageToggle: React.FC<LanguageToggleProps> = ({ compact = false }) => {
  const { lang, setLang } = useLanguage();

  const toggleLanguage = async () => {
    const newLang = lang === 'th' ? 'en' : 'th';
    await setLang(newLang);
  };

  if (compact) {
    return (
      <TouchableOpacity
        style={styles.compactButton}
        onPress={toggleLanguage}
        activeOpacity={0.7}
      >
        <Text style={styles.compactText}>
          {lang === 'th' ? 'EN' : 'TH'}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: lang === 'th' ? Colors.primary : Colors.surface,
          },
        ]}
        onPress={toggleLanguage}
        activeOpacity={0.8}
      >
        <Text style={styles.flag}>🇹🇭</Text>
        <Text
          style={[
            styles.label,
            {
              color: lang === 'th' ? Colors.text : Colors.textSecondary,
            },
          ]}
        >
          ภาษาไทย
        </Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: lang === 'en' ? Colors.primary : Colors.surface,
          },
        ]}
        onPress={toggleLanguage}
        activeOpacity={0.8}
      >
        <Text style={styles.flag}>🇬🇧</Text>
        <Text
          style={[
            styles.label,
            {
              color: lang === 'en' ? Colors.text : Colors.textSecondary,
            },
          ]}
        >
          English
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  flag: {
    fontSize: FontSizes.lg,
  },
  label: {
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  divider: {
    width: 1,
    height: '80%',
    backgroundColor: Colors.border,
  },
  compactButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  compactText: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.primary,
  },
});

export default LanguageToggle;
