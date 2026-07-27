import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../lib/api';
import { colors } from '../../theme/colors';

export default function ProfileScreen({ navigation, onLogout }: any) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data.success && res.data.user) {
        setUser(res.data.user);
      } else {
        const username = await AsyncStorage.getItem('username');
        const role = await AsyncStorage.getItem('role');
        setUser({ username, role: role || 'user' });
      }
    } catch {
      const username = await AsyncStorage.getItem('username');
      const role = await AsyncStorage.getItem('role');
      setUser({ username, role: role || 'user' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out 🚪',
      'Are you sure you want to sign out of N-10 Wings?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.multiRemove(['token', 'userId', 'role', 'username']);
            if (onLogout) {
              onLogout();
            } else {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.cyan} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PROFILE</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.cyan} size="large" />
          </View>
        ) : (
          <>
            {/* User Card */}
            <View style={styles.userCard}>
              <View style={styles.avatarWrap}>
                <Ionicons name="person" size={40} color={colors.cyan} />
              </View>
              <Text style={styles.username}>{user?.username || 'Gamer'}</Text>
              <Text style={styles.email}>{user?.email || 'N-10 Wings Member'}</Text>

              <View style={styles.roleBadge}>
                <Ionicons name="shield-checkmark" size={14} color={colors.cyan} />
                <Text style={styles.roleText}>{(user?.role || 'GAMER').toUpperCase()}</Text>
              </View>
            </View>

            {/* Info Section */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>ACCOUNT DETAILS</Text>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Username</Text>
                <Text style={styles.infoVal}>{user?.username || '-'}</Text>
              </View>
              <View style={styles.infoDivider} />

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoVal}>{user?.email || '-'}</Text>
              </View>
              <View style={styles.infoDivider} />

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Account Status</Text>
                <Text style={[styles.infoVal, { color: colors.green }]}>Active ✓</Text>
              </View>
            </View>

            {/* Logout Button */}
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
              <Ionicons name="log-out-outline" size={20} color={colors.red} />
              <Text style={styles.logoutBtnText}>SIGN OUT</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 54, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 4 },
  backText: { color: colors.cyan, fontSize: 14, fontWeight: '700' },
  headerTitle: { fontSize: 16, fontWeight: '900', color: colors.text, letterSpacing: 2 },
  scroll: { padding: 20, gap: 20 },
  loadingWrap: { paddingVertical: 60, alignItems: 'center' },

  userCard: {
    backgroundColor: colors.card, borderRadius: 20, padding: 26,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center',
    shadowColor: colors.cyan, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 16, elevation: 8,
  },
  avatarWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(79,209,197,0.1)', borderWidth: 2,
    borderColor: colors.borderCyan, alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  username: { fontSize: 22, fontWeight: '900', color: colors.text, marginBottom: 4 },
  email: { fontSize: 13, color: colors.muted, marginBottom: 16, fontWeight: '500' },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(79,209,197,0.08)', borderWidth: 1,
    borderColor: colors.borderCyan, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  roleText: { color: colors.cyan, fontSize: 12, fontWeight: '800', letterSpacing: 1 },

  sectionCard: {
    backgroundColor: colors.card, borderRadius: 18, padding: 20,
    borderWidth: 1, borderColor: colors.border,
  },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: colors.muted, letterSpacing: 1.5, marginBottom: 16 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  infoLabel: { fontSize: 13, color: colors.muted, fontWeight: '600' },
  infoVal: { fontSize: 14, color: colors.text, fontWeight: '700' },
  infoDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: 'rgba(255,77,77,0.1)', borderWidth: 1,
    borderColor: 'rgba(255,77,77,0.3)', borderRadius: 12, paddingVertical: 16,
    marginTop: 10,
  },
  logoutBtnText: { color: colors.red, fontSize: 14, fontWeight: '900', letterSpacing: 2 },
});
