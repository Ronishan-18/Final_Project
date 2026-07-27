import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator,
  KeyboardAvoidingView, Platform, Alert, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../lib/api';
import { colors } from '../../theme/colors';

export default function RegisterScreen({ navigation }: any) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const update = (key: string, value: string) =>
    setFormData(prev => ({ ...prev, [key]: value }));

  const validatePassword = (pass: string) => {
    if (pass.length < 8) return 'Password must be at least 8 characters long.';
    if (!/[A-Z]/.test(pass)) return 'Password must contain at least one uppercase letter (A-Z).';
    if (!/[0-9]/.test(pass)) return 'Password must contain at least one number (0-9).';
    if (!/[^a-zA-Z0-9]/.test(pass)) return 'Password must contain at least one special symbol (e.g. !@#$).';
    return null;
  };

  const handleRegister = async () => {
    const { username, email, password, confirmPassword } = formData;
    
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();

    if (!trimmedUsername || !trimmedEmail || !password || !confirmPassword) {
      Alert.alert('Required Fields', 'Please fill in all fields.');
      return;
    }

    if (!trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }

    const passErr = validatePassword(password);
    if (passErr) {
      Alert.alert('Weak Password', passErr);
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        username: trimmedUsername,
        email: trimmedEmail,
        password,
        role: 'user',
      });

      if (res.data.success) {
        Alert.alert(
          'Account Created! 🎮',
          'A 6-digit verification code has been sent to your email address.',
          [
            {
              text: 'Enter Code',
              onPress: () =>
                navigation.navigate('VerifyEmail', {
                  email: trimmedEmail,
                  pendingToken: res.data.pendingToken,
                }),
            },
          ]
        );
        navigation.navigate('VerifyEmail', {
          email: trimmedEmail,
          pendingToken: res.data.pendingToken,
        });
      }
    } catch (err: any) {
      console.log('Registration Error Object:', err?.response || err);

      let title = 'Registration Failed';
      let message = 'An unexpected error occurred.';

      if (err?.code === 'ECONNABORTED' || err?.message?.includes('timeout') || err?.code === 'ERR_NETWORK') {
        title = 'Server Wake Up';
        message = 'The backend is still waking up. Please wait 20 seconds and tap CREATE ACCOUNT again.';
      } else if (err?.response?.data?.message) {
        message = err.response.data.message;
      } else if (err?.message) {
        message = err.message;
      }

      Alert.alert(title, message);
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

        {/* Form Card */}
        <View style={styles.card}>
          <Text style={styles.title}>CREATE ACCOUNT</Text>
          <Text style={styles.subtitle}>Join the N-10 Wings esports community</Text>

          {/* Role Badge */}
          <View style={styles.roleBadge}>
            <Ionicons name="game-controller-outline" size={14} color={colors.cyan} />
            <Text style={styles.roleBadgeText}>REGISTERING AS GAMER</Text>
          </View>

          {/* Username */}
          <View style={styles.field}>
            <Text style={styles.label}>USERNAME</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="person-outline" size={18} color={colors.muted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Choose a username"
                placeholderTextColor={colors.muted}
                value={formData.username}
                onChangeText={v => update('username', v)}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.field}>
            <Text style={styles.label}>EMAIL ADDRESS</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color={colors.muted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor={colors.muted}
                value={formData.email}
                onChangeText={v => update('email', v)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.field}>
            <Text style={styles.label}>PASSWORD</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.muted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Min 8 chars, 1 uppercase, 1 num, 1 symbol"
                placeholderTextColor={colors.muted}
                value={formData.password}
                onChangeText={v => update('password', v)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.muted}
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.passHint}>e.g. Password@123 (Min 8 chars, uppercase, number & symbol)</Text>
          </View>

          {/* Confirm Password */}
          <View style={styles.field}>
            <Text style={styles.label}>CONFIRM PASSWORD</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="shield-checkmark-outline" size={18} color={colors.muted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Re-enter your password"
                placeholderTextColor={colors.muted}
                value={formData.confirmPassword}
                onChangeText={v => update('confirmPassword', v)}
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowConfirm(!showConfirm)}
              >
                <Ionicons
                  name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.muted}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={[styles.registerBtn, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <View style={styles.btnInner}>
                <ActivityIndicator color="#0A0A0F" style={{ marginRight: 8 }} />
                <Text style={styles.registerBtnText}>CREATING ACCOUNT...</Text>
              </View>
            ) : (
              <View style={styles.btnInner}>
                <Ionicons name="person-add-outline" size={20} color="#0A0A0F" />
                <Text style={styles.registerBtnText}>CREATE ACCOUNT</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Login Link */}
          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginLinkText}>
              Already have an account?{' '}
              <Text style={styles.loginLinkHighlight}>Login here</Text>
            </Text>
          </TouchableOpacity>

          {/* Guest Mode Link */}
          <TouchableOpacity
            style={[styles.loginLink, { marginTop: 12 }]}
            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="compass-outline" size={16} color={colors.cyan} />
              <Text style={[styles.loginLinkText, { color: colors.cyan, fontWeight: '700' }]}>
                Explore App as Guest →
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },
  backText: {
    color: colors.cyan,
    fontSize: 14,
    fontWeight: '700',
  },
  headerLogo: {
    width: 100,
    height: 40,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 26,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.cyan,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: 2,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: colors.muted,
    marginBottom: 20,
    fontWeight: '500',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(79,209,197,0.08)',
    borderWidth: 1,
    borderColor: colors.borderCyan,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  roleBadgeText: {
    color: colors.cyan,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.muted,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    color: colors.text,
    fontSize: 15,
    fontWeight: '500',
  },
  passwordInput: {
    paddingRight: 10,
  },
  eyeBtn: {
    padding: 4,
  },
  passHint: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 4,
    fontStyle: 'italic',
  },
  registerBtn: {
    backgroundColor: colors.cyan,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
    shadowColor: colors.cyan,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  registerBtnText: {
    color: '#0A0A0F',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  dividerText: {
    color: colors.muted,
    fontSize: 12,
    paddingHorizontal: 12,
    fontWeight: '600',
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  loginLinkText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '500',
  },
  loginLinkHighlight: {
    color: colors.cyan,
    fontWeight: '800',
  },
});