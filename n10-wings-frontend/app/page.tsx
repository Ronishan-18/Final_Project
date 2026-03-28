'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import styles from './page.module.scss';

// ── Gaming Icons SVG Components ──
function ControllerIcon({ size = 60, color = '#00F5FF', opacity = 0.15 }: {
  size?: number; color?: string; opacity?: number;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none"
      style={{ opacity }} xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="30" width="80" height="45" rx="22" stroke={color} strokeWidth="3" fill={`${color}10`} />
      <circle cx="35" cy="52" r="3" fill={color} />
      <circle cx="28" cy="45" r="3" fill={color} />
      <circle cx="42" cy="45" r="3" fill={color} />
      <circle cx="35" cy="38" r="3" fill={color} />
      <circle cx="65" cy="45" r="4" stroke={color} strokeWidth="2" fill="none" />
      <circle cx="75" cy="45" r="4" stroke={color} strokeWidth="2" fill="none" />
      <rect x="45" y="48" width="10" height="3" rx="1.5" fill={color} />
      <rect x="48.5" y="44.5" width="3" height="10" rx="1.5" fill={color} />
    </svg>
  );
}

function TrophyIcon({ size = 50, color = '#FF6B00', opacity = 0.15 }: {
  size?: number; color?: string; opacity?: number;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none"
      style={{ opacity }} xmlns="http://www.w3.org/2000/svg">
      <path d="M30 15 H70 V50 C70 65 60 75 50 78 C40 75 30 65 30 50 Z"
        stroke={color} strokeWidth="3" fill={`${color}10`} />
      <path d="M15 20 H30 V45 C20 45 15 38 15 30 Z"
        stroke={color} strokeWidth="2.5" fill={`${color}08`} />
      <path d="M85 20 H70 V45 C80 45 85 38 85 30 Z"
        stroke={color} strokeWidth="2.5" fill={`${color}08`} />
      <rect x="42" y="78" width="16" height="8" rx="2" stroke={color} strokeWidth="2.5" fill={`${color}10`} />
      <rect x="33" y="86" width="34" height="5" rx="2.5" stroke={color} strokeWidth="2.5" fill={`${color}10`} />
      <path d="M45 35 L50 25 L55 35 L65 35 L57 42 L60 52 L50 46 L40 52 L43 42 L35 35 Z"
        fill={color} opacity="0.6" />
    </svg>
  );
}

