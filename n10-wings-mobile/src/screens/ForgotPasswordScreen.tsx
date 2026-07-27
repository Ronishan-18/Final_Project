import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator,
  KeyboardAvoidingView, Platform, Alert, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../lib/api';
import { colors } from '../../theme/colors';

export default function ForgotPasswordScreen({ navigation, route }: any) {
  const initialEmail = route?.params?.email || '';

  const [step, setStep] = useState<1 | 2>(1); // 1 = Request OTP, 2 = Reset Password
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Step 1: Send OTP to email
  const handleRequestOtp = async () => {
    if (!email.trim()) {
      Alert.alert('Required', 'Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email: email.trim() });
      if (res.data.success) {
        Alert.alert('OTP Sent 📩', 'Check your email for a 6-digit password reset code.');
        setStep(2);
      }
    } catch (err: any) {
      Alert.alert('Request Failed', err?.response?.data?.message || 'Email not found or could not send code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Reset password
  const handleResetPassword = async () => {
    if (!otp.trim() || !newPassword || !confirmPassword) {
      Alert.alert('Required', 'Please fill in all fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Weak Password', 'New password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', {
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
      });

      if (res.data.success) {
        Alert.alert(
          'Password Reset Successful! 🔐',
          'You can now sign in with your new password.',
          [{ text: 'Sign In', onPress: () => navigation.navigate('Login') }]
        );
      }
    } catch (err: any) {
      Alert.alert('Reset Failed', err?.response?.data?.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
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
          <Text style={styles.title}>RESET PASSWORD</Text>
          <Text style={styles.subtitle}>
            {step === 1
              ? 'Enter your registered email address to receive a password reset code.'
              : 'Enter the 6-digit OTP code sent to your email along with your new password.'}
          </Text>

          {/* Email Field */}
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
                editable={step === 1}
              />
            </View>
          </View>

          {step === 2 && (
            <>
              {/* OTP Field */}
              <View style={styles.field}>
                <Text style={styles.label}>6-DIGIT RESET CODE</Text>
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

              {/* New Password Field */}
              <View style={styles.field}>
                <Text style={styles.label}>NEW PASSWORD</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="lock-closed-outline" size={18} color={colors.muted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { paddingRight: 10 }]}
                    placeholder="Enter new password"
                    placeholderTextColor={colors.muted}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.muted} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm Password Field */}
              <View style={styles.field}>
                <Text style={styles.label}>CONFIRM NEW PASSWORD</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="shield-checkmark-outline" size={18} color={colors.muted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Re-enter new password"
                    placeholderTextColor={colors.muted}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                </View>
              </View>
            </>
          )}

          {/* Action Button */}
          {step === 1 ? (
            <TouchableOpacity
              style={[styles.actionBtn, loading && styles.btnDisabled]}
              onPress={handleRequestOtp}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#0A0A0F" />
              ) : (
                <View style={styles.btnInner}>
                  <Ionicons name="send-outline" size={18} color="#0A0A0F" />
                  <Text style={styles.actionBtnText}>SEND RESET CODE</Text>
                </View>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionBtn, loading && styles.btnDisabled]}
              onPress={handleResetPassword}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#0A0A0F" />
              ) : (
                <View style={styles.btnInner}>
                  <Ionicons name="checkmark-done-circle-outline" size={20} color="#0A0A0F" />
                  <Text style={styles.actionBtnText}>RESET PASSWORD</Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          {/* Return to Login */}
          <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLinkText}>
              Remember your password? <Text style={styles.loginLinkHighlight}>Sign in</Text>
            </Text>
          </TouchableOpacity>
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
  field: { marginBottom: 18 },
  label: { fontSize: 10, fontWeight: '800', color: colors.muted, letterSpacing: 1.5, marginBottom: 8 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)', borderWidth: 1,
    borderColor: colors.border, borderRadius: 10, paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 14, color: colors.text, fontSize: 15, fontWeight: '500' },
  otpInput: { fontSize: 20, letterSpacing: 5, fontWeight: '700' },
  eyeBtn: { padding: 4 },
  actionBtn: {
    backgroundColor: colors.cyan, borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', marginTop: 8, marginBottom: 20,
    shadowColor: colors.cyan, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 10, elevation: 6,
  },
  btnDisabled: { opacity: 0.6 },
  btnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionBtnText: { color: '#0A0A0F', fontSize: 14, fontWeight: '900', letterSpacing: 2 },
  loginLink: { alignItems: 'center', paddingVertical: 4 },
  loginLinkText: { color: colors.muted, fontSize: 14, fontWeight: '500' },
  loginLinkHighlight: { color: colors.cyan, fontWeight: '800' },
});
