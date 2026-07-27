import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Image, TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../lib/api';
import { colors } from '../../theme/colors';

const STATUS_COLORS: Record<string, string> = {
  open: colors.cyan,
  ongoing: colors.green,
  completed: colors.gold,
  cancelled: colors.red,
  draft: colors.muted,
};

const GAMES = ['All', 'PUBG', 'Valorant', 'Free Fire', 'Mobile Legends', 'COD Mobile', 'CS2'];

export default function HomeScreen({ navigation }: any) {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedGame, setSelectedGame] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchTournaments();
  }, [selectedGame]);

  const MOCK_TOURNAMENTS = [
    {
      id: 101,
      title: 'PUBG Mobile Masters Sri Lanka 2026',
      game: 'PUBG',
      organizer_name: 'N-10 Wings Official',
      prize_pool: 150000,
      registered_teams: 14,
      max_teams: 16,
      entry_fee: 1000,
      status: 'ongoing',
      start_date: '2026-08-01',
      format: 'Squad TPP (5v5)',
      description: 'The biggest PUBG Mobile showdown of the season! Top 16 squads in Sri Lanka battling for the grand prize pool of 150,000 LKR.'
    },
    {
      id: 102,
      title: 'Valorant Champions Cup - Season 3',
      game: 'Valorant',
      organizer_name: 'Apex Esports Club',
      prize_pool: 250000,
      registered_teams: 8,
      max_teams: 16,
      entry_fee: 0,
      status: 'open',
      start_date: '2026-08-10',
      format: 'Standard 5v5 Bomb Defuse',
      description: 'Competitive 5v5 Valorant Tournament open for all ranks. Double elimination bracket with live cast on YouTube & Twitch.'
    },
    {
      id: 103,
      title: 'Free Fire Clash Squad Showdown',
      game: 'Free Fire',
      organizer_name: 'N-10 Wings Official',
      prize_pool: 75000,
      registered_teams: 16,
      max_teams: 16,
      entry_fee: 500,
      status: 'ongoing',
      start_date: '2026-07-28',
      format: 'Clash Squad 4v4',
      description: 'Fast-paced Free Fire Clash Squad tournament. Best of 7 rounds per match.'
    },
    {
      id: 104,
      title: 'Mobile Legends Bang Bang Invitational',
      game: 'Mobile Legends',
      organizer_name: 'CyberArena LK',
      prize_pool: 100000,
      registered_teams: 6,
      max_teams: 12,
      entry_fee: 0,
      status: 'open',
      start_date: '2026-08-15',
      format: '5v5 Custom Draft Pick',
      description: 'MLBB national open cup. Show off your team synergy and claim the championship trophy.'
    },
    {
      id: 105,
      title: 'Call of Duty Mobile Search & Destroy',
      game: 'COD Mobile',
      organizer_name: 'Vanguard Gaming',
      prize_pool: 50000,
      registered_teams: 10,
      max_teams: 16,
      entry_fee: 250,
      status: 'completed',
      start_date: '2026-07-20',
      format: 'S&D 5v5',
      description: 'CODM intense Search & Destroy tournament concluded with high skill plays.'
    }
  ];

  const fetchTournaments = async (q?: string) => {
    try {
      const params: any = {};
      if (selectedGame !== 'All') params.game = selectedGame;
      const searchQuery = q !== undefined ? q : search;
      if (searchQuery) params.search = searchQuery;
      
      const res = await api.get('/tournaments', { params });
      if (res.data.success && Array.isArray(res.data.tournaments) && res.data.tournaments.length > 0) {
        setTournaments(res.data.tournaments);
      } else {
        // Fallback to sample data filtered locally
        let filtered = MOCK_TOURNAMENTS;
        if (selectedGame !== 'All') {
          filtered = filtered.filter(t => t.game.toLowerCase() === selectedGame.toLowerCase());
        }
        if (searchQuery) {
          filtered = filtered.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));
        }
        setTournaments(filtered);
      }
    } catch (e) {
      console.log('Error fetching tournaments, using sample data:', e);
      let filtered = MOCK_TOURNAMENTS;
      if (selectedGame !== 'All') {
        filtered = filtered.filter(t => t.game.toLowerCase() === selectedGame.toLowerCase());
      }
      const searchQuery = q !== undefined ? q : search;
      if (searchQuery) {
        filtered = filtered.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));
      }
      setTournaments(filtered);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTournaments();
  };

  const renderTournament = ({ item }: any) => {
    const statusColor = STATUS_COLORS[item.status] || colors.cyan;
    const entryFee = Number(item.entry_fee) || 0;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('TournamentDetail', { tournament: item })}
        activeOpacity={0.8}
      >
        {/* Top accent */}
        <View style={[styles.cardAccent, { backgroundColor: statusColor }]} />

        {/* Header */}
        <View style={styles.cardHead}>
          <View style={styles.gameBadge}>
            <Ionicons name="game-controller-outline" size={13} color={colors.cyan} />
            <Text style={styles.gameBadgeText}>{item.game}</Text>
          </View>
          <View style={[styles.statusBadge, { borderColor: statusColor + '55', backgroundColor: statusColor + '18' }]}>
            {item.status === 'ongoing' && <View style={[styles.liveDot, { backgroundColor: statusColor }]} />}
            <Text style={[styles.statusText, { color: statusColor }]}>{(item.status || 'OPEN').toUpperCase()}</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.cardOrganizer}>by {item.organizer_name || item.organizer_username || 'N-10 Wings'}</Text>

        {/* Stats */}
        <View style={styles.cardStats}>
          <View style={styles.stat}>
            <Ionicons name="flash" size={14} color={colors.gold} />
            <Text style={styles.statVal}>LKR {Number(item.prize_pool || 0).toLocaleString()}</Text>
            <Text style={styles.statLabel}>Prize</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Ionicons name="people-outline" size={14} color={colors.cyan} />
            <Text style={styles.statVal}>{item.registered_teams || 0}/{item.max_teams || 16}</Text>
            <Text style={styles.statLabel}>Teams</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Ionicons name="card-outline" size={14} color={entryFee > 0 ? colors.orange : colors.green} />
            <Text style={[styles.statVal, { color: entryFee > 0 ? colors.orange : colors.green }]}>
              {entryFee > 0 ? `LKR ${entryFee}` : 'FREE'}
            </Text>
            <Text style={styles.statLabel}>Entry</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.cardFooter}>
          <View style={styles.cardDate}>
            <Ionicons name="calendar-outline" size={13} color={colors.muted} />
            <Text style={styles.cardDateText}>
              {item.start_date ? new Date(item.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD'}
            </Text>
          </View>
          <View style={styles.viewBtn}>
            <Text style={styles.viewBtnText}>View →</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={require('../../assets/logo.png')} style={styles.headerLogo} resizeMode="contain" />
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>TOURNAMENTS</Text>
            <Text style={styles.headerSub}>Compete & Win Rewards</Text>
          </View>
        </View>

        {/* Profile / Account Icon */}
        <TouchableOpacity
          style={styles.profileBtn}
          onPress={() => navigation.navigate('Profile')}
        >
          <Ionicons name="person-circle-outline" size={28} color={colors.cyan} />
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={16} color={colors.muted} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search tournaments by name..."
          placeholderTextColor={colors.muted}
          value={search}
          onChangeText={v => { setSearch(v); fetchTournaments(v); }}
        />
        {search ? (
          <TouchableOpacity onPress={() => { setSearch(''); fetchTournaments(''); }}>
            <Ionicons name="close-circle" size={16} color={colors.muted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Game Filter Pills */}
      <FlatList
        data={GAMES}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
        keyExtractor={item => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterPill, selectedGame === item && styles.filterPillActive]}
            onPress={() => setSelectedGame(item)}
          >
            <Text style={[styles.filterText, selectedGame === item && styles.filterTextActive]}>{item}</Text>
          </TouchableOpacity>
        )}
      />

      {/* Tournament List */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.cyan} size="large" />
          <Text style={styles.loadingText}>Loading Tournaments...</Text>
        </View>
      ) : (
        <FlatList
          data={tournaments}
          keyExtractor={item => String(item.id)}
          renderItem={renderTournament}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.cyan} colors={[colors.cyan]} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="trophy-outline" size={48} color={colors.muted} />
              <Text style={styles.emptyText}>No tournaments found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 54, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerLogo: { width: 50, height: 35 },
  headerTitleWrap: { justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: colors.text, letterSpacing: 2 },
  headerSub: { fontSize: 11, color: colors.muted, marginTop: 1, fontWeight: '500' },
  profileBtn: {
    padding: 4,
    backgroundColor: 'rgba(79,209,197,0.08)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderCyan,
  },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginTop: 14, marginBottom: 10,
    backgroundColor: 'rgba(0,0,0,0.4)', borderWidth: 1,
    borderColor: colors.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 2,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 14, paddingVertical: 10 },

  filterList: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  filterPill: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 99, borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  filterPillActive: {
    borderColor: colors.cyan,
    backgroundColor: 'rgba(79,209,197,0.12)',
  },
  filterText: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  filterTextActive: { color: colors.cyan },

  list: { paddingHorizontal: 16, paddingBottom: 30, gap: 14 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: colors.muted, fontSize: 13, fontWeight: '500' },

  card: {
    backgroundColor: colors.card, borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: colors.border,
    overflow: 'hidden', position: 'relative',
    shadowColor: colors.cyan, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 4,
  },
  cardAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 3 },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  gameBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(79,209,197,0.08)', borderWidth: 1,
    borderColor: colors.borderCyan, borderRadius: 6,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  gameBadgeText: { color: colors.cyan, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  cardTitle: { fontSize: 17, fontWeight: '900', color: colors.text, letterSpacing: 0.5, marginBottom: 4 },
  cardOrganizer: { fontSize: 12, color: colors.muted, marginBottom: 14, fontWeight: '500' },

  cardStats: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  stat: { flex: 1, alignItems: 'center', gap: 3 },
  statVal: { fontSize: 13, fontWeight: '700', color: colors.text },
  statLabel: { fontSize: 10, color: colors.muted, fontWeight: '600', letterSpacing: 0.5 },
  statDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.08)' },

  cardFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
  },
  cardDate: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardDateText: { fontSize: 12, color: colors.muted, fontWeight: '500' },
  viewBtn: {
    backgroundColor: 'rgba(79,209,197,0.1)', borderWidth: 1,
    borderColor: colors.borderCyan, borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  viewBtnText: { color: colors.cyan, fontSize: 12, fontWeight: '800' },

  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { color: colors.muted, fontSize: 14, fontWeight: '500' },
});