import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { NFCCardVisual, StatusBadge, BalanceDisplay } from '../components';
import { useLanguage } from '../utils/i18n';
import { Colors, Spacing, Radius, FontSizes, TextStyles, Shadow } from '../utils/theme';
import { DEFAULT_CURRENCY } from '../utils/constants';
import * as cardService from '../services/cardService';
import * as paymentService from '../services/paymentService';
import { CardInfo, Transaction } from '../types';

const CardDetailScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { t } = useLanguage();
  const cardUID = route.params?.cardUID;

  const [card, setCard] = useState<CardInfo | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [addBalanceModalVisible, setAddBalanceModalVisible] = useState(false);
  const [addBalanceAmount, setAddBalanceAmount] = useState('');
  const [processingBalance, setProcessingBalance] = useState(false);

  const loadCardData = useCallback(async () => {
    try {
      if (!cardUID) return;

      const [cardData, txs] = await Promise.all([
        cardService.getCardByUID(cardUID),
        cardService.getCardTransactions(cardUID),
      ]);

      setCard(cardData);
      setTransactions(txs.slice(0, 10));
    } catch (error) {
      console.error('Error loading card data:', error);
    } finally {
      setLoading(false);
    }
  }, [cardUID]);

  useFocusEffect(
    useCallback(() => {
      if (cardUID) {
        loadCardData();
      }
    }, [cardUID, loadCardData])
  );

  const handleAddBalance = async () => {
    if (!cardUID || !addBalanceAmount) {
      Alert.alert(t['common.error'], 'Please enter an amount');
      return;
    }

    const amount = parseFloat(addBalanceAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert(t['common.error'], 'Invalid amount');
      return;
    }

    setProcessingBalance(true);
    try {
      await paymentService.addCredit(cardUID, amount);
      Alert.alert(t['common.success'], 'Balance added successfully');
      setAddBalanceModalVisible(false);
      setAddBalanceAmount('');
      await loadCardData();
    } catch (error) {
      Alert.alert(
        t['common.error'],
        error instanceof Error ? error.message : 'Failed to add balance'
      );
    } finally {
      setProcessingBalance(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!card) return;

    Alert.alert(
      t['common.confirm'],
      `${card.status === 'active' ? 'Disable' : 'Enable'} this card?`,
      [
        { text: t['common.cancel'], style: 'cancel' },
        {
          text: t['common.confirm'],
          onPress: async () => {
            try {
              const newStatus = card.status === 'active' ? 'disabled' : 'active';
              const updated = await cardService.updateCardStatus(
                cardUID,
                newStatus
              );
              setCard(updated);
              Alert.alert(t['common.success'], 'Card status updated');
            } catch (error) {
              Alert.alert(
                t['common.error'],
                error instanceof Error ? error.message : 'Failed to update status'
              );
            }
          },
        },
      ]
    );
  };

  const handleMarkAsLost = async () => {
    if (!card) return;

    Alert.alert(
      t['common.confirm'],
      'Mark this card as lost? This action cannot be undone.',
      [
        { text: t['common.cancel'], style: 'cancel' },
        {
          text: 'Mark as Lost',
          onPress: async () => {
            try {
              const updated = await cardService.updateCardStatus(cardUID, 'lost');
              setCard(updated);
              Alert.alert(t['common.success'], 'Card marked as lost');
            } catch (error) {
              Alert.alert(
                t['common.error'],
                error instanceof Error ? error.message : 'Failed to mark as lost'
              );
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleDeleteCard = async () => {
    Alert.alert(
      t['common.confirm'],
      'Delete this card permanently? This cannot be undone.',
      [
        { text: t['common.cancel'], style: 'cancel' },
        {
          text: t['common.delete'],
          onPress: async () => {
            try {
              await cardService.deleteCard(cardUID);
              Alert.alert(t['common.success'], 'Card deleted');
              navigation.goBack();
            } catch (error) {
              Alert.alert(
                t['common.error'],
                error instanceof Error ? error.message : 'Failed to delete card'
              );
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  if (loading || !card) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
        </View>

        {/* Card Visual */}
        <View style={styles.cardVisualSection}>
          <NFCCardVisual
            uid={card.uid}
            memberName={card.memberName || 'Unregistered'}
            balance={card.balance}
            compact={false}
          />
        </View>

        {/* Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Information</Text>
          <View style={styles.infoCard}>
            <InfoRow label="UID" value={card.uid} mono={true} />
            <InfoRow label="Type" value={card.tagType || 'Unknown'} />
            <InfoRow
              label="Registered"
              value={new Date(card.registeredAt).toLocaleDateString()}
            />
            {card.lastUsed && (
              <InfoRow
                label="Last Used"
                value={new Date(card.lastUsed).toLocaleDateString()}
              />
            )}
          </View>
        </View>

        {/* Balance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Balance</Text>
          <View style={styles.balanceSection}>
            <BalanceDisplay balance={card.balance} />
            <TouchableOpacity
              style={styles.addBalanceButton}
              onPress={() => setAddBalanceModalVisible(true)}>
              <Text style={styles.addBalanceButtonText}>+ Add Balance</Text>
            </TouchableOpacity>
            <View style={styles.pvSection}>
              <Text style={styles.pvLabel}>PV Points</Text>
              <Text style={styles.pvValue}>{card.pvPoints}</Text>
            </View>
          </View>
        </View>

        {/* Status Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status</Text>
          <View style={styles.statusSection}>
            <View style={styles.statusDisplay}>
              <Text style={styles.statusLabel}>Current Status</Text>
              <StatusBadge status={card.status} />
            </View>
            <TouchableOpacity
              style={[
                styles.actionButton,
                card.status === 'active' && styles.actionButtonDanger,
              ]}
              onPress={handleToggleStatus}>
              <Text style={styles.actionButtonText}>
                {card.status === 'active' ? 'Disable Card' : 'Enable Card'}
              </Text>
            </TouchableOpacity>
            {card.status !== 'lost' && (
              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonDanger]}
                onPress={handleMarkAsLost}>
                <Text style={styles.actionButtonText}>Mark as Lost</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Transaction History */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Transactions</Text>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('TransactionHistory', { cardUID })
              }>
              <Text style={styles.viewAllLink}>View All →</Text>
            </TouchableOpacity>
          </View>

          {transactions.length > 0 ? (
            <View style={styles.transactionList}>
              {transactions.map((tx, idx) => (
                <View
                  key={tx.id}
                  style={[
                    styles.transactionItem,
                    idx !== transactions.length - 1 && styles.transactionBorder,
                  ]}>
                  <View>
                    <Text style={styles.txType}>{tx.type}</Text>
                    <Text style={styles.txDate}>
                      {new Date(tx.timestamp).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.txAmountSection}>
                    <Text style={styles.txAmount}>
                      {tx.type === 'payment' ? '-' : '+'}
                      {DEFAULT_CURRENCY}
                      {tx.amount}
                    </Text>
                    <Text style={styles.txPV}>+{tx.pvEarned} PV</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyTransactions}>
              <Text style={styles.emptyText}>No transactions</Text>
            </View>
          )}
        </View>

        {/* Delete Button */}
        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonDelete]}
          onPress={handleDeleteCard}>
          <Text style={styles.actionButtonTextDelete}>Delete Card</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Add Balance Modal */}
      <Modal
        visible={addBalanceModalVisible}
        transparent={true}
        animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Balance</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="Enter amount"
              placeholderTextColor={Colors.textMuted}
              keyboardType="decimal-pad"
              value={addBalanceAmount}
              onChangeText={setAddBalanceAmount}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setAddBalanceModalVisible(false);
                  setAddBalanceAmount('');
                }}
                disabled={processingBalance}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleAddBalance}
                disabled={processingBalance}>
                {processingBalance ? (
                  <ActivityIndicator color={Colors.text} />
                ) : (
                  <Text style={styles.modalButtonText}>Confirm</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Helper Component
const InfoRow: React.FC<{ label: string; value: string; mono?: boolean }> = ({
  label,
  value,
  mono,
}) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={[styles.infoValue, mono && styles.infoValueMono]}>
      {value}
    </Text>
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
  cardVisualSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
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
  infoValueMono: {
    ...TextStyles.monoMedium,
  },
  balanceSection: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addBalanceButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  addBalanceButtonText: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: FontSizes.md,
  },
  pvSection: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pvLabel: {
    ...TextStyles.labelMedium,
  },
  pvValue: {
    ...TextStyles.bodyLarge,
    color: Colors.warning,
  },
  statusSection: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  statusDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    ...TextStyles.labelMedium,
  },
  actionButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  actionButtonDanger: {
    backgroundColor: Colors.warning,
  },
  actionButtonDelete: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.danger,
  },
  actionButtonText: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: FontSizes.md,
  },
  actionButtonTextDelete: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: FontSizes.md,
  },
  transactionList: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  transactionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  txType: {
    ...TextStyles.labelMedium,
    marginBottom: Spacing.xs,
  },
  txDate: {
    ...TextStyles.bodySmall,
  },
  txAmountSection: {
    alignItems: 'flex-end',
  },
  txAmount: {
    ...TextStyles.bodyMedium,
    color: Colors.success,
    marginBottom: Spacing.xs,
  },
  txPV: {
    ...TextStyles.labelSmall,
  },
  emptyTransactions: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...TextStyles.bodySmall,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  modalTitle: {
    ...TextStyles.headingMedium,
    marginBottom: Spacing.lg,
  },
  amountInput: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    color: Colors.text,
    fontSize: FontSizes.md,
    marginBottom: Spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalButtonConfirm: {
    backgroundColor: Colors.primary,
  },
  modalButtonText: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: FontSizes.md,
  },
});

export default CardDetailScreen;
