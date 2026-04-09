'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader, Trophy, Gamepad2, ArrowRight } from 'lucide-react';
import { verifyPayment } from '@/lib/payments';
import styles from './payment-success.module.scss';

type Status = 'loading' | 'success' | 'failed' | 'pending';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session_id');
  const type = searchParams.get('type');

  const [status, setStatus] = useState<Status>('loading');
  const [paymentData, setPaymentData] = useState<any>(null);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (!sessionId) { setStatus('failed'); return; }

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

  const isEntry = type === 'entry';
  const isCreation = type === 'creation';

  return (
    <main className={styles.page}>
      {/* Cyber grid background */}
      <div className={styles.grid_bg} />

      <div className={styles.card}>
        {/* ── Loading ── */}
        {status === 'loading' && (
          <div className={styles.state}>
            <div className={styles.icon_wrap}>
              <div className={styles.pulse_ring} />
              <Loader size={36} className={styles.spin_icon} color="#00F5FF" />
            </div>
            <h1 className={styles.title}>Verifying payment...</h1>
            <p className={styles.msg}>Please wait, do not close this page.</p>
            <div className={styles.progress_bar}>
              <div className={styles.progress_fill} />
            </div>
          </div>
        )}

        {/* ── Success ── */}
        {status === 'success' && (
          <div className={styles.state}>
            <div className={`${styles.icon_wrap} ${styles.icon_success}`}>
              <div className={styles.success_ring} />
              {isCreation
                ? <Trophy size={40} color="#FFD700" strokeWidth={1.5} />
                : <Gamepad2 size={40} color="#00FF88" strokeWidth={1.5} />
              }
            </div>

            <div className={styles.badge}>
              <CheckCircle size={12} />
              Payment confirmed
            </div>

            <h1 className={styles.title}>
              {isCreation ? 'Tournament Created!' : "You're In!"}
            </h1>

            <p className={styles.msg}>
              {isCreation
                ? 'Your tournament is now live and open for team registrations.'
                : 'Your team is registered and approved. Time to compete!'}
            </p>

            {paymentData?.amount && (
              <div className={styles.amount_box}>
                <span className={styles.amount_label}>Amount paid</span>
                <span className={styles.amount_val}>
                  LKR {(paymentData.amount / 100).toFixed(2)}
                </span>
              </div>
            )}

            <button
              className={styles.cta_btn}
              onClick={() => router.push(getRedirectPath())}
            >
              {isCreation ? (
                <>Manage Tournament <ArrowRight size={18} /></>
              ) : (
                <>View Tournament <ArrowRight size={18} /></>
              )}
            </button>

            {isEntry && (
              <p className={styles.note}>
                Your slot is secured. Check the tournament page for match schedule updates.
              </p>
            )}
          </div>
        )}

        {/* ── Pending (webhook delayed) ── */}
        {status === 'pending' && (
          <div className={styles.state}>
            <div className={`${styles.icon_wrap} ${styles.icon_warn}`}>
              <Loader size={36} className={styles.spin_icon} color="#FF6B00" />
            </div>
            <h1 className={styles.title}>Still processing...</h1>
            <p className={styles.msg}>
              Your payment is being confirmed by Stripe. This usually takes under a minute.
              Check your email or visit your payments history.
            </p>
            <div className={styles.btn_row}>
              <button className={styles.cta_btn} onClick={() => router.push('/dashboard')}>
                Go to Dashboard
              </button>
              <button
                className={styles.outline_btn}
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* ── Failed ── */}
        {status === 'failed' && (
          <div className={styles.state}>
            <div className={`${styles.icon_wrap} ${styles.icon_error}`}>
              <XCircle size={40} color="#FF006E" strokeWidth={1.5} />
            </div>
            <h1 className={styles.title}>Payment Failed</h1>
            <p className={styles.msg}>
              Something went wrong. You have not been charged. Please try again.
            </p>
            <div className={styles.btn_row}>
              <button className={styles.cta_btn} onClick={() => router.back()}>
                Try Again
              </button>
              <button
                className={styles.outline_btn}
                onClick={() => router.push('/tournaments')}
              >
                Browse Tournaments
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
       <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0A0A0F' }}>
         <div className={styles.spinner} />
       </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}