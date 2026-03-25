'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users, Trophy, Zap, Gamepad2, Crown,
  Briefcase, Shield, TrendingUp, ChevronRight
} from 'lucide-react';
import IconTile from '../components/IconTile';
import api from '../lib/api';
import styles from './page.module.scss';

interface Gamer {
  id: number;
  username: string;
  full_name?: string;
  avatar?: string;
  country?: string;
  player_rank?: string;
  points?: number;
  wins?: number;
}

function TopPlayers() {
  const [gamers, setGamers] = useState<Gamer[]>([]);

  useEffect(() => {
    api.get('/profile/search')
      .then(res => {
        if (res.data.success) setGamers(res.data.gamers.slice(0, 6));
      })
      .catch(() => {});
  }, []);

  if (gamers.length === 0) return (
    <div style={{ color: '#8892A4', textAlign: 'center', padding: '2rem' }}>
      No players yet.{' '}
      <Link href="/register" style={{ color: '#00F5FF' }}>Be the first! →</Link>
    </div>
  );

  return (
    <div className={styles.topplayers__grid}>
      {gamers.map((gamer) => (
        <Link key={gamer.id} href={`/profile/${gamer.id}`} className={styles.topplayers__card}>
          <div className={styles.topplayers__avatar}>
            {gamer.avatar
              ? <img src={gamer.avatar} alt={gamer.username} />
              : <Gamepad2 size={24} color="#00F5FF" strokeWidth={1.75} />
            }
          </div>
          <div className={styles.topplayers__name}>{gamer.full_name || gamer.username}</div>
          <div className={styles.topplayers__handle}>@{gamer.username}</div>
          {gamer.player_rank && (
            <div className={styles.topplayers__rank}>
              <Shield size={11} strokeWidth={2} style={{ display: 'inline', marginRight: 3 }} />
              {gamer.player_rank}
            </div>
          )}
          <div className={styles.topplayers__points}>
            <Zap size={11} strokeWidth={2} style={{ display: 'inline', marginRight: 3 }} />
            {gamer.points ?? 0} pts
          </div>
        </Link>
      ))}
    </div>
  );
}

const statsData = [
  { icon: Users, label: 'Active Players', num: '50K+', color: '#00F5FF' },
  { icon: Trophy, label: 'Tournaments', num: '1,200+', color: '#8B00FF' },
  { icon: Zap, label: 'Prize Pool', num: '$2.5M+', color: '#FF006E' },
];

const featuresData = [
  {
    icon: Gamepad2,
    title: 'FOR GAMERS',
    desc: 'Showcase skills, join teams, register for tournaments and climb leaderboards.',
    color: '#00F5FF',
  },
  {
    icon: Trophy,
    title: 'FOR ORGANIZERS',
    desc: 'Create tournaments, manage brackets, set prize pools and update results.',
    color: '#8B00FF',
  },
  {
    icon: Briefcase,
    title: 'FOR SPONSORS',
    desc: 'Find talented players, browse verified stats, sponsor tournaments.',
    color: '#FF006E',
  },
  {
    icon: Crown,
    title: 'FOR ADMINS',
    desc: 'Full platform control, user management, analytics and reporting.',
    color: '#FFD700',
  },
];

const tournamentsData = [
  { name: 'Pro League Season 3', game: 'Valorant', prize: '$5,000', teams: '28', max: '32', status: 'LIVE', color: '#FF006E' },
  { name: 'Summer Cup 2026', game: 'PUBG', prize: '$2,000', teams: '8', max: '16', status: 'OPEN', color: '#00F5FF' },
  { name: 'Champions Bowl', game: 'Free Fire', prize: '$10,000', teams: '4', max: '64', status: 'SOON', color: '#8B00FF' },
];

