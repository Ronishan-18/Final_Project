'use client';
import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function ChatPage() {
  const { friendId } = useParams();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/friends?chat=${friendId}`);
  }, [friendId, router]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#06060c', color: 'rgba(255,255,255,0.3)', fontFamily: 'Rajdhani, sans-serif' }}>
      Redirecting to secure messaging dashboard...
    </div>
  );
}