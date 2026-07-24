import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator,
  KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../lib/api';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        await AsyncStorage.setItem('token', res.data.token);
        await AsyncStorage.setItem('userId', String(res.data.user.id));
        await AsyncStorage.setItem('role', res.data.user.role);
        await AsyncStorage.setItem('username', res.data.user.username);
        Alert.alert('Success', `Welcome back, ${res.data.user.username}!`);
        // TODO: navigate to Home screen
      }
    } catch (err: any) {
      Alert.alert('Login Failed', err?.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Logo */}
        <View style={styles.logoWrap}>
          <Text style={styles.logoText}>N-10</Text>
          <Text style={styles.logoSub}>WINGS</Text>
          <Text style={styles.logoTag}>E-SPORTS PLATFORM</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.title}>WELCOME BACK</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>

          {/* Email */}
          <View style={styles.field}>
            <Text style={styles.label}>EMAIL ADDRESS</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#8892A4"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Password */}
          <View style={styles.field}>
            <Text style={styles.label}>PASSWORD</Text>
            <View style={styles.passwordWrap}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Enter your password"
                placeholderTextColor="#8892A4"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity style={styles.forgotBtn}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#0A0A0F" />
              : <Text style={styles.loginBtnText}>SIGN IN →</Text>
            }
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Register Link */}
          <TouchableOpacity
            style={styles.registerBtn}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.registerText}>
              Don't have an account? <Text style={styles.registerLink}>Create one →</Text>
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070709',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 40,
  },

  // Logo
  logoWrap: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#00F5FF',
    letterSpacing: 8,
  },
  logoSub: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 12,
    marginTop: -8,
  },
  logoTag: {
    fontSize: 10,
    color: '#8892A4',
    letterSpacing: 4,
    marginTop: 6,
  },

  // Card
  card: {
    backgroundColor: '#0E0E16',
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    borderColor: 'rgba(0,245,255,0.15)',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 3,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#8892A4',
    marginBottom: 28,
    fontWeight: '500',
  },

  // Fields
  field: {
    marginBottom: 18,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8892A4',
    letterSpacing: 2,
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#E8EAF0',
    fontSize: 15,
    fontWeight: '500',
  },
  passwordWrap: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    top: 14,
  },
  eyeText: {
    fontSize: 16,
  },

  // Forgot
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotText: {
    color: '#00F5FF',
    fontSize: 13,
    fontWeight: '600',
  },

  // Login Button
  loginBtn: {
    backgroundColor: '#00F5FF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  loginBtnDisabled: {
    opacity: 0.6,
  },
  loginBtnText: {
    color: '#0A0A0F',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
  },

  // Divider
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
    color: '#8892A4',
    fontSize: 12,
    paddingHorizontal: 12,
    fontWeight: '600',
  },

  // Register
  registerBtn: {
    alignItems: 'center',
  },
  registerText: {
    color: '#8892A4',
    fontSize: 14,
    fontWeight: '500',
  },
  registerLink: {
    color: '#00F5FF',
    fontWeight: '700',
  },
});