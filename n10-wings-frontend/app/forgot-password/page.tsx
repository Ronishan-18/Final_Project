'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { KeyRound, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { forgotPassword } from '../../lib/auth';
import styles from './forgot.module.scss';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (!email) { setError('Please enter your email!'); return; }
    setLoading(true);
    try {
      await forgotPassword(email);
      router.push(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to send OTP!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.forgot}>
      <div className={styles.forgot__box}>
        <Link href="/" className={styles.forgot__logo}>
          <img src="/images/myLogo_.png" alt="N10 Wings Logo" className={styles.forgot__logo_img} />
        </Link>
        <div className={styles.forgot__icon}>
          <KeyRound size={32} strokeWidth={1.5} />
        </div>
        <h1 className={styles.forgot__title}>FORGOT PASSWORD</h1>
        <p className={styles.forgot__sub}>
          Enter your email and we&apos;ll send you an OTP to reset your password.
        </p>

        {error && (
          <div className={styles.forgot__error}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div className={styles.forgot__group}>
          <label className={styles.forgot__label}>Email Address</label>
          <input
            type="email"
            className={styles.forgot__input}
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <button className={styles.forgot__btn} onClick={handleSubmit} disabled={loading}>
          {loading ? 'Sending OTP...' : (
            <>
              Send OTP
              <ArrowRight size={16} />
            </>
          )}
        </button>

        <p className={styles.forgot__back}>
          <Link href="/login">
            <ArrowLeft size={14} />
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}