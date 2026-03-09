"use client";

import React from "react";

interface PinProps {
  size?: number;
  isSelected?: boolean;
}

// ─── Airstrike / Bombing ────────────────────────────────────────────────────
export function AirstrikePinIcon({ size = 32, isSelected }: PinProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Pulsing ring (animation via CSS class pin-airstrike .pulse-ring) */}
      <circle className="pulse-ring" cx="16" cy="16" r="12" fill="none" stroke="#8b1a1a" strokeWidth="1.5" />
      {/* Starburst background */}
      {[0,45,90,135].map((angle) => (
        <rect
          key={angle}
          x="15" y="4" width="2" height="24"
          fill="#8b1a1a"
          transform={`rotate(${angle} 16 16)`}
        />
      ))}
      {/* Center circle */}
      <circle cx="16" cy="16" r="6" fill="#8b1a1a" />
      <circle cx="16" cy="16" r="3" fill="#f7f4ef" />
      {isSelected && <circle cx="16" cy="16" r="14" fill="none" stroke="#8b1a1a" strokeWidth="2" />}
    </svg>
  );
}

// ─── Missile / Drone ────────────────────────────────────────────────────────
export function MissilePinIcon({ size = 32, isSelected }: PinProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle className="pulse-ring" cx="16" cy="16" r="12" fill="none" stroke="#8b1a1a" strokeWidth="1" strokeDasharray="3 3" />
      {/* Teardrop pin */}
      <path d="M16 2C11 2 7 6 7 11C7 17 16 30 16 30C16 30 25 17 25 11C25 6 21 2 16 2Z" fill="#8b1a1a" />
      {/* Missile silhouette */}
      <ellipse cx="16" cy="11" rx="3" ry="6" fill="#f7f4ef" />
      <path d="M13 16 L11 19 L13 18 L13 16Z" fill="#f7f4ef" />
      <path d="M19 16 L21 19 L19 18 L19 16Z" fill="#f7f4ef" />
      {isSelected && <circle cx="16" cy="11" r="10" fill="none" stroke="#8b1a1a" strokeWidth="2" />}
    </svg>
  );
}

// ─── Diplomatic ─────────────────────────────────────────────────────────────
export function DiplomaticPinIcon({ size = 32 }: PinProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Diamond/shield shape */}
      <path d="M16 2L28 16L16 30L4 16Z" fill="#2d5a27" />
      {/* Handshake: two simplified curved hands */}
      <path d="M10 14 Q12 12 16 14 Q20 12 22 14" stroke="#f7f4ef" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M10 18 Q12 16 16 18 Q20 16 22 18" stroke="#f7f4ef" strokeWidth="2" strokeLinecap="round" fill="none" />
      <line x1="16" y1="12" x2="16" y2="20" stroke="#f7f4ef" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ─── Political / Elections ───────────────────────────────────────────────────
export function PoliticalPinIcon({ size = 32 }: PinProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Ballot card shape */}
      <rect x="4" y="5" width="24" height="22" rx="2" fill="#0a0a0a" />
      {/* Ballot slot */}
      <rect x="13" y="3" width="6" height="5" rx="1" fill="#0a0a0a" />
      {/* Checkmark */}
      <path d="M10 16 L14 20 L22 12" stroke="#f7f4ef" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Lines */}
      <line x1="10" y1="23" x2="22" y2="23" stroke="#f7f4ef" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

// ─── Ground Operations ───────────────────────────────────────────────────────
export function GroundOpsPinIcon({ size = 32 }: PinProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Pentagon */}
      <path d="M16 2L29 11L24 27H8L3 11Z" fill="#3d3d3d" />
      {/* Marching border */}
      <path className="march-border" d="M16 2L29 11L24 27H8L3 11Z" fill="none" stroke="#f7f4ef" strokeWidth="1.5" />
      {/* Crossed swords */}
      <line x1="10" y1="10" x2="22" y2="22" stroke="#f7f4ef" strokeWidth="2" strokeLinecap="round" />
      <line x1="22" y1="10" x2="10" y2="22" stroke="#f7f4ef" strokeWidth="2" strokeLinecap="round" />
      {/* Guard */}
      <line x1="12" y1="12" x2="20" y2="12" stroke="#f7f4ef" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12" y1="20" x2="20" y2="20" stroke="#f7f4ef" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ─── Sanctions / Economic ────────────────────────────────────────────────────
export function SanctionsPinIcon({ size = 32 }: PinProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="13" fill="#0a0a0a" />
      {/* Padlock body */}
      <rect x="11" y="16" width="10" height="8" rx="1.5" fill="#f7f4ef" />
      {/* Shackle */}
      <path d="M13 16V13C13 10.8 18 10.8 19 13V16" stroke="#f7f4ef" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Keyhole */}
      <circle cx="16" cy="19.5" r="1.5" fill="#0a0a0a" />
      <rect x="15.3" y="20.5" width="1.4" height="2" fill="#0a0a0a" />
    </svg>
  );
}

// ─── Protest / Civil Unrest ──────────────────────────────────────────────────
export function ProtestPinIcon({ size = 32 }: PinProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="pin-protest">
      {/* Warning triangle */}
      <path d="M16 3L30 28H2L16 3Z" fill="#0a0a0a" />
      {/* 3 person silhouettes */}
      <circle cx="11" cy="18" r="2" fill="#f7f4ef" />
      <circle cx="16" cy="16" r="2" fill="#f7f4ef" />
      <circle cx="21" cy="18" r="2" fill="#f7f4ef" />
      <path d="M9 24 Q11 21 13 24" stroke="#f7f4ef" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M14 24 Q16 21 18 24" stroke="#f7f4ef" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M19 24 Q21 21 23 24" stroke="#f7f4ef" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// ─── Icon registry ───────────────────────────────────────────────────────────
export const PIN_ICONS: Record<string, React.FC<PinProps>> = {
  airstrike: AirstrikePinIcon,
  missile: MissilePinIcon,
  diplomatic: DiplomaticPinIcon,
  political: PoliticalPinIcon,
  "ground-ops": GroundOpsPinIcon,
  sanctions: SanctionsPinIcon,
  protest: ProtestPinIcon,
};

export function getPinIcon(slug: string): React.FC<PinProps> {
  return PIN_ICONS[slug] ?? DiplomaticPinIcon;
}
