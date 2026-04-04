'use client';
import { useState } from 'react';
import { CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import { createEntryCheckout } from '@/lib/payments';
import api from '@/lib/api';
import styles from './PayToRegisterButton.module.scss';

interface Props {
  tournamentId: number;
  entryFee: number;
  entryFeeRequired: boolean;
  alreadyRegistered: boolean;
  isTeamLeader: boolean;
}

export default function PayToRegisterButton({
  tournamentId,
  entryFee,
  entryFeeRequired,
  alreadyRegistered,
  isTeamLeader,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (alreadyRegistered) {
    return (
      <div className={styles.registered}>
        <CheckCircle size={16} />
        Your team is registered
      </div>
    );
  }

  if (!isTeamLeader) {
    return <p className={styles.hint}>Only team leaders can register for tournaments.</p>;
  }

  const handleRegister = async () => {
    setError('');
    setLoading(true);
    try {
      if (entryFeeRequired && entryFee > 0) {
        // Redirect to Stripe
        const checkoutUrl = await createEntryCheckout(tournamentId);
        window.location.href = checkoutUrl;
      } else {
        // Free tournament — register directly
        await api.post(`/teams/register/${tournamentId}`);
        window.location.reload();
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Registration failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      {error && (
        <div className={styles.error}>
          <AlertCircle size={14} />
          {error}
        </div>
      )}
      <button className={styles.btn} onClick={handleRegister} disabled={loading}>
        {loading ? (
          'Please wait...'
        ) : entryFeeRequired && entryFee > 0 ? (
          <>
            <CreditCard size={16} />
            Pay ${(entryFee).toFixed(2)} and register
          </>
        ) : (
          'Register team'
        )}
      </button>
      {entryFeeRequired && entryFee > 0 && (
        <p className={styles.secureNote}>Secured by Stripe. You will not be charged until you complete checkout.</p>
      )}
    </div>
  );
}