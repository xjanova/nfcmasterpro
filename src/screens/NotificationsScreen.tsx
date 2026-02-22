import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { EmptyState } from '../components';
import { useLanguage } from '../utils/i18n';
import { Colors, Spacing, Radius, FontSizes, TextStyles } from '../utils/theme';
import * as storageService from '../services/storageService';
import { AppNotification } from '../types';

const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      const data = await storageService.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleMarkAllRead = async () => {
    try {
      const updated = notifications.map(n => ({ ...n, read: true }));
      await storageService.saveNotifications(updated);
      setNotifications(updated);
    } catch (error) {
      Alert.alert(t['common.error'], 'Failed to mark as read');
    }
  };

  const handleClear = async () => {
    Alert.alert(t['common.confirm'], 'Clear all notifications?', [
      { text: t['common.cancel'], style: 'cancel' },
      {
        text: 'Clear',
        onPress: async () => {
          try {
            await storageService.saveNotifications([]);
            setNotifications([]);
          } catch (error) {
            Alert.alert(t['common.error'], 'Failed to clear notifications');
          }
        },
        style: 'destructive',
      },
    ]);
  };

  const getNotificationIcon = (type: string): string => {
    switch (type) {
      case 'low_balance':
        return '⚠️';
      case 'card_registered':
        return '✓';
      case 'card_status_change':
        return '🔄';
      case 'payment':
        return '💰';
      case 'member_registered':
        return '👤';
      default:
        return '📢';
    }
  };

  const renderNotification = ({ item }: { item: AppNotification }) => (
    <View
      style={[
        styles.notificationItem,
        !item.read && styles.notificationItemUnread,
      ]}>
      <Text style={styles.notificationIcon}>{getNotificationIcon(item.type)}</Text>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationMessage}>{item.message}</Text>
        <Text style={styles.notificationTime}>
          {new Date(item.timestamp).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t['notifications.notifications']}</Text>
        <View style={styles.headerActions}>
          {notifications.length > 0 && (
            <>
              <TouchableOpacity onPress={handleMarkAllRead} style={styles.headerAction}>
                <Text style={styles.headerActionText}>✓ All Read</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleClear} style={styles.headerAction}>
                <Text style={styles.headerActionText}>🗑️</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {notifications.length > 0 ? (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon="🔔"
            title="No Notifications"
            message="You're all caught up"
          />
        </View>
      )}
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
    marginBottom: Spacing.md,
  },
  title: {
    ...TextStyles.headingLarge,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  headerAction: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerActionText: {
    ...TextStyles.labelSmall,
    color: Colors.primary,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  notificationItemUnread: {
    backgroundColor: Colors.surface,
    borderColor: Colors.primary,
  },
  notificationIcon: {
    fontSize: 24,
    marginRight: Spacing.lg,
    marginTop: Spacing.sm,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    ...TextStyles.bodyMedium,
    marginBottom: Spacing.xs,
  },
  notificationMessage: {
    ...TextStyles.bodySmall,
    marginBottom: Spacing.xs,
  },
  notificationTime: {
    ...TextStyles.labelSmall,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default NotificationsScreen;
