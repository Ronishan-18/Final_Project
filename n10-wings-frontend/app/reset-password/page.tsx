'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { KeyRound, AlertCircle, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import { resetPassword } from '../../lib/auth';
import styles from './reset.module.scss';

function ResetForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get('email') || '';

  const [formData, setFormData] = useState({
    otp: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleReset = async () => {
    setError('');
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match!');
      return;
    }
    setLoading(true);
    try {
      await resetPassword({
        email,
        otp: formData.otp,
        newPassword: formData.newPassword,
      });
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Reset failed!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.reset}>
      <div className={styles.reset__box}>
        <Link href="/" className={styles.reset__logo}>
          <img src="/images/myLogo_.png" alt="N10 Wings Logo" className={styles.verify__logo_img} />
        </Link>
        <div className={styles.reset__icon}>
          <KeyRound size={32} strokeWidth={1.5} />
        </div>
        <h1 className={styles.reset__title}>RESET PASSWORD</h1>
        <p className={styles.reset__sub}>
          Enter the OTP sent to{' '}
          <strong style={{ color: '#00F5FF' }}>{email}</strong>
        </p>

        {success ? (
          <div className={styles.reset__success}>
            <CheckCircle2 size={48} className={styles.verify__success_icon} />
            <p>Password reset! Redirecting to login...</p>
          </div>
        ) : (
          <>
            {error && (
              <div className={styles.reset__error}>
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <div className={styles.reset__group}>
              <label className={styles.reset__label}>OTP Code</label>
              <input
                type="text"
                className={styles.reset__input}
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                value={formData.otp}
                onChange={(e) => setFormData({ ...formData, otp: e.target.value.replace(/\D/g, '') })}
              />
            </div>

            <div className={styles.reset__group}>
              <label className={styles.reset__label}>New Password</label>
              <input
                type="password"
                className={styles.reset__input}
                placeholder="Enter new password"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              />
            </div>

            <div className={styles.reset__group}>
              <label className={styles.reset__label}>Confirm Password</label>
              <input
                type="password"
                className={styles.reset__input}
                placeholder="Confirm new password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              />
            </div>

            <button
              className={styles.reset__btn}
              onClick={handleReset}
              disabled={loading}
            >
              {loading ? 'Resetting...' : (
                <>
                  Reset Password
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </>
        )}

        <p className={styles.reset__back}>
          <Link href="/login">
            <ArrowLeft size={14} />
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}