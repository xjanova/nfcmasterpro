import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useLanguage } from '../utils/i18n';
import { Colors, Spacing, Radius, FontSizes, TextStyles } from '../utils/theme';
import { DEFAULT_CURRENCY } from '../utils/constants';
import * as paymentService from '../services/paymentService';
import { Transaction } from '../types';

const TransactionHistoryScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { t } = useLanguage();
  const cardUID = route.params?.cardUID;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadTransactions = useCallback(async () => {
    try {
      const data = await paymentService.getTransactionHistory(cardUID);
      setTransactions(data);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  }, [cardUID]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <TouchableOpacity
      style={styles.transactionItem}
      onPress={() => navigation.navigate('PaymentResult', { transaction: item })}>
      <View style={styles.transactionLeft}>
        <Text style={styles.txType}>
          {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
        </Text>
        <Text style={styles.txMember}>{item.memberName || 'Unknown'}</Text>
        <Text style={styles.txDate}>
          {new Date(item.timestamp).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.transactionRight}>
        <Text style={[styles.txAmount, item.type === 'payment' && styles.txAmountDebit]}>
          {item.type === 'payment' ? '-' : '+'}
          {DEFAULT_CURRENCY}
          {item.amount}
        </Text>
        <Text style={styles.txPV}>+{item.pvEarned} PV</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('payment.transactionHistory')}</Text>
      </View>

      {transactions.length > 0 ? (
        <FlatList
          data={transactions}
          renderItem={renderTransaction}
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
          <Text style={styles.emptyText}>{t('payment.noTransactions')}</Text>
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
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  transactionLeft: {
    flex: 1,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  txType: {
    ...TextStyles.labelMedium,
    marginBottom: Spacing.xs,
  },
  txMember: {
    ...TextStyles.bodySmall,
    marginBottom: Spacing.xs,
  },
  txDate: {
    ...TextStyles.labelSmall,
  },
  txAmount: {
    ...TextStyles.bodyMedium,
    color: Colors.success,
    marginBottom: Spacing.xs,
  },
  txAmountDebit: {
    color: Colors.danger,
  },
  txPV: {
    ...TextStyles.labelSmall,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    ...TextStyles.bodySmall,
  },
});

export default TransactionHistoryScreen;
