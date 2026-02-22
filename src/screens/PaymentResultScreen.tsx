import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useLanguage } from '../utils/i18n';
import { Colors, Spacing, Radius, FontSizes, TextStyles } from '../utils/theme';
import { DEFAULT_CURRENCY } from '../utils/constants';

const PaymentResultScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { t } = useLanguage();
  const transaction = route.params?.transaction;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      <View style={styles.content}>
        <View style={styles.icon}>
          <Text style={styles.iconText}>✓</Text>
        </View>

        <Text style={styles.title}>{t['payment.paymentSuccess']}</Text>

        <View style={styles.details}>
          <DetailRow
            label="Amount"
            value={`${DEFAULT_CURRENCY}${transaction?.amount || 0}`}
          />
          <DetailRow label="PV Earned" value={`${transaction?.pvEarned || 0} PV`} />
          {transaction?.memberName && (
            <DetailRow label="Member" value={transaction.memberName} />
          )}
          <DetailRow
            label="Date"
            value={new Date(transaction?.timestamp).toLocaleDateString()}
          />
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Dashboard')}>
          <Text style={styles.buttonText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const DetailRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  icon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  iconText: {
    fontSize: 48,
    color: Colors.text,
    fontWeight: 'bold',
  },
  title: {
    ...TextStyles.headingLarge,
    marginBottom: Spacing.xl,
  },
  details: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.xl,
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  detailLabel: {
    ...TextStyles.labelMedium,
  },
  detailValue: {
    ...TextStyles.bodyMedium,
    color: Colors.primary,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  buttonText: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: FontSizes.md,
  },
});

export default PaymentResultScreen;
