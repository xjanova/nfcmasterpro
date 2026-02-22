import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  NotificationBadge,
  LanguageToggle,
} from '../components';
import { useLanguage } from '../utils/i18n';
import { useTheme } from '../context/ThemeContext';
import { createTextStyles, Spacing, Radius, FontSizes, Shadow } from '../utils/theme';
import { APP_NAME, APP_VERSION, DEFAULT_CURRENCY } from '../utils/constants';
import * as cardService from '../services/cardService';
import * as paymentService from '../services/paymentService';
import * as storageService from '../services/storageService';
import { DashboardStats, Transaction } from '../types';

const DashboardScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { t } = useLanguage();
  const { colors, theme, toggleTheme } = useTheme();
  const ts = createTextStyles(colors);
  const [stats, setStats] = useState<DashboardStats>({
    totalCards: 0, activeCards: 0, totalMembers: 0, totalBalance: 0,
    totalTransactions: 0, pvPointsIssued: 0, activeMembers: 0, pendingTransactions: 0,
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
      const activeCards = cards.filter(c => c.status === 'active').length;
      const totalBalance = cards.reduce((sum, c) => sum + c.balance, 0);
      const totalPV = cards.reduce((sum, c) => sum + c.pvPoints, 0);
      const unreadNotifications = notifications.filter(n => !n.read).length;
      setStats({
        totalCards: cards.length, activeCards, totalMembers: members.length, totalBalance,
        totalTransactions: transactions.length, pvPointsIssued: totalPV, activeMembers: members.length, pendingTransactions: 0,
      });
      setRecentActivity(transactions.slice(0, 5));
      setNotificationCount(unreadNotifications);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadDashboardData(); }, [loadDashboardData]);
  useFocusEffect(useCallback(() => { loadDashboardData(); }, [loadDashboardData]));

  const onRefresh = async () => { setRefreshing(true); await loadDashboardData(); setRefreshing(false); };

  const navigateToNFC = (screen: string) => {
    const m: Record<string, string> = { read: 'ReadNFC', write: 'WriteNFC', clone: 'CloneNFC', hex: 'HexView' };
    navigation.navigate(m[screen] || 'Dashboard');
  };

  const handleQuickAction = (action: string) => {
    const m: Record<string, string> = { scan: 'ReadNFC', qrscanner: 'QRScanner', register: 'CardDetail', member: 'MemberRegister', topup: 'Payment' };
    navigation.navigate(m[action] || 'Dashboard');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.bg }]}>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.bg} />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[ts.headingLarge, { fontWeight: '800', marginBottom: 2 }]}>{APP_NAME}</Text>
            <Text style={ts.bodySmall}>v{APP_VERSION}</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity onPress={toggleTheme}
              style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={{ fontSize: 16 }}>{theme === 'dark' ? '☀' : '☾'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Notifications')}
              style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={{ fontSize: 16 }}>{'🔔'}</Text>
              {notificationCount > 0 && <NotificationBadge count={notificationCount} />}
            </TouchableOpacity>
            <LanguageToggle compact />
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsSection}>
          <View style={styles.statsRow}>
            <StatCard icon="💳" value={String(stats.totalCards)} label={t['dashboard.totalCards']} colors={colors} />
            <StatCard icon="👤" value={String(stats.totalMembers)} label={t['dashboard.totalMembers']} colors={colors} />
          </View>
          <View style={styles.statsRow}>
            <StatCard icon="💰" value={`${DEFAULT_CURRENCY}${stats.totalBalance}`} label={t['cards.balance']} colors={colors} />
            <StatCard icon="⭐" value={String(stats.pvPointsIssued)} label={t['cards.pvPoints']} colors={colors} />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[ts.headingMedium, { fontWeight: '700', marginBottom: Spacing.md }]}>{t['dashboard.quickScan']}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -Spacing.xl }}
            contentContainerStyle={{ paddingHorizontal: Spacing.xl, gap: Spacing.md }}>
            {[
              { key: 'scan', icon: '📡', label: 'Scan' },
              { key: 'qrscanner', icon: '🔗', label: 'Pair' },
              { key: 'register', icon: '💳', label: 'Register' },
              { key: 'member', icon: '👤', label: 'Member' },
              { key: 'topup', icon: '💰', label: 'Top Up' },
            ].map(a => (
              <TouchableOpacity key={a.key} style={styles.qaBtn} onPress={() => handleQuickAction(a.key)}>
                <View style={[styles.qaIcon, { backgroundColor: colors.card, borderColor: colors.border }, Shadow.sm]}>
                  <Text style={{ fontSize: 26 }}>{a.icon}</Text>
                </View>
                <Text style={[styles.qaLabel, { color: colors.textSecondary }]}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[ts.headingMedium, { fontWeight: '700' }]}>{t['dashboard.recentActivity']}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('TransactionHistory')}>
              <Text style={{ color: colors.primary, fontSize: FontSizes.sm, fontWeight: '600' }}>View All {'>'}</Text>
            </TouchableOpacity>
          </View>
          {recentActivity.length > 0 ? (
            <View style={[styles.activityList, { backgroundColor: colors.card, borderColor: colors.border }, Shadow.sm]}>
              {recentActivity.map((tx, idx) => (
                <View key={tx.id} style={[styles.activityItem, idx !== recentActivity.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[ts.bodyMedium, { fontWeight: '600', marginBottom: 2 }]}>{tx.memberName || 'Unknown'}</Text>
                    <Text style={ts.bodySmall}>{new Date(tx.timestamp).toLocaleDateString()}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[ts.bodyMedium, { color: tx.type === 'payment' ? colors.danger : colors.success, fontWeight: '700', fontFamily: 'monospace' }]}>
                      {tx.type === 'payment' ? '-' : '+'}{DEFAULT_CURRENCY}{tx.amount}
                    </Text>
                    <Text style={ts.labelSmall}>{tx.type === 'payment' ? 'Payment' : 'Top-up'}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[ts.bodySmall, { textAlign: 'center' }]}>No recent transactions</Text>
            </View>
          )}
        </View>

        {/* NFC Tools */}
        <View style={styles.section}>
          <Text style={[ts.headingMedium, { fontWeight: '700', marginBottom: Spacing.md }]}>{t['dashboard.nfcTools']}</Text>
          <View style={styles.nfcGrid}>
            {[
              { key: 'read', icon: '📡', label: 'Read', desc: 'Read NFC tags' },
              { key: 'write', icon: '✏️', label: 'Write', desc: 'Write data' },
              { key: 'clone', icon: '📋', label: 'Clone', desc: 'Copy tag data' },
              { key: 'hex', icon: '🔬', label: 'Hex View', desc: 'Raw hex data' },
            ].map(tool => (
              <TouchableOpacity key={tool.key}
                style={[styles.nfcCard, { backgroundColor: colors.card, borderColor: colors.border }, Shadow.sm]}
                onPress={() => navigateToNFC(tool.key)}>
                <Text style={{ fontSize: 32, marginBottom: 4 }}>{tool.icon}</Text>
                <Text style={[ts.bodyMedium, { fontWeight: '600' }]}>{tool.label}</Text>
                <Text style={[ts.labelSmall, { textAlign: 'center' }]}>{tool.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={[ts.bodySmall, { color: colors.textMuted }]}>xman studio</Text>
        </View>
        <View style={{ height: 90 }} />
      </ScrollView>
    </View>
  );
};

const StatCard: React.FC<{ icon: string; value: string; label: string; colors: any }> = ({ icon, value, label, colors }) => (
  <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }, Shadow.sm]}>
    <Text style={{ fontSize: 22, marginBottom: 4 }}>{icon}</Text>
    <Text style={{ fontSize: FontSizes.xxl, fontWeight: '800', color: colors.text }}>{value}</Text>
    <Text style={{ fontSize: FontSizes.xs, fontWeight: '500', color: colors.textMuted }}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: Spacing.xxl },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.xl,
  },
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  iconBtn: {
    width: 38, height: 38, borderRadius: Radius.md,
    borderWidth: 1, justifyContent: 'center', alignItems: 'center',
  },
  statsSection: { paddingHorizontal: Spacing.xl, gap: Spacing.md, marginBottom: Spacing.xl },
  statsRow: { flexDirection: 'row', gap: Spacing.md },
  statCard: { flex: 1, borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1, alignItems: 'center', gap: 2 },
  section: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  qaBtn: { alignItems: 'center', gap: Spacing.sm },
  qaIcon: { width: 56, height: 56, borderRadius: Radius.lg, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  qaLabel: { fontSize: FontSizes.xs, fontWeight: '600', textAlign: 'center', width: 56 },
  activityList: { borderRadius: Radius.lg, overflow: 'hidden', borderWidth: 1 },
  activityItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  empty: { paddingVertical: Spacing.xxl, alignItems: 'center', borderRadius: Radius.lg, borderWidth: 1 },
  nfcGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  nfcCard: { width: '47%', borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1, alignItems: 'center', gap: Spacing.xs },
  footer: { paddingVertical: Spacing.xl, alignItems: 'center' },
});

export default DashboardScreen;
