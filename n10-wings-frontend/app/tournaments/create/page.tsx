'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trophy, ArrowLeft, Plus, Gamepad2, Calendar, Users, Zap, FileText, ChevronRight } from 'lucide-react';
import IconTile from '../../../components/IconTile';
import api from '../../../lib/api';
import styles from './create.module.scss';

const GAMES = ['PUBG', 'Valorant', 'Free Fire', 'Mobile Legends', 'COD Mobile', 'CS2', 'Dota 2', 'Other'];
const TOURNAMENT_TYPES = [
  { value: 'single elimination', label: 'Single Elimination' },
  { value: 'double elimination', label: 'Double Elimination' },
  { value: 'round robin', label: 'Round Robin' },
  { value: 'swiss', label: 'Swiss' },
];

export default function CreateTournamentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '', game: '', description: '', rules: '',
    prize_pool: '', max_teams: '16', entry_fee: '0',
    start_date: '', end_date: '', tournament_type: 'single elimination',
  });

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    setError('');
    if (!form.title.trim()) { setError('Tournament title is required!'); return; }
    if (!form.game) { setError('Please select a game!'); return; }
    setLoading(true);
    try {
      const res = await api.post('/tournaments', {
        ...form,
        prize_pool: parseFloat(form.prize_pool) || 0,
        max_teams: parseInt(form.max_teams) || 16,
        entry_fee: parseFloat(form.entry_fee) || 0,
      });
      if (res.data.success) {
        router.push(`/tournaments/${res.data.tournament_id}/manage`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create tournament!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.inner}>

        {/* Header */}
        <div className={styles.header}>
          <Link href="/dashboard/organizer" className={styles.back}>
            <ArrowLeft size={15} strokeWidth={2} /> Back
          </Link>
          <div>
            <h1 className={styles.title}>Create Tournament</h1>
            <p className={styles.sub}>Fill in the details — bracket auto-generates via Challonge</p>
          </div>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {/* Basic Info */}
        <div className={styles.card}>
          <h2 className={styles.card__title}>
            <IconTile icon={Trophy} color="#00F5FF" size={13} tileSize={24} radius={6} />
            Basic Info
          </h2>
          <div className={styles.grid}>
            <div className={styles.group}>
              <label className={styles.label}>Tournament Title *</label>
              <input className={styles.input} placeholder="e.g. N-10 Wings Pro League Season 1" value={form.title} onChange={e => set('title', e.target.value)} />
            </div>
            <div className={styles.group}>
              <label className={styles.label}>Game *</label>
              <select className={styles.input} value={form.game} onChange={e => set('game', e.target.value)}>
                <option value="">Select a game</option>
                {GAMES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className={`${styles.group} ${styles['group--full']}`}>
              <label className={styles.label}>Description</label>
              <textarea className={`${styles.input} ${styles.textarea}`} placeholder="Describe your tournament..." value={form.description} onChange={e => set('description', e.target.value)} rows={3} />
            </div>
          </div>
        </div>

        {/* Format & Size */}
        <div className={styles.card}>
          <h2 className={styles.card__title}>
            <IconTile icon={Users} color="#8B00FF" size={13} tileSize={24} radius={6} />
            Format & Size
          </h2>
          <div className={styles.grid}>
            <div className={styles.group}>
              <label className={styles.label}>Tournament Type</label>
              <select className={styles.input} value={form.tournament_type} onChange={e => set('tournament_type', e.target.value)}>
                {TOURNAMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className={styles.group}>
              <label className={styles.label}>Max Teams</label>
              <select className={styles.input} value={form.max_teams} onChange={e => set('max_teams', e.target.value)}>
                {[4, 8, 16, 32, 64, 128].map(n => <option key={n} value={n}>{n} teams</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Prize & Fees */}
        <div className={styles.card}>
          <h2 className={styles.card__title}>
            <IconTile icon={Zap} color="#FFD700" size={13} tileSize={24} radius={6} />
            Prize & Entry Fee
          </h2>
          <div className={styles.grid}>
            <div className={styles.group}>
              <label className={styles.label}>Prize Pool (LKR)</label>
              <input className={styles.input} type="number" placeholder="e.g. 50000" value={form.prize_pool} onChange={e => set('prize_pool', e.target.value)} min="0" />
            </div>
            <div className={styles.group}>
              <label className={styles.label}>Entry Fee (LKR)</label>
              <input className={styles.input} type="number" placeholder="0 for free" value={form.entry_fee} onChange={e => set('entry_fee', e.target.value)} min="0" />
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className={styles.card}>
          <h2 className={styles.card__title}>
            <IconTile icon={Calendar} color="#FF006E" size={13} tileSize={24} radius={6} />
            Dates
          </h2>
          <div className={styles.grid}>
            <div className={styles.group}>
              <label className={styles.label}>Start Date</label>
              <input className={styles.input} type="datetime-local" value={form.start_date} onChange={e => set('start_date', e.target.value)} />
            </div>
            <div className={styles.group}>
              <label className={styles.label}>End Date</label>
              <input className={styles.input} type="datetime-local" value={form.end_date} onChange={e => set('end_date', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Rules */}
        <div className={styles.card}>
          <h2 className={styles.card__title}>
            <IconTile icon={FileText} color="#00FF88" size={13} tileSize={24} radius={6} />
            Rules & Regulations
          </h2>
          <div className={styles.group}>
            <textarea className={`${styles.input} ${styles.textarea}`} placeholder="Enter tournament rules, code of conduct, prize distribution..." value={form.rules} onChange={e => set('rules', e.target.value)} rows={5} />
          </div>
        </div>

        {/* Challonge notice */}
        <div className={styles.notice}>
          <Zap size={15} color="#FFD700" strokeWidth={2} />
          <span>A bracket will be auto-created on <strong>Challonge</strong> when you submit. Make sure <code>CHALLONGE_API_KEY</code> is set in your <code>.env</code></span>
        </div>

        <button className={styles.submit} onClick={handleSubmit} disabled={loading}>
          {loading ? 'Creating...' : <><Plus size={16} strokeWidth={2.5} /> Create Tournament</>}
        </button>
      </div>
    </div>
  );
}