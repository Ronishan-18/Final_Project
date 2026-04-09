'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Trophy, Calendar, Users, DollarSign, AlertCircle } from 'lucide-react';
import { createCreationCheckout } from '@/lib/payments';
import IconTile from '@/components/IconTile';
import styles from './create.module.scss';

const GAMES = ['PUBG', 'Valorant', 'Free Fire', 'Mobile Legends', 'Call of Duty', 'Other'];
const TYPES = ['single elimination', 'double elimination', 'round robin', 'swiss'];
const MAX_TEAMS_OPTIONS = [4, 8, 16, 32, 64, 128];
const CREATION_FEE_LKR = parseInt(process.env.NEXT_PUBLIC_CREATION_FEE || '500');

function CreateTournamentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentCancelled = searchParams.get('payment') === 'cancelled';

  const [form, setForm] = useState({
    title: '',
    game: '',
    description: '',
    rules: '',
    prize_pool: '',
    max_teams: 16,
    entry_fee: '',
    entry_fee_required: false,
    start_date: '',
    end_date: '',
    tournament_type: 'single elimination',
    mode: 'online',
    venue_address: '',
    registration_open_date: '',
    registration_close_date: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm(f => ({
      ...f,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.title.trim() || !form.game) {
      setError('Title and game are required.');
      return;
    }

    setLoading(true);
    try {
      // Redirect to Stripe checkout — tournament is created AFTER payment succeeds via webhook
      const checkoutUrl = await createCreationCheckout({
        ...form,
        prize_pool: parseFloat(form.prize_pool) || 0,
        entry_fee: parseFloat(form.entry_fee) || 0,
      });
      window.location.href = checkoutUrl;
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to start payment. Please try again.');
      setLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <IconTile icon={Trophy} color="#00F5FF" size={22} tileSize={44} radius={10} />
          <div>
            <h1 className={styles.heading}>Create tournament</h1>
            <p className={styles.sub}>A creation fee of <strong>LKR {CREATION_FEE_LKR}</strong> is required to publish your tournament.</p>
          </div>
        </div>

        {paymentCancelled && (
          <div className={styles.cancelBanner}>
            <AlertCircle size={16} />
            Payment was cancelled. Your tournament was not created. No charge was made.
          </div>
        )}

        {error && <div className={styles.errorBanner}><AlertCircle size={16} />{error}</div>}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.grid}>
            <div className={styles.field}>
              <label>Tournament title *</label>
              <input name="title" value={form.title} onChange={handle} placeholder="e.g. Wings Cup Season 1" required />
            </div>
            <div className={styles.field}>
              <label>Game *</label>
              <select name="game" value={form.game} onChange={handle} required>
                <option value="">Select game</option>
                {GAMES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label>Mode</label>
              <select name="mode" value={form.mode} onChange={handle}>
                <option value="online">Online</option>
                <option value="venue">Live Venue</option>
              </select>
            </div>
            {form.mode === 'venue' && (
              <div className={styles.field}>
                <label>Venue address *</label>
                <input name="venue_address" value={form.venue_address} onChange={handle} placeholder="Enter venue location" required />
              </div>
            )}
            <div className={styles.field}>
              <label>Tournament type</label>
              <select name="tournament_type" value={form.tournament_type} onChange={handle}>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label>Max teams</label>
              <select name="max_teams" value={form.max_teams} onChange={handle}>
                {MAX_TEAMS_OPTIONS.map(n => <option key={n} value={n}>{n} teams</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label>Prize pool (LKR)</label>
              <input name="prize_pool" type="number" min="0" step="1" value={form.prize_pool} onChange={handle} placeholder="0" />
            </div>
            <div className={styles.field}>
              <label>Start date</label>
              <input name="start_date" type="datetime-local" value={form.start_date} onChange={handle} />
            </div>
            <div className={styles.field}>
              <label>End date</label>
              <input name="end_date" type="datetime-local" value={form.end_date} onChange={handle} />
            </div>
            <div className={styles.field}>
              <label>Registration start date</label>
              <input name="registration_open_date" type="datetime-local" value={form.registration_open_date} onChange={handle} />
            </div>
            <div className={styles.field}>
              <label>Registration end date</label>
              <input name="registration_close_date" type="datetime-local" value={form.registration_close_date} onChange={handle} />
            </div>
            <div className={styles.field}>
              <label>Entry fee per team (LKR)</label>
              <input name="entry_fee" type="number" min="0" step="1" value={form.entry_fee} onChange={handle} placeholder="0" />
            </div>
          </div>

          <div className={styles.checkboxField}>
            <input type="checkbox" id="entry_fee_required" name="entry_fee_required" checked={form.entry_fee_required} onChange={handle} />
            <label htmlFor="entry_fee_required">Require teams to pay entry fee before registration</label>
          </div>

          <div className={styles.field}>
            <label>Description</label>
            <textarea name="description" value={form.description} onChange={handle} rows={3} placeholder="Describe your tournament..." />
          </div>

          <div className={styles.field}>
            <label>Rules</label>
            <textarea name="rules" value={form.rules} onChange={handle} rows={4} placeholder="List your tournament rules..." />
          </div>

          <div className={styles.feeNotice}>
            <DollarSign size={16} />
            <span>
              Total Payment: <strong>LKR {(CREATION_FEE_LKR + (parseFloat(form.prize_pool) || 0)).toLocaleString()}</strong>
              <br />
              <small style={{ opacity: 0.7 }}>
                (LKR {CREATION_FEE_LKR.toLocaleString()} creation fee + LKR {(parseFloat(form.prize_pool) || 0).toLocaleString()} prize pool escrow)
              </small>
            </span>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Redirecting to payment...' : `Pay LKR ${(CREATION_FEE_LKR + (parseFloat(form.prize_pool) || 0)).toLocaleString()} and Publish`}
          </button>

        </form>
      </div>
    </main>
  );
}

export default function CreateTournamentPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0A0A0F' }}>
        <p style={{ color: '#8892A4' }}>Loading...</p>
      </div>
    }>
      <CreateTournamentContent />
    </Suspense>
  );
}