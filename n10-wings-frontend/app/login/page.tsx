'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../lib/api';
import styles from './login.module.scss';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', formData);
      const { token, data } = res.data;
      const role = data?.role;
      const is_organizer = data?.is_organizer;





      

      // Save to localStorage
      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('role', role || 'user');
        localStorage.setItem('is_organizer', is_organizer ? 'true' : 'false');
      }

      // Redirect based on role
    if (role === 'admin') router.push('/dashboard/admin');
    else if (role === 'sponsor') router.push('/dashboard/sponsor');
    else if (is_organizer) router.push('/dashboard/organizer');
    else router.push('/dashboard');

    } catch (err: unknown) {
      const error = err as {
        response?: {
          data?: {
            message?: string;
            needsVerification?: boolean;
            email?: string;
          }
        }
      };

      // If needs verification → redirect to verify page
      if (error.response?.data?.needsVerification) {
        router.push(
          `/verify?email=${encodeURIComponent(error.response.data.email || '')}`
        );
        return;
      }

      setError(error.response?.data?.message || 'Login failed!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.login}>
      <div className={styles.login__box}>

        {/* Logo */}
        <Link href="/" className={styles.login__logo}>
          🎮 <span>N-10 WINGS</span>
        </Link>

        <h1 className={styles.login__title}>WELCOME BACK</h1>
        <p className={styles.login__sub}>Login to your account</p>

        {/* Error */}
        {error && (
          <div className={styles.login__error}>❌ {error}</div>
        )}

        {/* Form */}
        <div className={styles.login__form}>

          <div className={styles.login__group}>
            <label className={styles.login__label}>Email Address</label>
            <input
              type="email"
              className={styles.login__input}
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>

          <div className={styles.login__group}>
            <label className={styles.login__label}>Password</label>
            <input
              type="password"
              className={styles.login__input}
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>

          <div className={styles.login__forgot}>
            <Link href="/forgot-password">Forgot password?</Link>
          </div>

          <button
            className={styles.login__btn}
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login →'}
          </button>

          {/* Divider */}
          <div className={styles.login__divider}>
            <span>OR</span>
          </div>

          {/* Google */}
          
           <a href="http://localhost:5000/api/auth/google"
            className={styles.login__google}
          >
            <span>🔵</span> Continue with Google
          </a>

          <p className={styles.login__register}>
            Don&apos;t have an account?{' '}
            <Link href="/register">Register here</Link>
          </p>
        </div>
      </div> 
    </div>
  );
}