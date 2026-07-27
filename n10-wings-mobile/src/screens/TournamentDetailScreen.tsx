import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../lib/api';
import { colors } from '../../theme/colors';

export default function TournamentDetailScreen({ navigation, route }: any) {
  const tournament = route?.params?.tournament || {};
  const [registering, setRegistering] = useState(false);

  const entryFee = Number(tournament.entry_fee) || 0;
  const prizePool = Number(tournament.prize_pool) || 0;
  const statusColor =
    tournament.status === 'ongoing' ? colors.green :
    tournament.status === 'completed' ? colors.gold :
    colors.cyan;

  const handleJoinTournament = async () => {
    Alert.alert(
      'Register Team 🎮',
      `Would you like to register for "${tournament.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Join',
          onPress: async () => {
            setRegistering(true);
            try {
              const res = await api.post(`/tournaments/${tournament.id}/register`, {});
              if (res.data.success) {
                Alert.alert('Success! 🎉', 'Your team has been registered for this tournament.');
              }
            } catch (err: any) {
              Alert.alert(
                'Registration Status',
                err?.response?.data?.message || 'Please ensure you are logged in and have created a team in your profile.'
              );
            } finally {
              setRegistering(false);
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
        <Text style={styles.headerTitle} numberOfLines={1}>TOURNAMENT DETAILS</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Banner Card */}
        <View style={styles.bannerCard}>
          <View style={styles.topRow}>
            <View style={styles.gameBadge}>
              <Ionicons name="game-controller-outline" size={14} color={colors.cyan} />
              <Text style={styles.gameText}>{tournament.game || 'ESPORTS'}</Text>
            </View>
            <View style={[styles.statusBadge, { borderColor: statusColor + '55', backgroundColor: statusColor + '18' }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>{(tournament.status || 'OPEN').toUpperCase()}</Text>
            </View>
          </View>

          <Text style={styles.title}>{tournament.title}</Text>
          <Text style={styles.organizer}>Organized by {tournament.organizer_name || tournament.organizer_username || 'N-10 Wings'}</Text>

          <View style={styles.prizeBox}>
            <Ionicons name="trophy" size={24} color={colors.gold} />
            <View>
              <Text style={styles.prizeLabel}>TOTAL PRIZE POOL</Text>
              <Text style={styles.prizeVal}>LKR {prizePool.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* Info Grid */}
        <View style={styles.grid}>
          <View style={styles.gridCard}>
            <Ionicons name="people-outline" size={20} color={colors.cyan} />
            <Text style={styles.gridVal}>{tournament.registered_teams || 0} / {tournament.max_teams || 16}</Text>
            <Text style={styles.gridLabel}>Teams Joined</Text>
          </View>

          <View style={styles.gridCard}>
            <Ionicons name="card-outline" size={20} color={entryFee > 0 ? colors.orange : colors.green} />
            <Text style={[styles.gridVal, { color: entryFee > 0 ? colors.orange : colors.green }]}>
              {entryFee > 0 ? `LKR ${entryFee}` : 'FREE'}
            </Text>
            <Text style={styles.gridLabel}>Entry Fee</Text>
          </View>

          <View style={styles.gridCard}>
            <Ionicons name="calendar-outline" size={20} color={colors.purple} />
            <Text style={styles.gridVal}>
              {tournament.start_date ? new Date(tournament.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD'}
            </Text>
            <Text style={styles.gridLabel}>Start Date</Text>
          </View>

          <View style={styles.gridCard}>
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.gold} />
            <Text style={styles.gridVal}>{tournament.format || tournament.mode || '5v5 Squad'}</Text>
            <Text style={styles.gridLabel}>Format</Text>
          </View>
        </View>

        {/* Description & Rules Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>ABOUT & RULES</Text>
          <Text style={styles.sectionBody}>
            {tournament.description || 'Welcome to this N-10 Wings tournament! Join with your team to compete for the prize pool and leaderboard points. Ensure all player IDs are updated before match start.'}
          </Text>
        </View>
      </ScrollView>

      {/* Footer Action Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.joinBtn, registering && styles.btnDisabled]}
          onPress={handleJoinTournament}
          disabled={registering}
          activeOpacity={0.8}
        >
          {registering ? (
            <ActivityIndicator color="#0A0A0F" />
          ) : (
            <View style={styles.btnInner}>
              <Ionicons name="flash-outline" size={20} color="#0A0A0F" />
              <Text style={styles.joinBtnText}>REGISTER TEAM</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
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
  headerTitle: { fontSize: 15, fontWeight: '900', color: colors.text, letterSpacing: 1.5 },
  scroll: { padding: 20, paddingBottom: 100 },

  bannerCard: {
    backgroundColor: colors.card, borderRadius: 20, padding: 22,
    borderWidth: 1, borderColor: colors.border, marginBottom: 18,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  gameBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(79,209,197,0.08)', borderWidth: 1,
    borderColor: colors.borderCyan, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
  },
  gameText: { color: colors.cyan, fontSize: 12, fontWeight: '800' },
  statusBadge: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  title: { fontSize: 22, fontWeight: '900', color: colors.text, marginBottom: 4 },
  organizer: { fontSize: 13, color: colors.muted, marginBottom: 18, fontWeight: '500' },

  prizeBox: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: 'rgba(255,215,0,0.06)', borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)', borderRadius: 14, padding: 16,
  },
  prizeLabel: { fontSize: 10, color: colors.muted, fontWeight: '800', letterSpacing: 1 },
  prizeVal: { fontSize: 20, fontWeight: '900', color: colors.gold, marginTop: 2 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 18 },
  gridCard: {
    width: '48%', backgroundColor: colors.card, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', gap: 6,
  },
  gridVal: { fontSize: 15, fontWeight: '800', color: colors.text },
  gridLabel: { fontSize: 11, color: colors.muted, fontWeight: '600' },

  sectionCard: {
    backgroundColor: colors.card, borderRadius: 18, padding: 20,
    borderWidth: 1, borderColor: colors.border,
  },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: colors.muted, letterSpacing: 1.5, marginBottom: 10 },
  sectionBody: { fontSize: 14, color: colors.subtext, lineHeight: 22 },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border,
    padding: 16, paddingBottom: Platform.OS === 'ios' ? 30 : 16,
  },
  joinBtn: {
    backgroundColor: colors.cyan, borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', shadowColor: colors.cyan, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 10, elevation: 6,
  },
  btnDisabled: { opacity: 0.6 },
  btnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  joinBtnText: { color: '#0A0A0F', fontSize: 14, fontWeight: '900', letterSpacing: 2 },
});
