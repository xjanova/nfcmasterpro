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
import { useTheme } from '../context/ThemeContext';
import { createTextStyles, Spacing, Radius, FontSizes, Shadow } from '../utils/theme';
import { DEFAULT_CURRENCY } from '../utils/constants';
import * as paymentService from '../services/paymentService';

const PaymentScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { t } = useLanguage();
  const { colors } = useTheme();
  const ts = createTextStyles(colors);
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
      Alert.alert(t['common.error'], error instanceof Error ? error.message : 'Payment failed');
    } finally { setProcessing(false); }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.bg }]}>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.bg} />

      <ScrollView style={styles.scrollView} contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}>
        <View style={styles.header}>
          <Text style={[ts.headingLarge, { fontWeight: '800', marginBottom: 4 }]}>{t['payment.paymentTest']}</Text>
          <View style={[styles.badge, { backgroundColor: colors.warningGlow }]}>
            <Text style={{ fontSize: FontSizes.xs, fontWeight: '700', color: colors.warning }}>{t['payment.testMode']}</Text>
          </View>
        </View>

        <View style={[styles.inputCard, { backgroundColor: colors.card, borderColor: colors.border }, Shadow.sm]}>
          <View style={[styles.inputGroup, { borderBottomColor: colors.border }]}>
            <Text style={[ts.labelMedium, { fontWeight: '600', marginBottom: Spacing.sm }]}>Card UID</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="Enter card UID"
              placeholderTextColor={colors.textMuted}
              value={cardUID}
              onChangeText={setCardUID}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={[ts.labelMedium, { fontWeight: '600', marginBottom: Spacing.sm }]}>
              Amount ({DEFAULT_CURRENCY})
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.payBtn, { backgroundColor: colors.primary }, processing && { opacity: 0.6 }, Shadow.md]}
          onPress={handlePayment} disabled={processing}>
          {processing ? <ActivityIndicator color="#fff" /> : <Text style={styles.payBtnText}>{t['payment.tapToPay']}</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.historyBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => navigation.navigate('TransactionHistory')}>
          <Text style={[ts.bodyMedium, { color: colors.primary, fontWeight: '600' }]}>{t['payment.transactionHistory']}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { padding: Spacing.xl },
  header: { marginBottom: Spacing.xxl, paddingTop: Spacing.lg },
  badge: { alignSelf: 'flex-start', paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.sm, marginTop: Spacing.sm },
  inputCard: { borderRadius: Radius.lg, borderWidth: 1, overflow: 'hidden', marginBottom: Spacing.xl },
  inputGroup: { padding: Spacing.lg, borderBottomWidth: 1 },
  input: {
    borderRadius: Radius.md, borderWidth: 1,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, fontSize: FontSizes.lg,
  },
  payBtn: {
    borderRadius: Radius.lg, paddingVertical: 16, alignItems: 'center', marginBottom: Spacing.lg,
  },
  payBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSizes.lg },
  historyBtn: {
    borderRadius: Radius.lg, paddingVertical: Spacing.md, borderWidth: 1, alignItems: 'center',
  },
});

export default PaymentScreen;
