import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';
import { BusinessCardData } from '../types';
import { Colors, FontSizes, Spacing, Radius, TextStyles } from '../utils/theme';
import MemberAvatar from './MemberAvatar';

interface BusinessCardProps {
  data: BusinessCardData;
  style?: 'dark' | 'light' | 'gradient';
}

const BusinessCard: React.FC<BusinessCardProps> = ({
  data,
  style = 'dark',
}) => {
  const getBackgroundStyle = () => {
    switch (style) {
      case 'light':
        return {
          backgroundColor: Colors.surface,
          borderColor: Colors.border,
        };
      case 'gradient':
        return {
          backgroundColor: Colors.primary,
          borderColor: Colors.secondary,
        };
      case 'dark':
      default:
        return {
          backgroundColor: Colors.card,
          borderColor: Colors.border,
        };
    }
  };

  const getTextColor = () => {
    switch (style) {
      case 'light':
        return Colors.text;
      case 'gradient':
        return Colors.text;
      case 'dark':
      default:
        return Colors.text;
    }
  };

  const backgroundStyle = getBackgroundStyle();
  const textColor = getTextColor();

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[
          styles.card,
          backgroundStyle,
          {
            minHeight: 260,
            aspectRatio: 1.75,
          },
        ]}
      >
        {/* Header with Avatar */}
        <View style={styles.header}>
          <MemberAvatar name={data.name} photo={data.photo} size={80} />
        </View>

        {/* Name */}
        <View style={styles.nameSection}>
          <Text
            style={[
              styles.name,
              { color: textColor },
            ]}
            numberOfLines={2}
          >
            {data.name}
          </Text>
        </View>

        {/* Position & Company */}
        <View style={styles.infoSection}>
          {data.position && (
            <Text
              style={[
                styles.position,
                { color: Colors.secondary },
              ]}
              numberOfLines={1}
            >
              {data.position}
            </Text>
          )}
          {data.company && (
            <Text
              style={[
                styles.company,
                { color: Colors.textSecondary },
              ]}
              numberOfLines={1}
            >
              {data.company}
            </Text>
          )}
        </View>

        {/* Contact Info */}
        <View style={styles.contactSection}>
          {data.phone && (
            <View style={styles.contactItem}>
              <Text style={styles.contactIcon}>📱</Text>
              <Text
                style={[styles.contactText, { color: textColor }]}
                numberOfLines={1}
              >
                {data.phone}
              </Text>
            </View>
          )}
          {data.email && (
            <View style={styles.contactItem}>
              <Text style={styles.contactIcon}>✉️</Text>
              <Text
                style={[styles.contactText, { color: textColor }]}
                numberOfLines={1}
              >
                {data.email}
              </Text>
            </View>
          )}
        </View>

        {/* QR Code Placeholder */}
        <View style={styles.qrSection}>
          <View
            style={[
              styles.qrPlaceholder,
              { backgroundColor: Colors.surface },
            ]}
          >
            <Text style={styles.qrText}>QR</Text>
          </View>
        </View>

        {/* Footer - Studio Watermark */}
        <View style={styles.footer}>
          <Text
            style={[
              styles.watermark,
              { color: Colors.textMuted },
            ]}
          >
            xman studio
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  nameSection: {
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  name: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    textAlign: 'center',
  },
  infoSection: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  position: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  company: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
  contactSection: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  contactIcon: {
    fontSize: FontSizes.lg,
  },
  contactText: {
    fontSize: FontSizes.sm,
    flex: 1,
  },
  qrSection: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  qrPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  qrText: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  footer: {
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  watermark: {
    fontSize: FontSizes.xs,
    fontWeight: '500',
  },
});

export default BusinessCard;
