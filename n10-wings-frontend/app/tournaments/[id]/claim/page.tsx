'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { 
  Trophy, CheckCircle2, AlertCircle, Building, 
  DollarSign, ChevronLeft, RefreshCw, Send, ArrowLeft
} from 'lucide-react';
import IconTile from '@/components/IconTile';
import api from '@/lib/api';
import Link from 'next/link';
import styles from './claim.module.scss';

export default function ClaimPrizePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const tournamentId = params?.id as string;
  const teamId = searchParams?.get('team_id') || '';

  const [form, setForm] = useState({ bank_details: '', amount: '' });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tournamentTitle, setTournamentTitle] = useState('');

  useEffect(() => {
    if (tournamentId) {
      fetchTournamentDetails();
    }
  }, [tournamentId]);

  const fetchTournamentDetails = async () => {
    try {
      const res = await api.get(`/tournaments/${tournamentId}`);
      if (res.data.success) {
        setTournamentTitle(res.data.tournament.title);
        // Auto-fill the amount from prize pool
        setForm(f => ({ ...f, amount: res.data.tournament.prize_pool || '' }));
      }
    } catch (err) {
      console.error("Failed to fetch tournament:", err);
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!teamId) {
      setError('Team ID is missing. Please return to the tournament page.');
      return;
    }

    if (!form.bank_details.trim() || !form.amount) {
      setError('Please fill out all required fields.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/prize-claims', {
        tournament_id: tournamentId,
        team_id: teamId,
        bank_details: form.bank_details,
        amount: parseFloat(form.amount.toString())
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to submit claim request. Please contact support.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <RefreshCw className={styles.spin} color="#00F5FF" size={32} />
      </div>
    );
  }

  if (success) {
    return (
      <main className={styles.success}>
        <CheckCircle2 className={styles.success_icon} size={84} />
        <h1>Claim Submitted!</h1>
        <p>
          Your prize claim for **{tournamentTitle || 'the tournament'}** has been securely sent. 
          Admins will verify the details and process the payout. You'll receive a notification once it's paid.
        </p>
        <Link href={`/tournaments/${tournamentId}`} className={styles.home_btn}>
          <ArrowLeft size={16} /> Back to Tournament
        </Link>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <Link href={`/tournaments/${tournamentId}`} className={styles.back}>
        <ChevronLeft size={16} /> Back to Tournament
      </Link>

      <div className={styles.header}>
        <IconTile icon={Trophy} color="#FFD700" size={24} tileSize={54} radius={14} />
        <div className={styles.header_info}>
          <h1>Claim Your Prize</h1>
          <p>Submit your payout information for <strong>{tournamentTitle}</strong></p>
        </div>
      </div>

      <div className={styles.card}>
        {error && (
          <div className={styles.error}>
            <AlertCircle size={20} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className={styles.form_group}>
            <label>
              <Building size={14} /> Payout Method & Bank Details
            </label>
            <textarea 
              className={styles.textarea}
              value={form.bank_details}
              onChange={(e) => setForm(f => ({ ...f, bank_details: e.target.value }))}
              placeholder="e.g. Account Holder Name, Bank Name, Account Number, Swift/IFSC Code..."
              required
            />
          </div>

          <div className={styles.form_group}>
            <label>
              <DollarSign size={14} /> Prize Amount (LKR)
            </label>
            <input 
              className={styles.input}
              type="number"
              value={form.amount}
              readOnly
              style={{ opacity: 0.8, cursor: 'not-allowed', background: 'rgba(255,255,255,0.03)' }}
            />
            <p style={{ fontSize: '11px', color: '#555', marginTop: '6px' }}>* Amount is locked to the tournament prize pool.</p>
          </div>

          <button 
            type="submit" 
            className={styles.submit_btn}
            disabled={loading}
          >
            {loading ? (
              <RefreshCw className={styles.spin} size={18} />
            ) : (
              <><Send size={18} /> Submit Claim Request</>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
