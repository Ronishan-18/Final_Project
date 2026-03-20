'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function AuthSuccess() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const token = searchParams.get('token');
    const role = searchParams.get('role');

    if (token) {
      // Save token to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('role', role || 'gamer');

      // Redirect based on role
      if (role === 'admin') router.push('/dashboard/admin');
      else if (role === 'sponsor') router.push('/dashboard/sponsor');
      else router.push('/dashboard');
      
    } else {
      router.push('/login');
    }
  }, [searchParams, router]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0A0A0F',
      color: '#00F5FF',
      fontFamily: 'Orbitron, sans-serif',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      <div style={{
        width: 40, height: 40,
        border: '3px solid rgba(0,245,255,0.2)',
        borderTopColor: '#00F5FF',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <p>Logging you in...</p>
    </div>
  );
}

export default function AuthSuccessPage() {
  return (
    <Suspense>
      <AuthSuccess />
    </Suspense>
  );
}
