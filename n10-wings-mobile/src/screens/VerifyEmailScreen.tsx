import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator,
  KeyboardAvoidingView, Platform, Alert, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../lib/api';
import { colors } from '../../theme/colors';

export default function VerifyEmailScreen({ navigation, route }: any) {
  const emailParam = route?.params?.email || '';
  const pendingToken = route?.params?.pendingToken || '';

  const [email, setEmail] = useState(emailParam);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async () => {
    if (!email.trim() || !otp.trim()) {
      Alert.alert('Error', 'Please enter your email and verification code.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/verify-email', {
        email: email.trim(),
        otp: otp.trim(),
        pendingToken,
      });

      if (res.data.success) {
        Alert.alert(
          'Email Verified! 🎉',
          'Your account is active. You can now log in.',
          [{ text: 'Go to Login', onPress: () => navigation.navigate('Login') }]
        );
      }
    } catch (err: any) {
      Alert.alert('Verification Failed', err?.response?.data?.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }

    setResending(true);
    try {
      const res = await api.post('/auth/resend-verification', { email: email.trim() });
      if (res.data.success) {
        Alert.alert('Code Sent 📩', 'A new verification code has been sent to your email.');
      }
    } catch (err: any) {
      Alert.alert('Resend Failed', err?.response?.data?.message || 'Could not resend verification code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={colors.cyan} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <View style={{ width: 60 }} />
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.title}>VERIFY EMAIL</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to <Text style={styles.emailText}>{email || 'your email'}</Text>
          </Text>

          {/* Email field if empty */}
          {!emailParam ? (
            <View style={styles.field}>
              <Text style={styles.label}>EMAIL ADDRESS</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={18} color={colors.muted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor={colors.muted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>
          ) : null}

          {/* OTP Code input */}
          <View style={styles.field}>
            <Text style={styles.label}>6-DIGIT VERIFICATION CODE</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="key-outline" size={18} color={colors.muted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.otpInput]}
                placeholder="123456"
                placeholderTextColor={colors.muted}
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>
          </View>

          {/* Verify Button */}
          <TouchableOpacity
            style={[styles.verifyBtn, loading && styles.btnDisabled]}
            onPress={handleVerify}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#0A0A0F" />
            ) : (
              <View style={styles.btnInner}>
                <Ionicons name="checkmark-circle-outline" size={20} color="#0A0A0F" />
                <Text style={styles.verifyBtnText}>VERIFY & CONTINUE</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Resend Link */}
          <View style={styles.resendWrap}>
            <Text style={styles.resendText}>Didn't receive the code? </Text>
            <TouchableOpacity onPress={handleResend} disabled={resending}>
              <Text style={styles.resendHighlight}>
                {resending ? 'Sending...' : 'Resend Code'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 54, paddingBottom: 40 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 4 },
  backText: { color: colors.cyan, fontSize: 14, fontWeight: '700' },
  headerLogo: { width: 100, height: 40 },
  card: {
    backgroundColor: colors.card, borderRadius: 20, padding: 26,
    borderWidth: 1, borderColor: colors.border,
    shadowColor: colors.cyan, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 16, elevation: 8,
  },
  title: { fontSize: 22, fontWeight: '900', color: colors.text, letterSpacing: 2, marginBottom: 6 },
  subtitle: { fontSize: 13, color: colors.muted, marginBottom: 24, fontWeight: '500', lineHeight: 20 },
  emailText: { color: colors.cyan, fontWeight: '700' },
  field: { marginBottom: 18 },
  label: { fontSize: 10, fontWeight: '800', color: colors.muted, letterSpacing: 1.5, marginBottom: 8 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)', borderWidth: 1,
    borderColor: colors.border, borderRadius: 10, paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 14, color: colors.text, fontSize: 15, fontWeight: '500' },
  otpInput: { fontSize: 20, letterSpacing: 6, fontWeight: '700' },
  verifyBtn: {
    backgroundColor: colors.cyan, borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', marginTop: 8, marginBottom: 20,
    shadowColor: colors.cyan, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 10, elevation: 6,
  },
  btnDisabled: { opacity: 0.6 },
  btnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  verifyBtnText: { color: '#0A0A0F', fontSize: 14, fontWeight: '900', letterSpacing: 2 },
  resendWrap: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  resendText: { color: colors.muted, fontSize: 13, fontWeight: '500' },
  resendHighlight: { color: colors.cyan, fontSize: 13, fontWeight: '800' },
});
