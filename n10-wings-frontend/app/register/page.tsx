'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { register } from '../../lib/auth';
import styles from './register.module.scss';

function RegisterForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const type = searchParams.get('type') || 'user';

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isSponsor = type === 'sponsor';

  const handleSubmit = async () => {
    setError('');

    if (!formData.username || !formData.email || !formData.password) {
      setError('Please fill all fields!');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match!');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters!');
      return;
    }

    setLoading(true);
    try {
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: isSponsor ? 'sponsor' : 'user',
      });
      router.push(`/verify?email=${encodeURIComponent(formData.email)}`);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Registration failed!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.register}>
      <div className={styles.register__box}>

        {/* Logo */}
        <Link href="/" className={styles.register__logo}>
          🎮 <span>N-10 WINGS</span>
        </Link>

        <h1 className={styles.register__title}>CREATE ACCOUNT</h1>

        {/* Type Badge */}
        <div
          className={styles.register__badge}
          style={{
            borderColor: isSponsor ? '#FF006E' : '#00F5FF',
            color: isSponsor ? '#FF006E' : '#00F5FF'
          }}
        >
          {isSponsor ? '💼 Registering as SPONSOR' : '🎮 Registering as GAMER'}
        </div>

        {/* Switch Type */}
        <p className={styles.register__switch}>
          {isSponsor ? (
            <>
              Want to play?{' '}
              <Link href="/register">Register as Gamer</Link>
            </>
          ) : (
            <>
              Are you a sponsor?{' '}
              <Link href="/register?type=sponsor">Register as Sponsor</Link>
            </>
          )}
        </p>

        {/* Error */}
        {error && (
          <div className={styles.register__error}>❌ {error}</div>
        )}

        {/* Form */}
        <div className={styles.register__form}>
          <div className={styles.register__group}>
            <label className={styles.register__label}>Username</label>
            <input
              type="text"
              className={styles.register__input}
              placeholder="Choose a username"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
            />
          </div>

          <div className={styles.register__group}>
            <label className={styles.register__label}>Email Address</label>
            <input
              type="email"
              className={styles.register__input}
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>

          <div className={styles.register__group}>
            <label className={styles.register__label}>Password</label>
            <input
              type="password"
              className={styles.register__input}
              placeholder="Min 6 characters"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />
          </div>

          <div className={styles.register__group}>
            <label className={styles.register__label}>Confirm Password</label>
            <input
              type="password"
              className={styles.register__input}
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
            />
          </div>

          <button
            className={styles.register__btn}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account →'}
          </button>

          <div className={styles.register__divider}>
            <span>OR</span>
          </div>

          
            <a href="http://localhost:5000/api/auth/google"
            className={styles.register__google}
          >
            <span>🔵</span> Continue with Google
          </a>

          <p className={styles.register__login}>
            Already have an account?{' '}
            <Link href="/login">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}