import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
  FlatList,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  GradientCard,
  NotificationBadge,
  LanguageToggle,
  BalanceDisplay,
} from '../components';
import { useLanguage } from '../utils/i18n';
import { Colors, Spacing, Radius, FontSizes, TextStyles } from '../utils/theme';
import { APP_NAME, DEFAULT_CURRENCY } from '../utils/constants';
import * as cardService from '../services/cardService';
import * as paymentService from '../services/paymentService';
import * as storageService from '../services/storageService';
import { DashboardStats, Transaction } from '../types';

const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { t } = useLanguage();
  const [stats, setStats] = useState<DashboardStats>({
    totalCards: 0,
    activeCards: 0,
    totalMembers: 0,
    totalBalance: 0,
    totalTransactions: 0,
    pvPointsIssued: 0,
    activeMembers: 0,
    pendingTransactions: 0,
  });
  const [recentActivity, setRecentActivity] = useState<Transaction[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    try {
      const [cards, transactions, notifications, members] = await Promise.all([
        cardService.getCards(),
        paymentService.getTransactionHistory(),
        storageService.getNotifications(),
        storageService.getMembers(),
      ]);

      // Calculate stats
      const activeCards = cards.filter(c => c.status === 'active').length;
      const totalBalance = cards.reduce((sum, c) => sum + c.balance, 0);
      const totalPV = cards.reduce((sum, c) => sum + c.pvPoints, 0);
      const activeMembers = members.length;
      const unreadNotifications = notifications.filter(n => !n.read).length;

      setStats({
        totalCards: cards.length,
        activeCards,
        totalMembers: members.length,
        totalBalance,
        totalTransactions: transactions.length,
        pvPointsIssued: totalPV,
        activeMembers,
        pendingTransactions: 0,
      });

      setRecentActivity(transactions.slice(0, 5));
      setNotificationCount(unreadNotifications);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [loadDashboardData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const navigateToNFC = (screen: string) => {
    const screenMap: { [key: string]: any } = {
      read: 'ReadNFC',
      write: 'WriteNFC',
      clone: 'CloneNFC',
      hex: 'HexView',
    };
    navigation.navigate(screenMap[screen] || 'Dashboard');
  };

  const handleQuickAction = (action: string) => {
    const actionMap: { [key: string]: string } = {
      scan: 'ReadNFC',
      qrscanner: 'QRScanner',
      register: 'CardDetail',
      member: 'MemberRegister',
      topup: 'Payment',
    };
    navigation.navigate(actionMap[action] || 'Dashboard');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{APP_NAME}</Text>
            <Text style={styles.subtitle}>v2.0</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Notifications')}
              style={styles.notificationButton}>
              <Text style={styles.bellIcon}>🔔</Text>
              {notificationCount > 0 && (
                <NotificationBadge count={notificationCount} />
              )}
            </TouchableOpacity>
            <View style={styles.languageToggleWrapper}>
              <LanguageToggle />
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsSection}>
          <View style={styles.statsRow}>
            <GradientCard
              icon="💳"
              value={stats.totalCards.toString()}
              label={t('dashboard.totalCards')}
              style={styles.statCard}
            />
            <GradientCard
              icon="👤"
              value={stats.totalMembers.toString()}
              label={t('dashboard.totalMembers')}
              style={styles.statCard}
            />
          </View>
          <View style={styles.statsRow}>
            <GradientCard
              icon="💰"
              value={`${stats.totalBalance} ${DEFAULT_CURRENCY}`}
              label={t('cards.balance')}
              style={styles.statCard}
            />
            <GradientCard
              icon="⭐"
              value={stats.pvPointsIssued.toString()}
              label={t('cards.pvPoints')}
              style={styles.statCard}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('dashboard.quickScan')}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.quickActionsScroll}
            contentContainerStyle={styles.quickActionsContent}>
            {[
              { key: 'scan', icon: '🔍', label: 'Scan' },
              { key: 'qrscanner', icon: '📱', label: 'QR Code' },
              { key: 'register', icon: '💳', label: 'Register' },
              { key: 'member', icon: '👤', label: 'Member' },
              { key: 'topup', icon: '💰', label: 'Top Up' },
            ].map(action => (
              <TouchableOpacity
                key={action.key}
                style={styles.quickActionButton}
                onPress={() => handleQuickAction(action.key)}>
                <View style={styles.quickActionIcon}>
                  <Text style={styles.quickActionIconText}>{action.icon}</Text>
                </View>
                <Text style={styles.quickActionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('dashboard.recentActivity')}</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('TransactionHistory')}>
              <Text style={styles.viewAllLink}>View All →</Text>
            </TouchableOpacity>
          </View>

          {recentActivity.length > 0 ? (
            <View style={styles.activityList}>
              {recentActivity.map((tx, idx) => (
                <View
                  key={tx.id}
                  style={[
                    styles.activityItem,
                    idx !== recentActivity.length - 1 && styles.activityItemBorder,
                  ]}>
                  <View style={styles.activityLeft}>
                    <Text style={styles.activityMemberName}>{tx.memberName || 'Unknown'}</Text>
                    <Text style={styles.activityTime}>
                      {new Date(tx.timestamp).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.activityRight}>
                    <Text style={styles.activityAmount}>
                      {tx.type === 'payment' ? '-' : '+'}
                      {DEFAULT_CURRENCY}
                      {tx.amount}
                    </Text>
                    <Text style={styles.activityType}>
                      {tx.type === 'payment' ? 'Payment' : 'Top-up'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No recent transactions</Text>
            </View>
          )}
        </View>

        {/* NFC Tools */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('dashboard.nfcTools')}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.nfcToolsScroll}
            contentContainerStyle={styles.nfcToolsContent}>
            {[
              { key: 'read', icon: '📡', label: 'Read' },
              { key: 'write', icon: '✏️', label: 'Write' },
              { key: 'clone', icon: '📋', label: 'Clone' },
              { key: 'hex', icon: '🔬', label: 'Hex View' },
            ].map(tool => (
              <TouchableOpacity
                key={tool.key}
                style={styles.nfcToolButton}
                onPress={() => navigateToNFC(tool.key)}>
                <View style={styles.nfcToolIcon}>
                  <Text style={styles.nfcToolIconText}>{tool.icon}</Text>
                </View>
                <Text style={styles.nfcToolLabel}>{tool.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>xman studio</Text>
        </View>
      </ScrollView>
    </View>
  );
};

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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  title: {
    ...TextStyles.headingLarge,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...TextStyles.bodySmall,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  notificationButton: {
    padding: Spacing.sm,
    position: 'relative',
  },
  bellIcon: {
    fontSize: 24,
  },
  languageToggleWrapper: {
    marginLeft: Spacing.sm,
  },
  statsSection: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...TextStyles.headingMedium,
    marginBottom: Spacing.md,
  },
  viewAllLink: {
    color: Colors.primary,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  quickActionsScroll: {
    marginHorizontal: -Spacing.lg,
  },
  quickActionsContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  quickActionButton: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionIconText: {
    fontSize: 28,
  },
  quickActionLabel: {
    ...TextStyles.labelMedium,
    textAlign: 'center',
    width: 56,
  },
  activityList: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  activityItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  activityLeft: {
    flex: 1,
  },
  activityMemberName: {
    ...TextStyles.bodyMedium,
    marginBottom: Spacing.xs,
  },
  activityTime: {
    ...TextStyles.bodySmall,
  },
  activityRight: {
    alignItems: 'flex-end',
  },
  activityAmount: {
    ...TextStyles.bodyMedium,
    color: Colors.success,
    marginBottom: Spacing.xs,
  },
  activityType: {
    ...TextStyles.labelSmall,
  },
  nfcToolsScroll: {
    marginHorizontal: -Spacing.lg,
  },
  nfcToolsContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  nfcToolButton: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  nfcToolIcon: {
    width: 64,
    height: 64,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nfcToolIconText: {
    fontSize: 32,
  },
  nfcToolLabel: {
    ...TextStyles.labelMedium,
    textAlign: 'center',
    width: 64,
  },
  emptyState: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  emptyStateText: {
    ...TextStyles.bodySmall,
  },
  footer: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    ...TextStyles.bodySmall,
    color: Colors.textMuted,
  },
});

export default DashboardScreen;