export default function Home() {
  return (
    <div className={styles.home}>

      {/* ── HERO ── */}
      <section className={styles.hero}>
        <div className={styles.hero__overlay} />
        <div className={styles.hero__content}>
          <div className="badge">
            <Zap size={12} strokeWidth={2.5} />
            The Future of E-Sports Management
          </div>
          <h1 className={styles.hero__title}>
            DOMINATE THE
            <span className={`${styles.hero__gradient} gradient-text`}>
              {' '}DIGITAL ARENA
            </span>
          </h1>
          <p className={styles.hero__sub}>
            The ultimate platform connecting gamers, tournament organizers, and sponsors.
            Build your legacy, compete in tournaments, and get discovered.
          </p>
          <div className={styles.hero__btns}>
            <Link href="/register" className="btn-primary">
              Get Started <ChevronRight size={16} strokeWidth={2.5} />
            </Link>
            <Link href="/tournaments" className="btn-outline">
              Browse Tournaments
            </Link>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ── STATS ── */}
      <section className={styles.stats}>
        <div className="container">
          <div className={styles.stats__grid}>
            {statsData.map((s) => (
              <div key={s.label} className={styles.stats__card}>
                <IconTile icon={s.icon} color={s.color} size={26} tileSize={56} radius={14} />
                <span className={styles.stats__num}>{s.num}</span>
                <span className={styles.stats__label}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ── TOP PLAYERS ── */}
      <section className={`${styles.topplayers} section`}>
        <div className="container">
          <div className={styles.topplayers__header}>
            <h2 className="section-title" style={{ textAlign: 'left', marginBottom: 0 }}>
              TOP <span className="gradient-text">PLAYERS</span>
            </h2>
            <Link href="/players" className={styles.topplayers__viewall}>
              View All →
            </Link>
          </div>
          <TopPlayers />
        </div>
      </section>

      <div className="divider" />

      {/* ── FEATURES ── */}
      <section className={`${styles.features} section`}>
        <div className="container">
          <h2 className="section-title">
            EVERYTHING YOU NEED TO{' '}
            <span className="gradient-text">DOMINATE</span>
          </h2>
          <p className="section-sub">One platform for all your E-Sports needs</p>
          <div className={styles.features__grid}>
            {featuresData.map((f) => (
              <div key={f.title} className={styles.features__card}>
                <div className={styles.features__icon}>
                  <IconTile icon={f.icon} color={f.color} size={28} tileSize={60} radius={14} />
                </div>
                <h3 className={styles.features__title} style={{ color: f.color }}>
                  {f.title}
                </h3>
                <p className={styles.features__desc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ── TOURNAMENTS ── */}
      <section className={`${styles.tournaments} section`}>
        <div className="container">
          <div className={styles.tournaments__header}>
            <h2 className="section-title" style={{ textAlign: 'left', marginBottom: 0 }}>
              FEATURED <span className="gradient-text">TOURNAMENTS</span>
            </h2>
            <Link href="/tournaments" className={styles.tournaments__viewall}>
              View All →
            </Link>
          </div>
          <div className={styles.tournaments__grid}>
            {tournamentsData.map((t) => (
              <div key={t.name} className={styles.tournaments__card}>
                <div className={styles.tournaments__top}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Gamepad2 size={14} color="#8892A4" strokeWidth={1.75} />
                    <span className={styles.tournaments__game}>{t.game}</span>
                  </div>
                  <span
                    className={styles.tournaments__status}
                    style={{ color: t.color, borderColor: t.color }}
                  >
                    {t.status}
                  </span>
                </div>
                <h3 className={styles.tournaments__name}>{t.name}</h3>
                <div className={styles.tournaments__info}>
                  <div>
                    <div className={styles.tournaments__info_label}>Prize Pool</div>
                    <div className={styles.tournaments__info_val} style={{ color: t.color }}>
                      {t.prize}
                    </div>
                  </div>
                  <div>
                    <div className={styles.tournaments__info_label}>Teams</div>
                    <div className={styles.tournaments__info_val}>{t.teams}/{t.max}</div>
                  </div>
                </div>
                <div className={styles.tournaments__bar}>
                  <div
                    className={styles.tournaments__bar_fill}
                    style={{
                      width: `${(parseInt(t.teams) / parseInt(t.max)) * 100}%`,
                      background: t.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className={styles.cta}>
        <div className="container">
          <div className={styles.cta__inner}>
            <h2 className={styles.cta__title}>
              READY TO JOIN{' '}
              <span className="gradient-text">N-10 WINGS?</span>
            </h2>
            <p className={styles.cta__sub}>
              Create your account today and start your E-Sports journey!
            </p>
            <Link href="/register" className="btn-primary">
              Join Now — It&apos;s Free! <ChevronRight size={16} strokeWidth={2.5} />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}