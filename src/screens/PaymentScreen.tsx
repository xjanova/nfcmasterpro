import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useLanguage } from '../utils/i18n';
import { Colors, Spacing, Radius, FontSizes, TextStyles } from '../utils/theme';
import { DEFAULT_CURRENCY } from '../utils/constants';
import * as paymentService from '../services/paymentService';

const PaymentScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { t } = useLanguage();
  const [cardUID, setCardUID] = useState('');
  const [amount, setAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  const handlePayment = async () => {
    if (!cardUID || !amount) {
      Alert.alert(t['common.error'], 'Please fill in all fields');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert(t['common.error'], 'Invalid amount');
      return;
    }

    setProcessing(true);
    try {
      const transaction = await paymentService.processPayment(cardUID, parsedAmount);
      Alert.alert(t['common.success'], 'Payment processed successfully');
      navigation.navigate('PaymentResult', { transaction });
      setCardUID('');
      setAmount('');
    } catch (error) {
      Alert.alert(
        t['common.error'],
        error instanceof Error ? error.message : 'Payment failed'
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>{t['payment.paymentTest']}</Text>
          <Text style={styles.subtitle}>{t['payment.testMode']}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Card UID</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter card UID"
            placeholderTextColor={Colors.textMuted}
            value={cardUID}
            onChangeText={setCardUID}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Amount ({DEFAULT_CURRENCY})</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter amount"
            placeholderTextColor={Colors.textMuted}
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />
        </View>

        <TouchableOpacity
          style={[styles.paymentButton, processing && styles.paymentButtonDisabled]}
          onPress={handlePayment}
          disabled={processing}>
          {processing ? (
            <ActivityIndicator color={Colors.text} />
          ) : (
            <Text style={styles.paymentButtonText}>{t['payment.tapToPay']}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => navigation.navigate('TransactionHistory')}>
          <Text style={styles.historyButtonText}>{t['payment.transactionHistory']}</Text>
        </TouchableOpacity>
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
    padding: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.xxl,
    paddingTop: Spacing.lg,
  },
  title: {
    ...TextStyles.headingLarge,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...TextStyles.bodySmall,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  label: {
    ...TextStyles.labelMedium,
    marginBottom: Spacing.md,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    color: Colors.text,
    fontSize: FontSizes.md,
  },
  paymentButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    marginVertical: Spacing.xl,
    alignItems: 'center',
  },
  paymentButtonDisabled: {
    opacity: 0.6,
  },
  paymentButtonText: {
    color: Colors.text,
    fontWeight: '700',
    fontSize: FontSizes.lg,
  },
  historyButton: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  historyButtonText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: FontSizes.md,
  },
});

export default PaymentScreen;
