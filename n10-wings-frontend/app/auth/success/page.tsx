'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function AuthSuccess() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // After Google OAuth success, fetch and save user
useEffect(() => {
  const token = new URLSearchParams(window.location.search).get('token');
  if (token) {
    localStorage.setItem('token', token);
    // Fetch user data and save
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        localStorage.setItem('user', JSON.stringify(data.user));
        const role = data.user.role || 'user';
        localStorage.setItem('role', role);
        localStorage.setItem('is_organizer', data.user.is_organizer ? 'true' : 'false');
        
        if (role === 'admin') router.push('/dashboard/admin');
        else if (role === 'sponsor') router.push('/dashboard/sponsor');
        else if (data.user.is_organizer) router.push('/dashboard/organizer');
        else router.push('/dashboard');
      } else {
        router.push('/login');
      }
    });
  } else {
    router.push('/login');
  }
}, [router]);

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
