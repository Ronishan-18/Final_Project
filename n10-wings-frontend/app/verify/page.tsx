'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { verifyEmail } from '../../lib/auth';
import styles from './verify.module.scss';

function VerifyForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get('email') || '';

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleVerify = async () => {
    setError('');
    if (otp.length !== 6) {
      setError('Please enter the 6-digit OTP!');
      return;
    }

    setLoading(true);
    try {
      const pendingToken = sessionStorage.getItem('pendingToken') || undefined;
      await verifyEmail({ email, otp, pendingToken });
      sessionStorage.removeItem('pendingToken');
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Invalid OTP!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.verify}>
      <div className={styles.verify__box}>
        <Link href="/" className={styles.verify__logo}>
          🎮 <span>N-10 WINGS</span>
        </Link>

        <div className={styles.verify__icon}>📧</div>
        <h1 className={styles.verify__title}>VERIFY EMAIL</h1>
        <p className={styles.verify__sub}>
          We sent a 6-digit OTP to<br />
          <strong style={{ color: '#00F5FF' }}>{email}</strong>
        </p>

        {success ? (
          <div className={styles.verify__success}>
            ✅ Email verified! Redirecting to login...
          </div>
        ) : (
          <>
            {error && <div className={styles.verify__error}>❌ {error}</div>}

            <div className={styles.verify__group}>
              <label className={styles.verify__label}>Enter OTP Code</label>
              <input
                type="text"
                className={styles.verify__input}
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              />
            </div>

            <button
              className={styles.verify__btn}
              onClick={handleVerify}
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Verify Email →'}
            </button>

            <p className={styles.verify__resend}>
              Didn&apos;t receive OTP?{' '}
              <Link href={`/register`}>Resend OTP</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyForm />
    </Suspense>
  );
}