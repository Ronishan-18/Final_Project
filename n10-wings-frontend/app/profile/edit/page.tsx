'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../../lib/api';
import AvatarUpload from '../../../components/AvatarUpload';
import styles from './edit.module.scss';

export default function EditProfilePage() {
  const router = useRouter();
  const [role, setRole] = useState('user');
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [avatar, setAvatar] = useState('');
  const [username, setUsername] = useState('');

  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
    country: '',
    phone: '',
    date_of_birth: '',
    social_facebook: '',
    social_instagram: '',
    social_youtube: '',
    social_twitter: '',
    game_preferences: '',
    player_rank: '',
    playstyle: '',
    organization_name: '',
    experience_years: '',
    website: '',
    company_name: '',
    industry: '',
    budget_range: '',
    interests: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) { router.push('/login'); return; }

        const res = await api.get('/profile/me');
        if (res.data.success) {
          const { user, profile, gamerProfile, organizerProfile, sponsorProfile } = res.data;
          setRole(user.role);
          setIsOrganizer(user.is_organizer);
          setAvatar(profile?.avatar || '');
          setUsername(user.username);

          setFormData({
            full_name: profile?.full_name || '',
            bio: profile?.bio || '',
            country: profile?.country || '',
            phone: profile?.phone || '',
            date_of_birth: profile?.date_of_birth?.split('T')[0] || '',
            social_facebook: profile?.social_facebook || '',
            social_instagram: profile?.social_instagram || '',
            social_youtube: profile?.social_youtube || '',
            social_twitter: profile?.social_twitter || '',
            game_preferences: gamerProfile?.game_preferences || '',
            player_rank: gamerProfile?.player_rank || '',
            playstyle: gamerProfile?.playstyle || '',
            organization_name: organizerProfile?.organization_name || '',
            experience_years: organizerProfile?.experience_years || '',
            website: organizerProfile?.website || '',
            company_name: sponsorProfile?.company_name || '',
            industry: sponsorProfile?.industry || '',
            budget_range: sponsorProfile?.budget_range || '',
            interests: sponsorProfile?.interests || '',
          });
        }
      } catch {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await api.put('/profile/me', formData);
      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Update failed!');
    } finally {
      setSaving(false);
    }
  };

  const set = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loading__spinner} />
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className={styles.edit}>
      <div className={styles.edit__inner}>

        {/* Header */}
        <div className={styles.edit__header}>
          <div>
            <h1 className={styles.edit__title}>EDIT PROFILE</h1>
            <p className={styles.edit__sub}>Update your information</p>
          </div>
          <Link href="/dashboard" className={styles.edit__back}>
            ← Back to Dashboard
          </Link>
        </div>

        {/* Success / Error */}
        {success && (
          <div className={styles.edit__success}>
            ✅ Profile updated! Redirecting...
          </div>
        )}
        {error && (
          <div className={styles.edit__error}>❌ {error}</div>
        )}

        {/* Avatar Section */}
        <div className={styles.edit__section}>
          <h2 className={styles.edit__section_title}>📸 PROFILE PICTURE</h2>
          <div className={styles.edit__avatar_wrap}>
            <AvatarUpload
              currentAvatar={avatar}
              username={username}
              onUpdate={(newAvatar) => setAvatar(newAvatar)}
            />
            {/* <div className={styles.edit__avatar_info}>
              <p className={styles.edit__avatar_hint}>
                Click on your avatar to upload or remove photo
              </p>
              <p className={styles.edit__avatar_hint}>
                JPG, PNG or WEBP • Max 5MB • Will be cropped to circle
              </p>
            </div> */}
          </div>
        </div>

        {/* Basic Info */}
        <div className={styles.edit__section}>
          <h2 className={styles.edit__section_title}>👤 BASIC INFO</h2>
          <div className={styles.edit__grid}>
            {[
              { label: 'Full Name', field: 'full_name', placeholder: 'Your full name' },
              { label: 'Country', field: 'country', placeholder: 'e.g. Sri Lanka' },
              { label: 'Phone', field: 'phone', placeholder: 'Your phone number' },
              { label: 'Date of Birth', field: 'date_of_birth', placeholder: '', type: 'date' },
            ].map((item) => (
              <div key={item.field} className={styles.edit__group}>
                <label className={styles.edit__label}>{item.label}</label>
                <input
                  type={item.type || 'text'}
                  className={styles.edit__input}
                  placeholder={item.placeholder}
                  value={formData[item.field as keyof typeof formData]}
                  onChange={(e) => set(item.field, e.target.value)}
                />
              </div>
            ))}
            <div className={`${styles.edit__group} ${styles['edit__group--full']}`}>
              <label className={styles.edit__label}>Bio</label>
              <textarea
                className={`${styles.edit__input} ${styles.edit__textarea}`}
                placeholder="Tell us about yourself..."
                value={formData.bio}
                onChange={(e) => set('bio', e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className={styles.edit__section}>
          <h2 className={styles.edit__section_title}>🔗 SOCIAL LINKS</h2>
          <div className={styles.edit__grid}>
            {[
              { label: '📘 Facebook', field: 'social_facebook', placeholder: 'https://facebook.com/yourprofile' },
              { label: '📸 Instagram', field: 'social_instagram', placeholder: 'https://instagram.com/yourprofile' },
              { label: '▶️ YouTube', field: 'social_youtube', placeholder: 'https://youtube.com/@yourchannel' },
              { label: '🐦 Twitter / X', field: 'social_twitter', placeholder: 'https://twitter.com/yourhandle' },
            ].map((item) => (
              <div key={item.field} className={styles.edit__group}>
                <label className={styles.edit__label}>{item.label}</label>
                <input
                  type="text"
                  className={styles.edit__input}
                  placeholder={item.placeholder}
                  value={formData[item.field as keyof typeof formData]}
                  onChange={(e) => set(item.field, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Gaming Info */}
        <div className={styles.edit__section}>
          <h2 className={styles.edit__section_title}>🎮 GAMING INFO</h2>
          <div className={styles.edit__grid}>
            {[
              { label: 'Game Preferences', field: 'game_preferences', placeholder: 'e.g. PUBG, Valorant, Free Fire' },
              { label: 'Player Rank', field: 'player_rank', placeholder: 'e.g. Diamond, Pro, Platinum' },
              { label: 'Playstyle', field: 'playstyle', placeholder: 'e.g. Aggressive, Support, Sniper' },
            ].map((item) => (
              <div key={item.field} className={styles.edit__group}>
                <label className={styles.edit__label}>{item.label}</label>
                <input
                  type="text"
                  className={styles.edit__input}
                  placeholder={item.placeholder}
                  value={formData[item.field as keyof typeof formData]}
                  onChange={(e) => set(item.field, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Organizer Info */}
        {isOrganizer && (
          <div className={styles.edit__section}>
            <h2 className={styles.edit__section_title}>🏆 ORGANIZER INFO</h2>
            <div className={styles.edit__grid}>
              {[
                { label: 'Organization Name', field: 'organization_name', placeholder: 'Your org name' },
                { label: 'Experience Years', field: 'experience_years', placeholder: 'e.g. 3' },
                { label: 'Website', field: 'website', placeholder: 'https://yourwebsite.com' },
              ].map((item) => (
                <div key={item.field} className={styles.edit__group}>
                  <label className={styles.edit__label}>{item.label}</label>
                  <input
                    type="text"
                    className={styles.edit__input}
                    placeholder={item.placeholder}
                    value={formData[item.field as keyof typeof formData]}
                    onChange={(e) => set(item.field, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sponsor Info */}
        {role === 'sponsor' && (
          <div className={styles.edit__section}>
            <h2 className={styles.edit__section_title}>💼 SPONSOR INFO</h2>
            <div className={styles.edit__grid}>
              {[
                { label: 'Company Name', field: 'company_name', placeholder: 'Your company' },
                { label: 'Industry', field: 'industry', placeholder: 'e.g. Technology' },
                { label: 'Budget Range', field: 'budget_range', placeholder: 'e.g. LKR 10,000 - 50,000' },
                { label: 'Interests', field: 'interests', placeholder: 'e.g. FPS, Battle Royale' },
                { label: 'Website', field: 'website', placeholder: 'https://yourcompany.com' },
              ].map((item) => (
                <div key={item.field} className={styles.edit__group}>
                  <label className={styles.edit__label}>{item.label}</label>
                  <input
                    type="text"
                    className={styles.edit__input}
                    placeholder={item.placeholder}
                    value={formData[item.field as keyof typeof formData]}
                    onChange={(e) => set(item.field, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Save Button */}
        <button
          className={styles.edit__save}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : '💾 Save Changes →'}
        </button>

      </div>
    </div>
  );
}