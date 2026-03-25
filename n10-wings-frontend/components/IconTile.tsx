'use client';

import { LucideIcon } from 'lucide-react';

interface IconTileProps {
  icon: LucideIcon;
  color?: string;
  size?: number;
  tileSize?: number;
  radius?: number;
}

// Duotone tile: colored background square + icon on top
export default function IconTile({
  icon: Icon,
  color = '#00F5FF',
  size = 22,
  tileSize = 48,
  radius = 12,
}: IconTileProps) {
  // Convert hex to rgba for background
  const hex = color.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  return (
    <div
      style={{
        width: tileSize,
        height: tileSize,
        borderRadius: radius,
        background: `rgba(${r},${g},${b},0.15)`,
        border: `1px solid rgba(${r},${g},${b},0.25)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Icon size={size} color={color} strokeWidth={1.75} />
    </div>
  );
}