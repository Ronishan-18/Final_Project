'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Trophy, CheckCircle2, AlertCircle, Building, DollarSign, ChevronLeft } from 'lucide-react';
import IconTile from '@/components/IconTile';
import api from '@/lib/api';
import Link from 'next/link';

export default function ClaimPrizePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const tournamentId = params?.id as string;
  const teamId = searchParams?.get('team_id') || '';

  const [form, setForm] = useState({ bank_details: '', amount: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!teamId) {
      setError('Team ID is missing.');
      return;
    }

    if (!form.bank_details.trim() || !form.amount.trim()) {
      setError('Please fill out all fields.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/prize-claims', {
        tournament_id: tournamentId,
        team_id: teamId,
        bank_details: form.bank_details,
        amount: parseFloat(form.amount)
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to submit claim.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main style={{ padding: '4rem 1.5rem', textAlign: 'center', minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <CheckCircle2 color="#00FF88" size={64} style={{ marginBottom: '1rem' }} />
        <h1 style={{ fontSize: '1.5rem', color: 'white', marginBottom: '0.5rem' }}>Claim Submitted!</h1>
        <p style={{ color: '#8892A4', marginBottom: '2rem', maxWidth: '400px' }}>
          Your prize claim has been securely sent to the administration. You will be notified once the payout is processed.
        </p>
        <Link href={`/tournaments/${tournamentId}`} style={{ color: '#00F5FF', textDecoration: 'none', background: 'rgba(0,245,255,0.1)', padding: '0.75rem 1.5rem', borderRadius: '8px' }}>
          Back to Tournament
        </Link>
      </main>
    );
  }

  return (
    <main style={{ padding: '2rem 1.5rem', maxWidth: '600px', margin: '0 auto' }}>
      <Link href={`/tournaments/${tournamentId}`} style={{ color: '#8892A4', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', textDecoration: 'none', fontSize: '0.9rem' }}>
        <ChevronLeft size={16} /> Back
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <IconTile icon={Trophy} color="#FFD700" size={24} tileSize={48} radius={12} />
        <div>
          <h1 style={{ fontSize: '1.5rem', color: 'white', margin: 0 }}>Claim Prize</h1>
          <p style={{ color: '#8892A4', margin: 0, fontSize: '0.9rem' }}>Securely submit your payout details to admins.</p>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(255,68,68,0.1)', color: '#FF4444', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ background: '#11131A', padding: '1.5rem', borderRadius: '12px', border: '1px solid #1C1F26' }}>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#8892A4', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
            <Building size={14} /> Bank / Payout Details
          </label>
          <textarea 
            value={form.bank_details}
            onChange={(e) => setForm(f => ({ ...f, bank_details: e.target.value }))}
            placeholder="Account Name, Bank Name, Account Number, Routing/Sort Code..."
            required
            rows={4}
            style={{ width: '100%', background: '#0A0B0F', border: '1px solid #1C1F26', color: 'white', padding: '0.75rem', borderRadius: '8px', resize: 'vertical' }}
          />
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#8892A4', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
            <DollarSign size={14} /> Prize Amount Owed (USD)
          </label>
          <input 
            type="number"
            value={form.amount}
            step="0.01"
            min="1"
            onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))}
            placeholder="0.00"
            required
            style={{ width: '100%', background: '#0A0B0F', border: '1px solid #1C1F26', color: 'white', padding: '0.75rem', borderRadius: '8px' }}
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{ width: '100%', background: 'linear-gradient(135deg, #00F5FF, #8B00FF)', color: 'white', padding: '0.875rem', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          {loading ? 'Submitting...' : 'Submit Claim Request'} <CheckCircle2 size={16} />
        </button>
      </form>
    </main>
  );
}