function CrosshairIcon({ size = 45, color = '#8B00FF', opacity = 0.15 }: {
  size?: number; color?: string; opacity?: number;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none"
      style={{ opacity }} xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="35" stroke={color} strokeWidth="2.5" />
      <circle cx="50" cy="50" r="20" stroke={color} strokeWidth="2" strokeDasharray="5 3" />
      <circle cx="50" cy="50" r="5" fill={color} opacity="0.7" />
      <line x1="50" y1="10" x2="50" y2="25" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="50" y1="75" x2="50" y2="90" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="10" y1="50" x2="25" y2="50" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="75" y1="50" x2="90" y2="50" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function ShieldIcon({ size = 55, color = '#00F5FF', opacity = 0.12 }: {
  size?: number; color?: string; opacity?: number;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none"
      style={{ opacity }} xmlns="http://www.w3.org/2000/svg">
      <path d="M50 10 L80 22 V50 C80 68 65 82 50 88 C35 82 20 68 20 50 V22 Z"
        stroke={color} strokeWidth="3" fill={`${color}10`} />
      <path d="M50 25 L65 32 V50 C65 60 58 68 50 72 C42 68 35 60 35 50 V32 Z"
        stroke={color} strokeWidth="2" fill={`${color}08`} />
      <path d="M42 50 L47 55 L58 44" stroke={color} strokeWidth="3"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Floating Gaming Element ──
function FloatingGamingIcon({
  children, top, left, right, bottom,
  duration = 6, delay = 0, rotateAmount = 10, scale = 1,
}: {
  children: React.ReactNode;
  top?: string; left?: string; right?: string; bottom?: string;
  duration?: number; delay?: number; rotateAmount?: number; scale?: number;
}) {
  return (
    <motion.div
      style={{
        position: 'absolute', top, left, right, bottom,
        pointerEvents: 'none', scale,
      }}
      animate={{
        y: [-12, 12, -12],
        rotate: [-rotateAmount / 2, rotateAmount / 2, -rotateAmount / 2],
      }}
      transition={{ duration, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      {children}
    </motion.div>
  );
}

// ── Animated Counter ──
function Counter({ end, suffix = '', duration = 2 }: {
  end: number; suffix?: string; duration?: number;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = end / (duration * 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [inView, end, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// ── Fade In Section ──
function FadeIn({ children, delay = 0, className = '' }: {
  children: React.ReactNode; delay?: number; className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

export default function HomePage() {
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const handle = (e: MouseEvent) => setMousePos({
      x: e.clientX / window.innerWidth,
      y: e.clientY / window.innerHeight,
    });
    window.addEventListener('mousemove', handle);
    return () => window.removeEventListener('mousemove', handle);
  }, []);

  const stats = [
    { value: 1200, suffix: '+', label: 'Active Players', icon: '🎮', color: '#00F5FF' },
    { value: 48, suffix: '+', label: 'Tournaments', icon: '🏆', color: '#FF6B00' },
    { value: 350, suffix: 'K', label: 'Prize Pool LKR', icon: '💰', color: '#8B00FF' },
    { value: 25, suffix: '+', label: 'Sponsors', icon: '🤝', color: '#FF006E' },
  ];

  const howItWorks = [
    { step: '001', icon: '👤', title: 'CREATE PROFILE', desc: 'Register and build your gamer identity with your details, gaming style and preferences', color: '#00F5FF' },
    { step: '002', icon: '🎮', title: 'LINK GAMES', desc: 'Connect PUBG PC, Valorant or League of Legends to automatically sync your stats', color: '#FF6B00' },
    { step: '003', icon: '⚔️', title: 'JOIN TOURNAMENTS', desc: 'Browse and register for tournaments matching your game and skill level', color: '#8B00FF' },
    { step: '004', icon: '🏆', title: 'WIN & DOMINATE', desc: 'Compete for prize pools, build your reputation and get discovered by sponsors', color: '#FF006E' },
  ];

  const features = [
    { icon: '🎯', title: 'PUBG PC STATS', desc: 'Auto-sync K/D, kills, wins from Krafton API', color: '#F5A623', bg: 'rgba(245,166,35,0.08)' },
    { icon: '⚡', title: 'VALORANT', desc: 'Link Riot ID and verify your account instantly', color: '#FF4655', bg: 'rgba(255,70,85,0.08)' },
    { icon: '🗡️', title: 'LEAGUE OF LEGENDS', desc: 'Display tier, LP, wins and win rate automatically', color: '#C89B3C', bg: 'rgba(200,155,60,0.08)' },
    { icon: '🏆', title: 'TOURNAMENTS', desc: 'Join or create competitive events with real prize pools', color: '#FF6B00', bg: 'rgba(255,107,0,0.08)' },
    { icon: '👥', title: 'TEAM SYSTEM', desc: 'Build squads, manage rosters, compete as a team', color: '#00F5FF', bg: 'rgba(0,245,255,0.08)' },
    { icon: '💼', title: 'SPONSOR CONNECT', desc: 'Get discovered by gaming brands and organizations', color: '#8B00FF', bg: 'rgba(139,0,255,0.08)' },
  ];

  return (
    <div className={styles.home}>

      {/* ── HERO ── */}
      <section className={styles.hero}>
        {/* Background */}
        <div className={styles.hero__bg}>
          <div className={styles.hero__grid} />
          <motion.div
            className={styles.hero__spotlight}
            animate={{
              background: `radial-gradient(700px at ${mousePos.x * 100}% ${mousePos.y * 100}%,
                rgba(0,245,255,0.07) 0%, transparent 70%)`
            }}
            transition={{ duration: 0.1 }}
          />
          <div className={styles.hero__glow_cyan} />
          <div className={styles.hero__glow_orange} />

          {/* Scan line */}
          <motion.div
            className={styles.hero__scanline}
            animate={{ y: ['-5%', '105%'] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear', repeatDelay: 3 }}
          />
        </div>

        {/* ── Gaming Icons floating ── */}
        <FloatingGamingIcon top="8%" left="3%" duration={7} delay={0} rotateAmount={15}>
          <ControllerIcon size={70} color="#00F5FF" opacity={0.18} />
        </FloatingGamingIcon>

        <FloatingGamingIcon top="15%" right="4%" duration={6} delay={1} rotateAmount={12}>
          <TrophyIcon size={55} color="#FF6B00" opacity={0.18} />
        </FloatingGamingIcon>

        <FloatingGamingIcon bottom="20%" left="2%" duration={8} delay={2} rotateAmount={8}>
          <CrosshairIcon size={50} color="#8B00FF" opacity={0.18} />
        </FloatingGamingIcon>

        <FloatingGamingIcon bottom="15%" right="3%" duration={7} delay={0.5} rotateAmount={10}>
          <ShieldIcon size={60} color="#00F5FF" opacity={0.15} />
        </FloatingGamingIcon>

        <FloatingGamingIcon top="45%" left="1%" duration={9} delay={3} rotateAmount={5}>
          <ControllerIcon size={35} color="#FF6B00" opacity={0.1} />
        </FloatingGamingIcon>

        <FloatingGamingIcon top="35%" right="2%" duration={6} delay={1.5} rotateAmount={20}>
          <CrosshairIcon size={38} color="#FF006E" opacity={0.12} />
        </FloatingGamingIcon>

        {/* Content */}
        <div className={styles.hero__inner}>
          <motion.div
            className={styles.hero__content}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <motion.span
              className={styles.hero__badge}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              ⚡ SRI LANKA&apos;S #1 E-SPORTS PLATFORM
            </motion.span>

            <motion.h1
              className={styles.hero__title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.8 }}
            >
              <span className={styles.hero__title_white}>ELEVATE YOUR</span>
              <span className={styles.hero__title_gradient}>GAME.</span>
              <span className={styles.hero__title_white}>WIN. <span className={styles.hero__title_orange}>DOMINATE.</span></span>
            </motion.h1>

            <motion.p
              className={styles.hero__sub}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              The ultimate E-Sports management platform for Sri Lankan gamers.
              Link accounts, showcase stats, join tournaments, get noticed by sponsors.
            </motion.p>

            <motion.div
              className={styles.hero__ctas}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 }}
            >
              <Link href="/register" className={styles.hero__btn_primary}>
                🎮 START PLAYING NOW →
              </Link>
              <Link href="/players" className={styles.hero__btn_secondary}>
                👥 VIEW PLAYERS ↗
              </Link>
            </motion.div>

            <motion.div
              className={styles.hero__games}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              {['🎯 PUBG PC', '⚡ Valorant', '🗡️ League of Legends', '🏆 Live Tournaments'].map(g => (
                <span key={g} className={styles.hero__game_tag}>{g}</span>
              ))}
            </motion.div>
          </motion.div>

          {/* Hero Card Visual */}
          <motion.div
            className={styles.hero__visual}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.9 }}
          >
            {/* Main card */}
            <div className={styles.hero__card}>
              <div className={styles.hero__card_bar} />
              <div className={styles.hero__card_header}>
                <div className={styles.hero__card_avatar}>🎮</div>
                <div>
                  <p className={styles.hero__card_name}>Pro Gamer LK</p>
                  <p className={styles.hero__card_rank}>💎 Diamond Rank</p>
                </div>
                <motion.span
                  className={styles.hero__card_live}
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  ● LIVE
                </motion.span>
              </div>
              <div className={styles.hero__card_stats}>
                {[
                  { v: '4.8', l: 'K/D', c: '#F5A623' },
                  { v: '234', l: 'Wins', c: '#00FF88' },
                  { v: '1.2K', l: 'Kills', c: '#00F5FF' },
                ].map(s => (
                  <div key={s.l} className={styles.hero__card_stat}>
                    <span style={{ color: s.c }}>{s.v}</span>
                    <span>{s.l}</span>
                  </div>
                ))}
              </div>
              {/* Decorative controller in card */}
              <div className={styles.hero__card_deco}>
                <ControllerIcon size={80} color="#00F5FF" opacity={0.06} />
              </div>
            </div>

            {/* Floating mini cards */}
            <motion.div
              className={styles.hero__mini}
              style={{ top: '5%', right: '-15px' }}
              animate={{ y: [-8, 8, -8] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              🏆 Tournament Live
            </motion.div>
            <motion.div
              className={styles.hero__mini}
              style={{ bottom: '10%', left: '-15px' }}
              animate={{ y: [8, -8, 8] }}
              transition={{ duration: 5, repeat: Infinity }}
            >
              ⚡ Stats Synced
            </motion.div>
            <motion.div
              className={styles.hero__mini}
              style={{ top: '45%', right: '-25px' }}
              animate={{ y: [-5, 5, -5] }}
              transition={{ duration: 6, repeat: Infinity, delay: 1 }}
            >
              🎯 PUBG ✅
            </motion.div>
          </motion.div>
        </div>

        <div className="divider" />
      </section>

      {/* ── STATS ── */}
      <section className={styles.stats_section}>
        <div className="container">
          <div className={styles.stats_grid}>
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                className={styles.stat_card}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.04, y: -4 }}
              >
                <span className={styles.stat_icon}>{s.icon}</span>
                <span className={styles.stat_value} style={{ color: s.color }}>
                  <Counter end={s.value} suffix={s.suffix} />
                </span>
                <span className={styles.stat_label}>{s.label}</span>
                <div className={styles.stat_bar}
                  style={{ background: `linear-gradient(90deg, ${s.color}, transparent)` }} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className={`${styles.how_section} section`}>
        <div className="container">
          <FadeIn>
            <p className={`badge-orange badge ${styles.center_badge}`}>
              ⚙️ HOW IT WORKS
            </p>
            <h2 className="section-title gradient-text">YOUR PATH TO GLORY</h2>
            <p className="section-sub">
              Four steps from casual gamer to tournament champion
            </p>
          </FadeIn>

          <div className={styles.how_grid}>
            {howItWorks.map((item, i) => (
              <motion.div
                key={item.step}
                className={styles.how_card}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                whileHover={{ y: -8 }}
              >
                <div className={styles.how_card_glow}
                  style={{ background: item.color }} />
                <span className={styles.how_step}
                  style={{ color: item.color, borderColor: `${item.color}30` }}>
                  #{item.step}
                </span>
                <span className={styles.how_icon}>{item.icon}</span>
                <h3 className={styles.how_title}>{item.title}</h3>
                <p className={styles.how_desc}>{item.desc}</p>
                {i < howItWorks.length - 1 && (
                  <span className={styles.how_arrow}
                    style={{ color: item.color }}>→</span>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className={`${styles.features_section} section`}>
        <div className="container">
          <FadeIn>
            <p className={`badge ${styles.center_badge}`}>⚡ FEATURES</p>
            <h2 className="section-title">
              EVERYTHING YOU <span className="gradient-text">NEED</span>
            </h2>
            <p className="section-sub">
              Built for Sri Lankan gamers — casual to pro
            </p>
          </FadeIn>

          <div className={styles.features_grid}>
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                className={styles.feature_card}
                style={{ '--feat-color': f.color } as React.CSSProperties}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -6, scale: 1.01 }}
              >
                <div className={styles.feature_icon_wrap}
                  style={{ background: f.bg, borderColor: `${f.color}25` }}>
                  <span className={styles.feature_icon}>{f.icon}</span>
                </div>
                <div className={styles.feature_body}>
                  <h3 className={styles.feature_title} style={{ color: f.color }}>
                    {f.title}
                  </h3>
                  <p className={styles.feature_desc}>{f.desc}</p>
                </div>
                <div className={styles.feature_glow}
                  style={{ background: f.color }} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className={styles.cta_section}>
        <div className="container">
          <FadeIn>
            <div className={styles.cta_box}>
              <div className={styles.cta_glow1} />
              <div className={styles.cta_glow2} />
              {/* Decorative icons */}
              <div className={styles.cta_deco_left}>
                <TrophyIcon size={120} color="#FF6B00" opacity={0.08} />
              </div>
              <div className={styles.cta_deco_right}>
                <ControllerIcon size={130} color="#00F5FF" opacity={0.07} />
              </div>
              <div className={styles.cta_content}>
                <span className={`badge-orange badge`}>🚀 JOIN NOW!</span>
                <h2 className={styles.cta_title}>
                  READY TO DOMINATE<br />
                  <span className="gradient-text">THE ARENA?</span>
                </h2>
                <p className={styles.cta_sub}>
                  Join thousands of Sri Lankan gamers. Build your profile,
                  link your accounts and start competing today!
                </p>
                <div className={styles.cta_btns}>
                  <Link href="/register" className={styles.cta_btn_primary}>
                    🎮 CREATE FREE ACCOUNT →
                  </Link>
                  <Link href="/tournaments" className={styles.cta_btn_secondary}>
                    🏆 VIEW TOURNAMENTS ↗
                  </Link>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

    </div>
  );
}