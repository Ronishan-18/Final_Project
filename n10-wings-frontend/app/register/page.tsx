'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Gamepad2, AlertCircle, Building2, Eye, EyeOff } from 'lucide-react';
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
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isSponsor = type === 'sponsor';

  const evaluatePasswordStrength = (pass: string) => {
    let score = 0;
    if (!pass) return { label: '', color: 'transparent', score: 0 };
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^a-zA-Z0-9]/.test(pass)) score += 1;
    
    if (score < 3 || pass.length < 8) return { label: 'Weak', color: '#FF006E', score }; // pink/red
    if (score === 3) return { label: 'Good', color: '#FBBC05', score }; // yellow
    return { label: 'Perfect', color: '#00F5FF', score }; // cyan
  };

  const strength = evaluatePasswordStrength(formData.password);

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

    if (strength.score < 4) {
      setError('Password must be 8+ characters, include uppercase, number & symbol!');
      return;
    }

    setLoading(true);
    try {
      const result = await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: isSponsor ? 'sponsor' : 'user',
      });
      
      // We expect a pendingToken from backend
      if (result.pendingToken) {
        sessionStorage.setItem('pendingToken', result.pendingToken);
      }
      
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

        <Link href="/" className={styles.register__logo}>
          <div className={styles.register__logo_icon}>
            <img src="/images/myLogo_.png" alt="N10 Wings Logo" className={styles.register__logo_img} />
          </div>
        </Link>

        <h1 className={styles.register__title}>CREATE ACCOUNT</h1>

        <div
          className={styles.register__badge}
          style={{
            borderColor: isSponsor ? '#FF006E' : '#00F5FF',
            color: isSponsor ? '#FF006E' : '#00F5FF'
          }}
        >
          {isSponsor ? <><Building2 size={16} style={{display:'inline', marginBottom:'-2px'}}/> Registering as SPONSOR</> : <><Gamepad2 size={16} style={{display:'inline', marginBottom:'-2px'}}/> Registering as GAMER</>}
        </div>

        <p className={styles.register__switch}>
          {isSponsor ? (
            <>Want to play? <Link href="/register">Register as Gamer</Link></>
          ) : (
            <>Are you a sponsor? <Link href="/register?type=sponsor">Register as Sponsor</Link></>
          )}
        </p>

        {error && (
          <div className={styles.register__error}>
            <AlertCircle size={16} color="#FF006E" /> {error}
          </div>
        )}

        <div className={styles.register__form}>
          <div className={styles.register__group}>
            <label className={styles.register__label}>Username</label>
            <input
              type="text"
              autoComplete="off"
              className={styles.register__input}
              placeholder="Choose a username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          </div>

          <div className={styles.register__group}>
            <label className={styles.register__label}>Email Address</label>
            <input
              type="text"
              autoComplete="off"
              className={styles.register__input}
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className={styles.register__group}>
            <label className={styles.register__label}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className={styles.register__input}
                placeholder="Min 8 characters, 1 cap, 1 num, 1 symbol"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center' }}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {formData.password && (
              <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: 'bold', color: strength.color, display: 'flex', justifyContent: 'space-between' }}>
                <span>Strength: {strength.label}</span>
                <span style={{opacity: 0.6}}>{strength.score}/4</span>
              </div>
            )}
          </div>

          <div className={styles.register__group}>
            <label className={styles.register__label}>Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className={styles.register__input}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center' }}>
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
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