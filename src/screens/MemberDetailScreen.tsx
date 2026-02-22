import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { MemberAvatar, StatusBadge } from '../components';
import { useLanguage } from '../utils/i18n';
import { Colors, Spacing, Radius, FontSizes, TextStyles } from '../utils/theme';
import * as storageService from '../services/storageService';
import { Member } from '../types';

const MemberDetailScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { t } = useLanguage();
  const memberId = route.params?.memberId;

  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMember = async () => {
      try {
        if (!memberId) return;
        const members = await storageService.getMembers();
        const found = members.find(m => m.id === memberId);
        setMember(found || null);
      } catch (error) {
        console.error('Error loading member:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMember();
  }, [memberId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

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

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
        </View>

        {/* Member Avatar */}
        <View style={styles.avatarSection}>
          <MemberAvatar uri={member.photo} name={member.name} size={80} />
        </View>

        {/* Member Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('members.memberDetail')}</Text>
          <View style={styles.infoCard}>
            <InfoRow label={t('members.name')} value={member.name} />
            {member.email && <InfoRow label={t('members.email')} value={member.email} />}
            {member.phone && <InfoRow label={t('members.phone')} value={member.phone} />}
            {member.position && <InfoRow label={t('members.position')} value={member.position} />}
            {member.company && <InfoRow label={t('members.company')} value={member.company} />}
            {member.rank && <InfoRow label={t('members.rank')} value={member.rank} />}
            <InfoRow label={t('members.joinDate')} value={new Date(member.joinDate).toLocaleDateString()} />
          </View>
        </View>

        {/* Linked Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('members.linkedCards')}</Text>
          {member.cards && member.cards.length > 0 ? (
            <View style={styles.cardsList}>
              {member.cards.map((card, idx) => (
                <View
                  key={card}
                  style={[
                    styles.cardItem,
                    idx !== member.cards.length - 1 && styles.cardItemBorder,
                  ]}>
                  <Text style={styles.cardUID}>{card}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>{t('members.noCards')}</Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('DigitalBusinessCard', { member })}>
          <Text style={styles.actionButtonText}>View Digital Business Card</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
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
  avatarSection: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...TextStyles.headingMedium,
    marginBottom: Spacing.md,
  },
  infoCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoLabel: {
    ...TextStyles.labelMedium,
  },
  infoValue: {
    ...TextStyles.bodyMedium,
    color: Colors.primary,
  },
  cardsList: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardItem: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  cardItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cardUID: {
    ...TextStyles.monoMedium,
  },
  emptyState: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...TextStyles.bodySmall,
  },
  actionButton: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  actionButtonText: {
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

export default MemberDetailScreen;
