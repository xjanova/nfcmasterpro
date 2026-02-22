import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Share,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { BusinessCard, MemberAvatar } from '../components';
import { useLanguage } from '../utils/i18n';
import { Colors, Spacing, Radius, FontSizes, TextStyles } from '../utils/theme';

const DigitalBusinessCardScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { t } = useLanguage();
  const member = route.params?.member;
  const [cardStyle, setCardStyle] = useState<'dark' | 'light' | 'gradient'>('dark');

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out my business card: ${member?.name} - ${member?.position || 'Professional'}`,
        title: 'Digital Business Card',
      });
    } catch (error) {
      Alert.alert(t('common.error'), 'Failed to share');
    }
  };

  if (!member) {
    return (
      <View style={styles.container}>
        <Text style={styles.notFound}>Member not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <BusinessCard member={member} style={cardStyle} />

        <View style={styles.styleSelector}>
          <Text style={styles.styleLabel}>Style</Text>
          <View style={styles.styleButtons}>
            {(['dark', 'light', 'gradient'] as const).map(style => (
              <TouchableOpacity
                key={style}
                style={[
                  styles.styleButton,
                  cardStyle === style && styles.styleButtonActive,
                ]}
                onPress={() => setCardStyle(style)}>
                <Text
                  style={[
                    styles.styleButtonText,
                    cardStyle === style && styles.styleButtonTextActive,
                  ]}>
                  {style.charAt(0).toUpperCase() + style.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Text style={styles.shareButtonIcon}>↗</Text>
          <Text style={styles.shareButtonText}>{t('businessCard.shareVia')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  backButton: {
    color: Colors.primary,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  styleSelector: {
    marginTop: Spacing.xxl,
    width: '100%',
  },
  styleLabel: {
    ...TextStyles.labelMedium,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  styleButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  styleButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  styleButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  styleButtonText: {
    color: Colors.textMuted,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  styleButtonTextActive: {
    color: Colors.text,
  },
  shareButton: {
    marginTop: Spacing.xl,
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
  },
  shareButtonIcon: {
    fontSize: 18,
    color: Colors.text,
  },
  shareButtonText: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: FontSizes.md,
  },
  notFound: {
    flex: 1,
    textAlign: 'center',
    marginTop: '50%',
    color: Colors.textMuted,
  },
});

export default DigitalBusinessCardScreen;
