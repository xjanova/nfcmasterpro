import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageContext';
import { Colors, Spacing, Radius, FontSizes, TextStyles, Shadow } from '../utils/theme';

type RegistrationStep = 1 | 2 | 3 | 4 | 5;

interface RegistrationState {
  photo: string | null;
  name: string;
  phone: string;
  email: string;
  position: string;
  company: string;
  cardUID: string | null;
  errors: { [key: string]: string };
}

const MemberRegisterScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  const [step, setStep] = useState<RegistrationStep>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [scanningNFC, setScanningNFC] = useState(false);

  const [formData, setFormData] = useState<RegistrationState>({
    photo: null,
    name: '',
    phone: '',
    email: '',
    position: '',
    company: '',
    cardUID: null,
    errors: {},
  });

  // Validate step 2 (Info Form)
  const validateStep2 = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    setFormData(prev => ({ ...prev, errors: newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (step === 2 && !validateStep2()) {
      Alert.alert('Validation Error', t['registration.fillRequiredFields']);
      return;
    }
    if (step < 5) {
      setStep((step + 1) as RegistrationStep);
    }
  };

  const handlePreviousStep = () => {
    if (step > 1) {
      setStep((step - 1) as RegistrationStep);
    }
  };

  const handleTakePhoto = () => {
    // Placeholder - would use react-native-image-picker in real implementation
    Alert.alert(
      'Camera',
      'Photo capture would open here. Using placeholder image.',
      [
        {
          text: 'OK',
          onPress: () => {
            // Set a placeholder photo (base64 or URI)
            setFormData(prev => ({
              ...prev,
              photo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzMzMzMzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjI0IiBmaWxsPSIjY2NjIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7ticjti7HsgrA8L3RleHQ+PC9zdmc+',
            }));
          },
        },
      ]
    );
  };

  const handleChooseFromGallery = () => {
    // Placeholder - would use react-native-image-picker
    Alert.alert(
      'Gallery',
      'Gallery picker would open here. Using placeholder image.',
      [
        {
          text: 'OK',
          onPress: () => {
            setFormData(prev => ({
              ...prev,
              photo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzMzMzMzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjI0IiBmaWxsPSIjY2NjIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7ticjti7HsgrA8L3RleHQ+PC9zdmc+',
            }));
          },
        },
      ]
    );
  };

  const handleScanNFC = () => {
    setScanningNFC(true);
    // Simulate NFC scan
    setTimeout(() => {
      setFormData(prev => ({
        ...prev,
        cardUID: 'A3:B2:C1:D0:E5:F6',
      }));
      setScanningNFC(false);
      Alert.alert('Success', 'NFC card scanned: A3:B2:C1:D0:E5:F6');
    }, 2000);
  };

  const handleSkipNFC = () => {
    setFormData(prev => ({
      ...prev,
      cardUID: null,
    }));
    handleNextStep();
  };

  const handleConfirmAndRegister = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      Alert.alert('Success', t['registration.successMessage']);
      handleNextStep();
    } catch (error) {
      Alert.alert('Error', 'Failed to register member');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewMember = () => {
    Alert.alert('View Member', 'Member details would be displayed here');
  };

  const handleRegisterAnother = () => {
    setStep(1);
    setFormData({
      photo: null,
      name: '',
      phone: '',
      email: '',
      position: '',
      company: '',
      cardUID: null,
      errors: {},
    });
  };

  const handleDone = () => {
    // Would navigate back or to dashboard
    Alert.alert('Done', 'Returning to previous screen');
  };

  // Step Indicator Component
  const StepIndicator = () => (
    <View style={styles.stepIndicatorContainer}>
      <View style={styles.stepsWrapper}>
        {[1, 2, 3, 4, 5].map((stepNum) => (
          <React.Fragment key={stepNum}>
            <View
              style={[
                styles.stepDot,
                step >= stepNum && styles.stepDotActive,
              ]}
            >
              <Text
                style={[
                  styles.stepDotText,
                  step >= stepNum && styles.stepDotTextActive,
                ]}
              >
                {stepNum}
              </Text>
            </View>
            {stepNum < 5 && (
              <View
                style={[
                  styles.stepConnector,
                  step > stepNum && styles.stepConnectorActive,
                ]}
              />
            )}
          </React.Fragment>
        ))}
      </View>
      <Text style={styles.stepLabel}>
        {step === 1 && t['registration.step1Photo']}
        {step === 2 && t['registration.step2Info']}
        {step === 3 && t['registration.step3ScanCard']}
        {step === 4 && t['registration.step4Confirm']}
        {step === 5 && t['registration.step5Complete']}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StepIndicator />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Spacing.xxl }}
      >
        {/* STEP 1: PHOTO */}
        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>{t['registration.takePhoto']}</Text>

            <View style={styles.photoPlaceholder}>
              {formData.photo ? (
                <Image
                  source={{ uri: formData.photo }}
                  style={styles.photoImage}
                />
              ) : (
                <Text style={styles.photoCameraIcon}>📷</Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleTakePhoto}
            >
              <Text style={styles.primaryButtonText}>
                {t['registration.takePhoto']}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, { marginTop: Spacing.md }]}
              onPress={handleChooseFromGallery}
            >
              <Text style={styles.secondaryButtonText}>
                {t['registration.chooseFromGallery']}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 2: INFO FORM */}
        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>{t['registration.step2Info']}</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t['members.name']} *</Text>
              <TextInput
                style={[
                  styles.input,
                  formData.errors.name && styles.inputError,
                ]}
                placeholder="John Doe"
                placeholderTextColor={Colors.textMuted}
                value={formData.name}
                onChangeText={(text) =>
                  setFormData(prev => ({ ...prev, name: text }))
                }
              />
              {formData.errors.name && (
                <Text style={styles.errorText}>{formData.errors.name}</Text>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t['members.phone']}</Text>
              <TextInput
                style={styles.input}
                placeholder="0812345678"
                placeholderTextColor={Colors.textMuted}
                keyboardType="phone-pad"
                value={formData.phone}
                onChangeText={(text) =>
                  setFormData(prev => ({ ...prev, phone: text }))
                }
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t['members.email']}</Text>
              <TextInput
                style={styles.input}
                placeholder="john@example.com"
                placeholderTextColor={Colors.textMuted}
                keyboardType="email-address"
                value={formData.email}
                onChangeText={(text) =>
                  setFormData(prev => ({ ...prev, email: text }))
                }
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t['members.position']}</Text>
              <TextInput
                style={styles.input}
                placeholder="Senior Manager"
                placeholderTextColor={Colors.textMuted}
                value={formData.position}
                onChangeText={(text) =>
                  setFormData(prev => ({ ...prev, position: text }))
                }
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t['members.company']}</Text>
              <TextInput
                style={styles.input}
                placeholder="Tech Company Inc."
                placeholderTextColor={Colors.textMuted}
                value={formData.company}
                onChangeText={(text) =>
                  setFormData(prev => ({ ...prev, company: text }))
                }
              />
            </View>
          </View>
        )}

        {/* STEP 3: SCAN NFC CARD */}
        {step === 3 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>{t['registration.step3ScanCard']}</Text>

            <View style={styles.nfcPlaceholder}>
              <Text style={styles.nfcIcon}>📡</Text>
              <Text style={styles.nfcText}>
                {scanningNFC
                  ? t['nfc.scanning']
                  : t['registration.scanCardInstruction']}
              </Text>
            </View>

            {formData.cardUID && (
              <View style={styles.cardUIDDisplay}>
                <Text style={styles.cardUIDLabel}>{t['cards.cardUID']}</Text>
                <Text style={styles.cardUIDValue}>{formData.cardUID}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.primaryButton,
                scanningNFC && styles.buttonDisabled,
              ]}
              onPress={handleScanNFC}
              disabled={scanningNFC}
            >
              {scanningNFC ? (
                <ActivityIndicator color={Colors.text} />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {t['nfc.tapCard']}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, { marginTop: Spacing.md }]}
              onPress={handleSkipNFC}
            >
              <Text style={styles.secondaryButtonText}>
                {t['common.skip']}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 4: CONFIRM */}
        {step === 4 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>{t['registration.confirmDetails']}</Text>

            <View style={styles.reviewCard}>
              {formData.photo && (
                <Image
                  source={{ uri: formData.photo }}
                  style={styles.reviewPhoto}
                />
              )}

              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>{t['members.name']}</Text>
                <Text style={styles.reviewValue}>{formData.name}</Text>
              </View>

              {formData.phone && (
                <View style={styles.reviewItem}>
                  <Text style={styles.reviewLabel}>{t['members.phone']}</Text>
                  <Text style={styles.reviewValue}>{formData.phone}</Text>
                </View>
              )}

              {formData.email && (
                <View style={styles.reviewItem}>
                  <Text style={styles.reviewLabel}>{t['members.email']}</Text>
                  <Text style={styles.reviewValue}>{formData.email}</Text>
                </View>
              )}

              {formData.position && (
                <View style={styles.reviewItem}>
                  <Text style={styles.reviewLabel}>{t['members.position']}</Text>
                  <Text style={styles.reviewValue}>{formData.position}</Text>
                </View>
              )}

              {formData.company && (
                <View style={styles.reviewItem}>
                  <Text style={styles.reviewLabel}>{t['members.company']}</Text>
                  <Text style={styles.reviewValue}>{formData.company}</Text>
                </View>
              )}

              {formData.cardUID && (
                <View style={styles.reviewItem}>
                  <Text style={styles.reviewLabel}>{t['cards.cardUID']}</Text>
                  <Text style={styles.reviewValue}>{formData.cardUID}</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                isLoading && styles.buttonDisabled,
              ]}
              onPress={handleConfirmAndRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.text} />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {t['common.confirm']}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 5: COMPLETE */}
        {step === 5 && (
          <View style={styles.stepContent}>
            <View style={styles.successContainer}>
              <Text style={styles.successIcon}>✅</Text>
              <Text style={styles.successTitle}>
                {t['registration.registrationComplete']}
              </Text>
              <Text style={styles.successMessage}>
                {t['registration.successMessage']}
              </Text>
            </View>

            <View style={styles.digitalBusinessCardPreview}>
              <Text style={styles.businessCardTitle}>
                {t['members.digitalBusinessCard']}
              </Text>
              <View style={styles.businessCardPlaceholder}>
                <Text style={styles.businessCardName}>{formData.name}</Text>
                {formData.position && (
                  <Text style={styles.businessCardPosition}>
                    {formData.position}
                  </Text>
                )}
                {formData.company && (
                  <Text style={styles.businessCardCompany}>
                    {formData.company}
                  </Text>
                )}
              </View>
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleViewMember}
            >
              <Text style={styles.primaryButtonText}>
                {t['members.memberDetail']}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, { marginTop: Spacing.md }]}
              onPress={handleRegisterAnother}
            >
              <Text style={styles.secondaryButtonText}>
                {t['members.addMember']}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.outlineButton, { marginTop: Spacing.md }]}
              onPress={handleDone}
            >
              <Text style={styles.outlineButtonText}>{t['common.close']}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Navigation Buttons (Bottom) */}
      {step < 5 && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.navButton,
              step === 1 && styles.navButtonDisabled,
            ]}
            onPress={handlePreviousStep}
            disabled={step === 1}
          >
            <Text
              style={[
                styles.navButtonText,
                step === 1 && styles.navButtonTextDisabled,
              ]}
            >
              {t['common.previous']}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navButton}
            onPress={handleNextStep}
          >
            <Text style={styles.navButtonText}>{t['common.next']}</Text>
          </TouchableOpacity>
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
  stepIndicatorContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  stepsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  stepDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  stepDotActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  stepDotText: {
    ...TextStyles.labelMedium,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  stepDotTextActive: {
    color: Colors.text,
  },
  stepConnector: {
    width: 30,
    height: 2,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.xs,
  },
  stepConnectorActive: {
    backgroundColor: Colors.primary,
  },
  stepLabel: {
    ...TextStyles.labelMedium,
    textAlign: 'center',
    color: Colors.textSecondary,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  stepContent: {
    minHeight: 400,
  },
  stepTitle: {
    ...TextStyles.headingMedium,
    marginBottom: Spacing.xl,
    color: Colors.text,
  },
  // Photo Step Styles
  photoPlaceholder: {
    width: '100%',
    height: 280,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    ...Shadow.md,
  },
  photoImage: {
    width: '100%',
    height: '100%',
    borderRadius: Radius.lg,
  },
  photoCameraIcon: {
    fontSize: 60,
  },
  // Form Styles
  formGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...TextStyles.labelMedium,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.text,
    fontSize: FontSizes.md,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  errorText: {
    ...TextStyles.bodySmall,
    color: Colors.danger,
    marginTop: Spacing.xs,
  },
  // NFC Step Styles
  nfcPlaceholder: {
    width: '100%',
    height: 240,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    borderWidth: 2,
    borderColor: Colors.secondaryGlow,
    ...Shadow.md,
  },
  nfcIcon: {
    fontSize: 80,
    marginBottom: Spacing.md,
  },
  nfcText: {
    ...TextStyles.bodyMedium,
    textAlign: 'center',
    color: Colors.textSecondary,
  },
  cardUIDDisplay: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    borderLeftWidth: 4,
    borderLeftColor: Colors.secondary,
  },
  cardUIDLabel: {
    ...TextStyles.labelSmall,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  cardUIDValue: {
    ...TextStyles.monoMedium,
    color: Colors.secondary,
  },
  // Review Step Styles
  reviewCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.md,
  },
  reviewPhoto: {
    width: '100%',
    height: 180,
    borderRadius: Radius.md,
    marginBottom: Spacing.lg,
  },
  reviewItem: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: Spacing.md,
  },
  reviewLabel: {
    ...TextStyles.labelSmall,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  reviewValue: {
    ...TextStyles.bodyMedium,
    color: Colors.text,
  },
  // Success Step Styles
  successContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
    paddingVertical: Spacing.xl,
  },
  successIcon: {
    fontSize: 80,
    marginBottom: Spacing.lg,
  },
  successTitle: {
    ...TextStyles.headingLarge,
    color: Colors.success,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  successMessage: {
    ...TextStyles.bodyMedium,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  digitalBusinessCardPreview: {
    marginBottom: Spacing.xl,
  },
  businessCardTitle: {
    ...TextStyles.labelLarge,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },
  businessCardPlaceholder: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.md,
  },
  businessCardName: {
    ...TextStyles.headingMedium,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  businessCardPosition: {
    ...TextStyles.bodyMedium,
    color: Colors.secondary,
    marginBottom: Spacing.xs,
  },
  businessCardCompany: {
    ...TextStyles.bodySmall,
    color: Colors.textMuted,
  },
  // Buttons
  primaryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.md,
  },
  primaryButtonText: {
    ...TextStyles.labelLarge,
    color: Colors.text,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    ...TextStyles.labelLarge,
    color: Colors.primary,
    fontWeight: '600',
  },
  outlineButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.textMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outlineButtonText: {
    ...TextStyles.labelLarge,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  navButton: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.sm,
  },
  navButtonDisabled: {
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  navButtonText: {
    ...TextStyles.labelLarge,
    color: Colors.text,
    fontWeight: '600',
  },
  navButtonTextDisabled: {
    color: Colors.textMuted,
  },
});

export default MemberRegisterScreen;
