'use client';

import { useState, useCallback, useRef } from 'react';
import Cropper from 'react-easy-crop';
import { Camera, X, Upload, Check } from 'lucide-react';
import api from '../lib/api';
import styles from './TeamLogoUpload.module.scss';
import { getImageUrl } from '../lib/urlHelper';

interface Props {
  value?: string;
  onChange: (url: string) => void;
}

export default function TeamLogoUpload({ value, onChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    };
    reader.readAsDataURL(file);
  };

  const getCroppedImage = async (): Promise<Blob> => {
    const image = new Image();
    image.src = imageSrc!;
    await new Promise(resolve => { image.onload = resolve; });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const size = 512; // High quality logo size
    canvas.width = size;
    canvas.height = size;

    // Center and rotate
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
      canvas.toBlob(blob => resolve(blob!), 'image/jpeg', 0.95);
    });
  };

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    setUploading(true);
    setError('');
    try {
      const blob = await getCroppedImage();
      const formData = new FormData();
      formData.append('logo', blob, 'team-logo.jpg');

      const res = await api.post('/upload/team-logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        onChange(res.data.logo);
        setImageSrc(null);
      }
    } catch (err: any) {
      console.error('Upload Error:', err);
      setError('Upload failed! Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.upload}>
      {/* Upload Frame */}
      <div 
        className={styles.upload__frame} 
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        {value ? (
          <>
            <img src={getImageUrl(value)} alt="Team Logo" />
            <div className={styles.upload__overlay}>
              <Camera size={20} />
              <span>Change Logo</span>
            </div>
          </>
        ) : (
          <div className={styles.upload__placeholder}>
            <Upload size={24} strokeWidth={1.5} />
            <span>Upload Team Logo</span>
          </div>
        )}
      </div>

      {/* Remove Button */}
      {value && !uploading && (
        <button 
          className={styles.upload__remove} 
          onClick={(e) => { e.stopPropagation(); onChange(''); }}
          title="Remove logo"
        >
          <X size={14} strokeWidth={3} />
        </button>
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
            <h3 className={styles.modal__title}>Adjust Team Logo</h3>

            <div className={styles.modal__crop}>
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={1}
                cropShape="rect"
                showGrid={true}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                onCropComplete={onCropComplete}
              />
            </div>

            <div className={styles.modal__controls}>
              <div className={styles.modal__control}>
                <label>
                  Zoom <span>{Math.round(zoom * 100)}%</span>
                </label>
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
                <label>
                  Rotation <span>{rotation}°</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={360}
                  step={1}
                  value={rotation}
                  onChange={(e) => setRotation(Number(e.target.value))}
                />
              </div>
            </div>

            {error && <p className={styles.modal__error}>❌ {error}</p>}

            <div className={styles.modal__footer}>
              <button
                className={`${styles.modal__btn} ${styles['modal__btn--cancel']}`}
                onClick={() => {
                  setImageSrc(null);
                  setZoom(1);
                  setRotation(0);
                }}
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                className={`${styles.modal__btn} ${styles['modal__btn--save']}`}
                onClick={handleSave}
                disabled={uploading}
              >
                {uploading ? 'Processing...' : <><Check size={16} /> Apply Logo</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
