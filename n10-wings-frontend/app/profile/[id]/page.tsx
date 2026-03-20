'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../../lib/api';
import styles from './profile.module.scss';

interface ProfileData {
  user: {
    id: number;
    username: string;
    role: string;
    created_at: string;
  };
  profile: {
    full_name?: string;
    bio?: string;
    avatar?: string;
    country?: string;
    phone?: string;
  };
  roleProfile: {
    game_preferences?: string;
    player_rank?: string;
    playstyle?: string;
    tournaments_played?: number;
    wins?: number;
    losses?: number;
    points?: number;
    organization_name?: string;
    company_name?: string;
    industry?: string;
  };
}

export default function PublicProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get(`/profile/${id}`);
        if (res.data.success) {
          setData(res.data);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loading__spinner} />
        <p>Loading profile...</p>
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className={styles.notfound}>
        <span>😕</span>
        <h2>Profile Not Found</h2>
        <p>This player doesn&apos;t exist or has been removed.</p>
        <Link href="/players">← Back to Players</Link>
      </div>
    );
  }

  const { user, profile, roleProfile } = data;

  const winRate =
    roleProfile?.wins !== undefined &&
    roleProfile?.losses !== undefined &&
    roleProfile.wins + roleProfile.losses > 0
      ? Math.round(
          (roleProfile.wins / (roleProfile.wins + roleProfile.losses)) * 100
        )
      : 0;

  const roleColors: Record<string, string> = {
    gamer: '#00F5FF',
    organizer: '#8B00FF',
    sponsor: '#FF006E',
    admin: '#FFD700',
  };

  const roleColor = roleColors[user.role] || '#00F5FF';

  return (
    <div className={styles.profile}>
      <div className={styles.profile__inner}>

        {/* Back */}
        <Link href="/players" className={styles.profile__back}>
          ← Back to Players
        </Link>

        {/* Hero Card */}
        <div className={styles.hero}>
          <div className={styles.hero__avatar}>
            {profile?.avatar ? (
              <img src={profile.avatar} alt={user.username} />
            ) : (
              <span>🎮</span>
            )}
          </div>
          <div className={styles.hero__info}>
            <div
              className={styles.hero__role}
              style={{ color: roleColor, borderColor: roleColor }}
            >
              {user.role.toUpperCase()}
            </div>
            <h1 className={styles.hero__name}>
              {profile?.full_name || user.username}
            </h1>
            <p className={styles.hero__username}>@{user.username}</p>
            {profile?.country && (
              <p className={styles.hero__country}>🌍 {profile.country}</p>
            )}
            {profile?.bio && (
              <p className={styles.hero__bio}>{profile.bio}</p>
            )}
          </div>
        </div>

        {/* Stats — Gamer Only */}
        {user.role === 'gamer' && (
          <div className={styles.stats}>
            {[
              {
                icon: '🏆',
                label: 'Tournaments',
                value: roleProfile?.tournaments_played ?? 0,
                color: '#00F5FF',
              },
              {
                icon: '✅',
                label: 'Wins',
                value: roleProfile?.wins ?? 0,
                color: '#00FF88',
              },
              {
                icon: '❌',
                label: 'Losses',
                value: roleProfile?.losses ?? 0,
                color: '#FF006E',
              },
              {
                icon: '⚡',
                label: 'Points',
                value: roleProfile?.points ?? 0,
                color: '#8B00FF',
              },
              {
                icon: '📈',
                label: 'Win Rate',
                value: `${winRate}%`,
                color: '#FFD700',
              },
            ].map((stat) => (
              <div key={stat.label} className={styles.stats__card}>
                <span className={styles.stats__icon}>{stat.icon}</span>
                <span
                  className={styles.stats__value}
                  style={{ color: stat.color }}
                >
                  {stat.value}
                </span>
                <span className={styles.stats__label}>{stat.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Info Grid */}
        <div className={styles.grid}>

          {/* Basic Info */}
          <div className={styles.card}>
            <h2 className={styles.card__title}>👤 BASIC INFO</h2>
            <div className={styles.card__list}>
              {[
                { label: 'Username', value: user.username },
                { label: 'Full Name', value: profile?.full_name || '—' },
                { label: 'Country', value: profile?.country || '—' },
                {
                  label: 'Member Since',
                  value: user.created_at?.split('T')[0],
                },
              ].map((item) => (
                <div key={item.label} className={styles.card__item}>
                  <span className={styles.card__item_label}>{item.label}</span>
                  <span className={styles.card__item_value}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Gamer Info */}
          {user.role === 'gamer' && (
            <div className={styles.card}>
              <h2 className={styles.card__title}>🎮 GAMING INFO</h2>
              <div className={styles.card__list}>
                {[
                  {
                    label: 'Rank',
                    value: roleProfile?.player_rank || '—',
                  },
                  {
                    label: 'Playstyle',
                    value: roleProfile?.playstyle || '—',
                  },
                  {
                    label: 'Games',
                    value: roleProfile?.game_preferences || '—',
                  },
                ].map((item) => (
                  <div key={item.label} className={styles.card__item}>
                    <span className={styles.card__item_label}>{item.label}</span>
                    <span className={styles.card__item_value}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Organizer Info */}
          {user.role === 'organizer' && (
            <div className={styles.card}>
              <h2 className={styles.card__title}>🏆 ORGANIZER INFO</h2>
              <div className={styles.card__list}>
                {[
                  {
                    label: 'Organization',
                    value: roleProfile?.organization_name || '—',
                  },
                ].map((item) => (
                  <div key={item.label} className={styles.card__item}>
                    <span className={styles.card__item_label}>{item.label}</span>
                    <span className={styles.card__item_value}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sponsor Info */}
          {user.role === 'sponsor' && (
            <div className={styles.card}>
              <h2 className={styles.card__title}>💼 SPONSOR INFO</h2>
              <div className={styles.card__list}>
                {[
                  {
                    label: 'Company',
                    value: roleProfile?.company_name || '—',
                  },
                  {
                    label: 'Industry',
                    value: roleProfile?.industry || '—',
                  },
                ].map((item) => (
                  <div key={item.label} className={styles.card__item}>
                    <span className={styles.card__item_label}>{item.label}</span>
                    <span className={styles.card__item_value}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}