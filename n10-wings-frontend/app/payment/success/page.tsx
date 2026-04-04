'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { verifyPayment } from '@/lib/payments';
import styles from './payment-success.module.scss';

type Status = 'loading' | 'success' | 'failed' | 'pending';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session_id');
  const type = searchParams.get('type');

  const [status, setStatus] = useState<Status>('loading');
  const [paymentData, setPaymentData] = useState<any>(null);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (!sessionId) {
      setStatus('failed');
      return;
    }

    let mounted = true;
    let timeout: ReturnType<typeof setTimeout>;

    const check = async () => {
      try {
        const data = await verifyPayment(sessionId);
        if (!mounted) return;

        if (data.payment.status === 'succeeded') {
          setPaymentData(data.payment);
          setStatus('success');
        } else if (data.payment.status === 'failed') {
          setStatus('failed');
        } else {
          // Still pending — webhook may be delayed, poll a few times
          if (attempts < 5) {
            setAttempts(a => a + 1);
            timeout = setTimeout(check, 2000);
          } else {
            setStatus('pending');
          }
        }
      } catch {
        if (mounted) setStatus('failed');
      }
    };

    check();
    return () => { mounted = false; clearTimeout(timeout); };
  }, [sessionId, attempts]);

  const getRedirectPath = () => {
    if (type === 'creation') return '/dashboard/organizer';
    if (paymentData?.tournament_id) return `/tournaments/${paymentData.tournament_id}`;
    return '/tournaments';
  };

  const getTitle = () => {
    if (type === 'creation') return 'Tournament created!';
    return 'Registration successful!';
  };

  const getMessage = () => {
    if (type === 'creation') return 'Your tournament has been created and is now open for registrations.';
    return 'Your team has been registered. Waiting for organizer approval.';
  };

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        {status === 'loading' && (
          <>
            <div className={styles.iconWrap}>
              <Loader size={48} className={styles.spinner} />
            </div>
            <h1 className={styles.title}>Verifying payment...</h1>
            <p className={styles.msg}>Please wait, do not close this page.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className={`${styles.iconWrap} ${styles.success}`}>
              <CheckCircle size={48} />
            </div>
            <h1 className={styles.title}>{getTitle()}</h1>
            <p className={styles.msg}>{getMessage()}</p>
            {paymentData?.amount && (
              <p className={styles.amount}>
                Paid: ${(paymentData.amount / 100).toFixed(2)}
              </p>
            )}
            <button className={styles.btn} onClick={() => router.push(getRedirectPath())}>
              Continue
            </button>
          </>
        )}

        {status === 'pending' && (
          <>
            <div className={`${styles.iconWrap} ${styles.warn}`}>
              <Loader size={48} />
            </div>
            <h1 className={styles.title}>Payment processing...</h1>
            <p className={styles.msg}>Your payment is being confirmed. This may take a few minutes. Check your email or visit your payments history.</p>
            <button className={styles.btn} onClick={() => router.push('/dashboard')}>
              Go to dashboard
            </button>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className={`${styles.iconWrap} ${styles.error}`}>
              <XCircle size={48} />
            </div>
            <h1 className={styles.title}>Payment failed</h1>
            <p className={styles.msg}>Something went wrong. You have not been charged. Please try again.</p>
            <button className={styles.btn} onClick={() => router.back()}>
              Go back
            </button>
          </>
        )}
      </div>
    </main>
  );
}