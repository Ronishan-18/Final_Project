'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, Plus } from 'lucide-react';
import IconTile from '../../../components/IconTile';
import api from '../../../lib/api';
import styles from './create_team.module.scss';

export default function CreateTeamPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', tag: '', description: '', logo: '' });

  const set = (f: string, v: string) => setForm(prev => ({ ...prev, [f]: v }));

  const handleSubmit = async () => {
    setError('');
    if (!form.name.trim()) { setError('Team name is required!'); return; }
    if (!form.tag.trim()) { setError('Team tag is required!'); return; }
    if (form.tag.length > 6) { setError('Tag must be 6 characters or less!'); return; }
    setLoading(true);
    try {
      const res = await api.post('/teams', { ...form, game: 'Any' });
      if (res.data.success) router.push('/teams');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create team!');
    } finally { setLoading(false); }
  };

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <Link href="/teams" className={styles.back}>
          <ArrowLeft size={15} strokeWidth={2} /> Back
        </Link>
        <div className={styles.header}>
          <h1 className={styles.title}>Create Team</h1>
          <p className={styles.sub}>Start your squad and compete together</p>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.card}>
          <h2 className={styles.card__title}>
            <IconTile icon={Users} color="#00F5FF" size={13} tileSize={24} radius={6} /> Team Info
          </h2>
          <div className={styles.grid}>
            <div className={styles.group}>
              <label className={styles.label}>Team Name *</label>
              <input
                className={styles.input}
                placeholder="e.g. N-10 Wolves"
                value={form.name}
                onChange={e => set('name', e.target.value)}
              />
            </div>
            <div className={styles.group}>
              <label className={styles.label}>
                Team Tag * <span className={styles.hint}>(max 6 chars)</span>
              </label>
              <input
                className={styles.input}
                placeholder="e.g. N10W"
                maxLength={6}
                value={form.tag}
                onChange={e => set('tag', e.target.value.toUpperCase())}
              />
            </div>
            <div className={`${styles.group} ${styles['group--full']}`}>
              <label className={styles.label}>Team Logo URL</label>
              <input
                className={styles.input}
                placeholder="Enter image URL for team logo..."
                value={form.logo}
                onChange={e => set('logo', e.target.value)}
              />
            </div>
            <div className={`${styles.group} ${styles['group--full']}`}>
              <label className={styles.label}>Description</label>
              <textarea
                className={`${styles.input} ${styles.textarea}`}
                placeholder="Tell other players about your team..."
                value={form.description}
                onChange={e => set('description', e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </div>

        <div className={styles.notice}>
          You will automatically become the team <strong>Captain</strong>. 
          You can create <strong>up to 3 teams</strong>. 
          You can invite players after creating the team.
        </div>

        <button className={styles.submit} onClick={handleSubmit} disabled={loading}>
          {loading ? 'Creating...' : <><Plus size={16} strokeWidth={2.5} /> Create Team</>}
        </button>
      </div>
    </div>
  );
}