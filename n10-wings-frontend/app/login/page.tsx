'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Gamepad2, AlertCircle, Eye, EyeOff, ArrowRight } from 'lucide-react';
import api from '../../lib/api';
import styles from './login.module.scss';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', formData);
      const { token, data } = res.data;
      const role = data?.role;
      const is_organizer = data?.is_organizer;
      const userId = data?.id;

      // Save to localStorage
      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('role', role || 'user');
        localStorage.setItem('is_organizer', is_organizer ? 'true' : 'false');
        localStorage.setItem('userId', String(userId));
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
            suspended?: boolean;
            type?: string;
            user_id?: string;
            email?: string;
          }
        }
      };

      if (error.response?.data?.needsVerification) {
        router.push(`/verify?email=${encodeURIComponent(error.response.data.email || '')}`);
        return;
      }

      if (error.response?.data?.suspended) {
        router.push(`/suspended?user_id=${encodeURIComponent(error.response.data.user_id || '')}&type=${encodeURIComponent(error.response.data.type || '')}`);
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
            <img src="/images/myLogo_.png" alt="N10 Wings Logo" className={styles.login__logo_img} />
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
              type="text"
              className={styles.login__input}
              placeholder="Enter your email"
              autoComplete="off"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>

          <div className={styles.login__group}>
            <label className={styles.login__label}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className={styles.login__input}
                placeholder="Enter your password"
                autoComplete="new-password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className={styles.login__forgot}>
            <Link href="/forgot-password">Forgot password?</Link>
          </div>

          <button
            className={styles.login__btn}
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? 'Logging in...' : (
              <>
                Login
                <ArrowRight size={18} />
              </>
            )}
          </button>

          {/* Divider */}
          <div className={styles.login__divider}>
            <span>OR</span>
          </div>

          {/* Google */}
          <a href={`${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`} className={styles.login__google}>
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