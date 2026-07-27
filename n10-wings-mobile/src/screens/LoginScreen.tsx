import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView,
  Platform, Alert, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../lib/api';
import { colors } from '../../theme/colors';

export default function LoginScreen({ navigation, onLogin }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Details', 'Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email: email.trim(), password });
      if (res.data.success) {
        const userData = res.data.data || res.data.user || {};
        await AsyncStorage.setItem('token', res.data.token);
        if (userData.id) await AsyncStorage.setItem('userId', String(userData.id));
        if (userData.role) await AsyncStorage.setItem('role', userData.role);
        if (userData.username) await AsyncStorage.setItem('username', userData.username);
        
        if (onLogin) {
          onLogin();
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Home' }],
          });
        }
      }
    } catch (err: any) {
      const errorData = err?.response?.data;
      if (errorData?.needsVerification) {
        Alert.alert(
          'Verification Required 📧',
          errorData.message || 'Please verify your email before logging in.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Verify Code',
              onPress: () => navigation.navigate('VerifyEmail', { email: errorData.email || email.trim() }),
            },
          ]
        );
      } else {
        Alert.alert('Login Failed', errorData?.message || 'Invalid email or password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Logo Header */}
        <View style={styles.logoWrap}>
          <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <View style={styles.badge}>
            <Ionicons name="shield-checkmark-outline" size={12} color={colors.cyan} />
            <Text style={styles.badgeText}>OFFICIAL APP</Text>
          </View>
        </View>

        {/* Login Card */}
        <View style={styles.card}>
          <Text style={styles.title}>WELCOME BACK</Text>
          <Text style={styles.subtitle}>Sign in to access your esports profile</Text>

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
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Password Field */}
          <View style={styles.field}>
            <Text style={styles.label}>PASSWORD</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.muted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { paddingRight: 10 }]}
                placeholder="Enter your password"
                placeholderTextColor={colors.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.muted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={() => navigation.navigate('ForgotPassword', { email })}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#0A0A0F" />
            ) : (
              <View style={styles.btnInner}>
                <Ionicons name="log-in-outline" size={20} color="#0A0A0F" />
                <Text style={styles.loginBtnText}>SIGN IN</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Register Link */}
          <TouchableOpacity style={styles.linkBtn} onPress={() => navigation.navigate('Register')}>
            <Text style={styles.linkText}>
              Don't have an account? <Text style={styles.linkHighlight}>Create one →</Text>
            </Text>
          </TouchableOpacity>

          {/* Guest Mode Link */}
          <TouchableOpacity
            style={[styles.linkBtn, { marginTop: 12 }]}
            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="compass-outline" size={16} color={colors.cyan} />
              <Text style={[styles.linkText, { color: colors.cyan, fontWeight: '700' }]}>
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
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 },
  logoWrap: { alignItems: 'center', marginBottom: 28 },
  logo: { width: 190, height: 75, marginBottom: 8 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(79,209,197,0.08)', borderWidth: 1,
    borderColor: colors.borderCyan, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 4,
  },
  badgeText: { color: colors.cyan, fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  card: {
    backgroundColor: colors.card, borderRadius: 20, padding: 26,
    borderWidth: 1, borderColor: colors.border,
    shadowColor: colors.cyan, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 16, elevation: 8,
  },
  title: { fontSize: 22, fontWeight: '900', color: colors.text, letterSpacing: 2, marginBottom: 6 },
  subtitle: { fontSize: 13, color: colors.muted, marginBottom: 24, fontWeight: '500' },
  field: { marginBottom: 18 },
  label: { fontSize: 10, fontWeight: '800', color: colors.muted, letterSpacing: 1.5, marginBottom: 8 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)', borderWidth: 1,
    borderColor: colors.border, borderRadius: 10, paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 14, color: colors.text, fontSize: 15, fontWeight: '500' },
  eyeBtn: { padding: 4 },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 22 },
  forgotText: { color: colors.cyan, fontSize: 13, fontWeight: '700' },
  loginBtn: {
    backgroundColor: colors.cyan, borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', marginBottom: 20,
    shadowColor: colors.cyan, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 10, elevation: 6,
  },
  btnDisabled: { opacity: 0.6 },
  btnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  loginBtnText: { color: '#0A0A0F', fontSize: 14, fontWeight: '900', letterSpacing: 2 },
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  dividerText: { color: colors.muted, fontSize: 12, paddingHorizontal: 12, fontWeight: '600' },
  linkBtn: { alignItems: 'center', paddingVertical: 4 },
  linkText: { color: colors.muted, fontSize: 14, fontWeight: '500' },
  linkHighlight: { color: colors.cyan, fontWeight: '800' },
});