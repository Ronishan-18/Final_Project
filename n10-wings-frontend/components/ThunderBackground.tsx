'use client';

import { useEffect, useState, useCallback } from 'react';

const BOLT_PATHS = [
  "M 150 0 L 160 100 L 130 150 L 170 250 L 140 320 L 150 500",
  "M 100 0 L 120 80 L 80 160 L 140 240 L 100 350 L 110 500",
  "M 200 0 L 180 120 L 220 200 L 170 300 L 200 420 L 190 500",
  "M 50 0 L 70 150 L 30 250 L 80 400 L 60 500",
];

export default function ThunderBackground() {
  const [mounted, setMounted] = useState(false);
  const [flashKey, setFlashKey] = useState(0);
  const [bolt, setBolt] = useState<{ path: string; left: string; top: string; key: number } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const triggerFlash = useCallback(() => {

    setFlashKey(prev => prev + 1);
  }, []);

  const triggerBolt = useCallback(() => {
    const randomPath = BOLT_PATHS[Math.floor(Math.random() * BOLT_PATHS.length)];
    const randomLeft = `${Math.floor(Math.random() * 80)}%`;
    const randomTop = `${Math.floor(Math.random() * 30)}%`;
    
    setBolt({
      path: randomPath,
      left: randomLeft,
      top: randomTop,
      key: Date.now()
    });
    
    console.log('⚡ Lightning bolt triggered');
    triggerFlash();
  }, [triggerFlash]);

  useEffect(() => {
    // Random interval for flashes (ambient) - More frequent now
    const flashTimer = setInterval(() => {
      if (Math.random() > 0.5) triggerFlash();
    }, 3000);

    // Random interval for bolts (rare) - More frequent now
    const boltTimer = setInterval(() => {
      if (Math.random() > 0.6) triggerBolt();
    }, 5000);


    return () => {
      clearInterval(flashTimer);
      clearInterval(boltTimer);
    };
  }, [triggerFlash, triggerBolt]);

  if (!mounted) return null;

  return (
    <div className="thunder_bg">

      {/* Ambient Flash */}
      <div 
        key={`flash-${flashKey}`}
        className="thunder_bg__flash"
        style={{ animation: flashKey > 0 ? 'lightning-flash 0.6s ease-out forwards' : 'none' }}
      />

      {/* Lightning Bolt */}
      {bolt && (
        <div 
          key={`bolt-${bolt.key}`}
          className="thunder_bg__bolt"
          style={{ 
            left: bolt.left, 
            top: bolt.top,
            animation: 'lightning-bolt 1.5s ease-out forwards'
          }}
        >
          <svg viewBox="0 0 300 500" preserveAspectRatio="none">
            <path d={bolt.path} />
          </svg>
        </div>
      )}
    </div>
  );
}
