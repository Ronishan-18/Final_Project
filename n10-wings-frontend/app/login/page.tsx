'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Gamepad2, AlertCircle, LogIn } from 'lucide-react';
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
          <div className={styles.login__logo_icon}>
            <Gamepad2 size={20} color="#00F5FF" strokeWidth={1.5} />
          </div>
          <div className={styles.login__logo_text}>
            <span>N-10</span>
            <span>WINGS</span>
          </div>
        </Link>

        <h1 className={styles.login__title}>WELCOME BACK</h1>
        <p className={styles.login__sub}>Login to your account</p>

        {/* Error */}
        {error && (
          <div className={styles.login__error}>
            <AlertCircle size={16} color="#FF006E" />
            {error}
          </div>
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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
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