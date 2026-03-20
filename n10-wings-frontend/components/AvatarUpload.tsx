'use client';

import { useState, useCallback, useRef } from 'react';
import Cropper from 'react-easy-crop';
import api from '../lib/api';
import styles from './AvatarUpload.module.scss';

interface Props {
  currentAvatar?: string;
  username?: string;
  onUpdate: (newAvatar: string) => void;
}

export default function AvatarUpload({ currentAvatar, username, onUpdate }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const onCropComplete = useCallback((_: any, croppedPixels: any) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('File too large! Max 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setShowMenu(false);
    };
    reader.readAsDataURL(file);
  };

  const getCroppedImage = async (): Promise<Blob> => {
    const image = new Image();
    image.src = imageSrc!;

    await new Promise(resolve => { image.onload = resolve; });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const size = 400;
    canvas.width = size;
    canvas.height = size;

    ctx.translate(size / 2, size / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-size / 2, -size / 2);

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    ctx.drawImage(
      image,
      croppedAreaPixels.x * scaleX,
      croppedAreaPixels.y * scaleY,
      croppedAreaPixels.width * scaleX,
      croppedAreaPixels.height * scaleY,
      0, 0, size, size
    );

    return new Promise(resolve => {
      canvas.toBlob(blob => resolve(blob!), 'image/jpeg', 0.9);
    });
  };

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    setUploading(true);
    setError('');
    try {
      const blob = await getCroppedImage();
      const formData = new FormData();
      formData.append('avatar', blob, 'avatar.jpg');

      const res = await api.post('/upload/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        onUpdate(res.data.avatar);
        setImageSrc(null);
      }
    } catch {
      setError('Upload failed! Try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.put('/profile/me', { avatar: null });
      onUpdate('');
      setShowMenu(false);
    } catch {
      setError('Failed to remove avatar!');
    }
  };

  return (
    <div className={styles.avatar}>

      {/* Avatar Frame */}
      <div
        className={styles.avatar__frame}
        onClick={() => setShowMenu(!showMenu)}
      >
        {currentAvatar ? (
          <img src={currentAvatar} alt="avatar" />
        ) : (
          <div className={styles.avatar__placeholder}>
            {username?.charAt(0).toUpperCase() || '🎮'}
          </div>
        )}
        <div className={styles.avatar__overlay}>
          <span className={styles.avatar__camera}>📷</span>
        </div>
      </div>

      {/* Popup Menu */}
      {showMenu && (
        <div className={styles.avatar__menu}>
          <button
            className={styles.avatar__menu_item}
            onClick={() => {
              setShowMenu(false);
              fileInputRef.current?.click();
            }}
          >
            📁 Upload Photo
          </button>
          {currentAvatar && (
            <button
              className={`${styles.avatar__menu_item} ${styles['avatar__menu_item--delete']}`}
              onClick={handleDelete}
            >
              🗑️ Remove Photo
            </button>
          )}
          <button
            className={`${styles.avatar__menu_item} ${styles['avatar__menu_item--cancel']}`}
            onClick={() => setShowMenu(false)}
          >
            ✕ Cancel
          </button>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Crop Modal */}
      {imageSrc && (
        <div className={styles.modal}>
          <div className={styles.modal__box}>
            <h3 className={styles.modal__title}>Adjust Photo</h3>

            {/* Crop Area */}
            <div className={styles.modal__crop}>
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                onCropComplete={onCropComplete}
              />
            </div>

            {/* Controls */}
            <div className={styles.modal__controls}>
              <div className={styles.modal__control}>
                <label>🔍 Zoom</label>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.01}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                />
              </div>
              <div className={styles.modal__control}>
                <label>🔄 Rotate</label>
                <input
                  type="range"
                  min={-180}
                  max={180}
                  step={1}
                  value={rotation}
                  onChange={(e) => setRotation(Number(e.target.value))}
                />
              </div>
            </div>

            {error && <p className={styles.modal__error}>❌ {error}</p>}

            {/* Buttons */}
            <div className={styles.modal__btns}>
              <button
                className={styles.modal__cancel}
                onClick={() => {
                  setImageSrc(null);
                  setZoom(1);
                  setRotation(0);
                }}
              >
                Cancel
              </button>
              <button
                className={styles.modal__save}
                onClick={handleSave}
                disabled={uploading}
              >
                {uploading ? 'Saving...' : '✅ Save Photo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}