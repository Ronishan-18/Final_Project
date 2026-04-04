'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldAlert, AlertTriangle, Send } from 'lucide-react';
import api from '@/lib/api';
import styles from './suspended.module.scss';

function SuspendedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user_id = searchParams.get('user_id');
  const type = searchParams.get('type') || 'account';

  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!note.trim()) {
      setError('Please provide a note for the admin.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/public/appeals', {
        user_id,
        type,
        note
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit appeal. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (!user_id) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <AlertTriangle size={64} className={styles.icon} />
          <h1>Access Restricted</h1>
          <p>Invalid access payload. Please return to the login page.</p>
          <button className={styles.backBtn} onClick={() => router.push('/login')}>
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <ShieldAlert size={64} className={styles.icon} />
        <h1>{type === 'organizer' ? 'Organizer Role Suspended' : 'Account Suspended'}</h1>
        
        {success ? (
           <div className={styles.successBlock}>
             <h2>Appeal Submitted!</h2>
             <p>Your request has been sent to the administration. You will be notified of their decision soon.</p>
             <button className={styles.backBtn} onClick={() => router.push('/login')}>
                Return Home
             </button>
           </div>
        ) : (
          <>
            <p className={styles.desc}>
              Your {type === 'organizer' ? 'organizer privileges have' : 'account has'} been suspended by an administrator. If you believe this was an error, you can submit an appeal using the form below.
            </p>

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.formGroup}>
              <label>Reason for Appeal / Note to Admin</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Explain why your suspension should be lifted..."
                rows={5}
                disabled={loading}
              />
            </div>

            <button 
              className={styles.submitBtn} 
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Submitting...' : (
                <>
                  <Send size={18} /> Submit Appeal
                </>
              )}
            </button>
            <button className={styles.textBtn} onClick={() => router.push('/login')}>
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function SuspendedPage() {
  return (
    <Suspense fallback={<div className={styles.loading}>Loading...</div>}>
      <SuspendedContent />
    </Suspense>
  );
}
