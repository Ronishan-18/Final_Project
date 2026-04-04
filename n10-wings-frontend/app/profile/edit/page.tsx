'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Select from 'react-select';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { Country, City } from 'country-state-city';
import api from '../../../lib/api';
import AvatarUpload from '../../../components/AvatarUpload';
import styles from './edit.module.scss';

export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [avatar, setAvatar] = useState('');
  const [username, setUsername] = useState('');

  const [formData, setFormData] = useState({
    // Account Information
    first_name: '',
    last_name: '',
    email: '', // Read-only
    phone: '',
    date_of_birth: '',
    gender: '',
    nic_passport: '',

    // Personal Information
    address: '',
    country: '',
    city: '',
    nickname: '',
    bio: '',

    // Social Media Links (Kept as they are distinct from Gaming Identities)
    social_facebook: '',
    social_instagram: '',
    social_youtube: '',
    social_twitter: '',
    social_google: '',
    social_steam: '',
    social_discord: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) { router.push('/login'); return; }

        const res = await api.get('/profile/me');
        if (res.data.success) {
          const { user, profile } = res.data;
          setAvatar(profile?.avatar || '');
          setUsername(user.username);

          setFormData({
            first_name: profile?.first_name || '',
            last_name: profile?.last_name || '',
            email: user.email || '',
            phone: profile?.phone || '',
            date_of_birth: profile?.date_of_birth?.split('T')[0] || '',
            gender: profile?.gender || '',
            nic_passport: profile?.nic_passport || '',
            address: profile?.address || '',
            country: profile?.country || '',
            city: profile?.city || '',
            nickname: profile?.nickname || '',
            bio: profile?.bio || '',
            social_facebook: profile?.social_facebook || '',
            social_instagram: profile?.social_instagram || '',
            social_youtube: profile?.social_youtube || '',
            social_twitter: profile?.social_twitter || '',
            social_google: profile?.social_google || '',
            social_steam: profile?.social_steam || '',
            social_discord: profile?.social_discord || '',
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

  const validate = () => {
    if (!formData.first_name) return 'First Name is required';
    if (formData.phone && formData.phone.length < 10) return 'Invalid phone number format';
    if (formData.nic_passport && formData.nic_passport.length < 5) return 'Invalid NIC/Passport number';
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) { setError(err); return; }

    setSaving(true);
    setError('');
    const token = localStorage.getItem('token');
    try {
      await api.put('/profile/me', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Update failed!');
    } finally {
      setSaving(false);
    }
  };

  const set = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const countries = Country.getAllCountries().map(c => ({
    value: c.isoCode,
    label: c.name
  }));

  const currentCountryObj = Country.getAllCountries().find(c => c.name === formData.country || c.isoCode === formData.country);
  const currentCountryCode = currentCountryObj?.isoCode || '';

  const cities = currentCountryCode 
    ? City.getCitiesOfCountry(currentCountryCode)?.map(c => ({
        value: c.name,
        label: c.name
      })) || []
    : [];

  const genderOptions = [
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' },
    { value: 'Other', label: 'Other' },
    { value: 'Prefer not to say', label: 'Prefer not to say' }
  ];

  const selectStyles = {
    control: (base: any, state: any) => ({
      ...base,
      background: '#0D0D12',
      borderColor: state.isFocused ? '#00F5FF' : 'rgba(255,255,255,0.05)',
      borderRadius: '4px',
      padding: '0.3rem',
      color: '#ffffff',
      boxShadow: 'none',
      minHeight: '48px',
      '&:hover': {
        borderColor: 'rgba(255,255,255,0.1)',
      }
    }),
    menu: (base: any) => ({
      ...base,
      background: '#12121A',
      border: '1px solid rgba(255,255,255,0.1)',
      zIndex: 100,
    }),
    option: (base: any, state: any) => ({
      ...base,
      background: state.isSelected ? '#00F5FF' : (state.isFocused ? 'rgba(0,245,255,0.1)' : 'transparent'),
      color: state.isSelected ? '#0A0A0F' : '#ffffff',
      cursor: 'pointer',
      '&:active': {
        background: 'rgba(0,245,255,0.2)',
      }
    }),
    singleValue: (base: any) => ({
      ...base,
      color: '#ffffff',
    }),
    input: (base: any) => ({
      ...base,
      color: '#ffffff',
    }),
    placeholder: (base: any) => ({
        ...base,
        color: '#4B5563',
    })
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
            <p className={styles.edit__sub}>Update your community information</p>
          </div>
          <Link href="/dashboard" className={styles.edit__back}>
            ← Back to Dashboard
          </Link>
        </div>

        {/* Success / Error Messages */}
        {success && <div className={styles.edit__success}>✅ Profile updated! Redirecting...</div>}
        {error && <div className={styles.edit__error}>❌ {error}</div>}

        {/* ── ACCOUNT INFORMATION ── */}
        <div className={styles.edit__section}>
          <div className={styles.edit__section_header}>
             <h2 className={styles.edit__section_title}>ACCOUNT INFORMATION</h2>
             <p className={styles.edit__section_hint}>Essential account details and identification</p>
          </div>
          
          <div className={styles.edit__grid}>
            <div className={styles.edit__group}>
              <label className={styles.edit__label}>FIRST NAME</label>
              <input
                type="text"
                className={styles.edit__input}
                value={formData.first_name}
                onChange={(e) => set('first_name', e.target.value)}
                placeholder="Enter First Name"
              />
            </div>
            <div className={styles.edit__group}>
              <label className={styles.edit__label}>LAST NAME</label>
              <input
                type="text"
                className={styles.edit__input}
                value={formData.last_name}
                onChange={(e) => set('last_name', e.target.value)}
                placeholder="Enter Last Name"
              />
            </div>
            <div className={styles.edit__group}>
              <label className={styles.edit__label}>EMAIL ADDRESS</label>
              <input
                type="email"
                className={`${styles.edit__input} ${styles.edit__inputDisabled}`}
                value={formData.email}
                readOnly
              />
            </div>
            <div className={styles.edit__group}>
              <label className={styles.edit__label}>MOBILE NUMBER</label>
              <div className={styles.phoneInputContainer}>
                <PhoneInput
                  country={'lk'}
                  value={formData.phone}
                  onChange={(val) => set('phone', val)}
                  enableSearch={true}
                />
              </div>
            </div>
            <div className={styles.edit__group}>
              <label className={styles.edit__label}>DATE OF BIRTH</label>
              <input
                type="date"
                className={styles.edit__input}
                value={formData.date_of_birth}
                onChange={(e) => set('date_of_birth', e.target.value)}
              />
            </div>
            <div className={styles.edit__group}>
              <label className={styles.edit__label}>GENDER</label>
              <div className={styles.selectWrapper}>
                <Select
                  options={genderOptions}
                  styles={selectStyles}
                  value={genderOptions.find(o => o.value === formData.gender)}
                  onChange={(val) => set('gender', val?.value || '')}
                  placeholder="Please Select"
                />
              </div>
            </div>
            <div className={`${styles.edit__group} ${styles['edit__group--full']}`}>
              <label className={styles.edit__label}>NIC/ PASSPORT (OPTIONAL)</label>
              <input
                type="text"
                className={styles.edit__input}
                value={formData.nic_passport}
                onChange={(e) => set('nic_passport', e.target.value)}
                placeholder="Enter ID number"
              />
            </div>
          </div>
        </div>

        {/* ── PERSONAL INFORMATION ── */}
        <div className={styles.edit__section}>
          <div className={styles.edit__section_header}>
            <h2 className={styles.edit__section_title}>PERSONAL INFORMATION</h2>
            <p className={styles.edit__section_hint}>Bio, location and other personal details</p>
          </div>
          
          <div className={styles.edit__grid}>
            <div className={`${styles.edit__group} ${styles['edit__group--full']}`}>
              <label className={styles.edit__label}>ADDRESS (OPTIONAL)</label>
              <textarea
                className={`${styles.edit__input} ${styles.edit__textarea}`}
                value={formData.address}
                onChange={(e) => set('address', e.target.value)}
                placeholder="Enter full address"
                rows={2}
              />
            </div>
            <div className={styles.edit__group}>
              <label className={styles.edit__label}>COUNTRY</label>
              <div className={styles.selectWrapper}>
                <Select
                  options={countries}
                  styles={selectStyles}
                  value={countries.find(c => c.label === formData.country || c.value === formData.country)}
                  onChange={(val) => {
                    set('country', val?.label || '');
                    set('city', '');
                  }}
                  placeholder="Please Select"
                />
              </div>
            </div>
            <div className={styles.edit__group}>
              <label className={styles.edit__label}>CITY</label>
              <div className={styles.selectWrapper}>
                <Select
                  options={cities}
                  styles={selectStyles}
                  value={cities.find(c => c.value === formData.city)}
                  onChange={(val) => set('city', val?.value || '')}
                  placeholder="Please Select"
                  isDisabled={!formData.country}
                />
              </div>
            </div>
            <div className={styles.edit__group}>
              <label className={styles.edit__label}>NICKNAME</label>
              <input
                type="text"
                className={styles.edit__input}
                value={formData.nickname}
                onChange={(e) => set('nickname', e.target.value)}
                placeholder="How should people call you?"
              />
            </div>
            <div className={styles.edit__group}>
               <label className={styles.edit__label}>PROFILE PICTURE</label>
               <AvatarUpload
                 currentAvatar={avatar}
                 username={username}
                 onUpdate={(newAvatar) => setAvatar(newAvatar)}
               />
            </div>
            <div className={`${styles.edit__group} ${styles['edit__group--full']}`}>
              <label className={styles.edit__label}>BIO / ABOUT ME (OPTIONAL)</label>
              <textarea
                className={`${styles.edit__input} ${styles.edit__textarea}`}
                value={formData.bio}
                onChange={(e) => set('bio', e.target.value)}
                placeholder="Tell the community about yourself..."
                rows={4}
              />
            </div>
          </div>
        </div>

        {/* ── SOCIAL MEDIA LINKS ── */}
        <div className={styles.edit__section}>
          <div className={styles.edit__section_header}>
            <h2 className={styles.edit__section_title}>SOCIAL MEDIA LINKS</h2>
            <p className={styles.edit__section_hint}>Connect your social profiles to your gaming account</p>
          </div>
          
          <div className={styles.edit__grid}>
            <div className={styles.edit__group}>
              <label className={styles.edit__label}>FACEBOOK PROFILE</label>
              <input
                type="text"
                className={styles.edit__input}
                value={formData.social_facebook}
                onChange={(e) => set('social_facebook', e.target.value)}
                placeholder="https://facebook.com/your-username"
              />
            </div>
            <div className={styles.edit__group}>
              <label className={styles.edit__label}>INSTAGRAM USERNAME</label>
              <input
                type="text"
                className={styles.edit__input}
                value={formData.social_instagram}
                onChange={(e) => set('social_instagram', e.target.value)}
                placeholder="your_handle"
              />
            </div>
            <div className={styles.edit__group}>
              <label className={styles.edit__label}>YOUTUBE CHANNEL</label>
              <input
                type="text"
                className={styles.edit__input}
                value={formData.social_youtube}
                onChange={(e) => set('social_youtube', e.target.value)}
                placeholder="https://youtube.com/@yourchannel"
              />
            </div>
            <div className={styles.edit__group}>
              <label className={styles.edit__label}>TWITTER / X HANDLE</label>
              <input
                type="text"
                className={styles.edit__input}
                value={formData.social_twitter}
                onChange={(e) => set('social_twitter', e.target.value)}
                placeholder="@yourhandle"
              />
            </div>
            <div className={styles.edit__group}>
              <label className={styles.edit__label}>GOOGLE PROFILE</label>
              <input
                type="text"
                className={styles.edit__input}
                value={formData.social_google}
                onChange={(e) => set('social_google', e.target.value)}
                placeholder="Google profile link"
              />
            </div>
            <div className={styles.edit__group}>
              <label className={styles.edit__label}>STEAM LINK</label>
              <input
                type="text"
                className={styles.edit__input}
                value={formData.social_steam}
                onChange={(e) => set('social_steam', e.target.value)}
                placeholder="Steam profile link"
              />
            </div>
            <div className={styles.edit__group}>
              <label className={styles.edit__label}>DISCORD ID</label>
              <input
                type="text"
                className={styles.edit__input}
                value={formData.social_discord}
                onChange={(e) => set('social_discord', e.target.value)}
                placeholder="Username#0000"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className={styles.edit__actions}>
          <button
            className={styles.edit__save}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'SAVING CHANGES...' : 'SAVE CHANGES'}
          </button>
        </div>

      </div>
    </div>
  );
}