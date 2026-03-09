"use client";

import { GeoEvent } from "@/types";
import VerificationBadge from "@/components/ui/VerificationBadge";

interface MapPopupProps {
  event: GeoEvent;
  onClose: () => void;
}

export default function MapPopup({ event, onClose }: MapPopupProps) {
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <div className="map-popup">
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: 6,
          right: 8,
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: 16,
          color: "var(--color-ink-faint)",
          lineHeight: 1,
        }}
        aria-label="Close"
      >
        ×
      </button>

      {/* Event type label */}
      <div
        style={{
          fontFamily: "'Courier New', monospace",
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--color-ink-faint)",
          marginBottom: 4,
        }}
      >
        {event.event_type.label}
      </div>

      {/* Title */}
      <h4>{event.title}</h4>

      {/* Location + date */}
      <div
        style={{
          fontFamily: "'Courier New', monospace",
          fontSize: 10,
          color: "var(--color-ink-faint)",
          marginBottom: 8,
          display: "flex",
          gap: 8,
        }}
      >
        {event.location_name && <span>{event.location_name}</span>}
        <span>{formatDate(event.event_date)}</span>
      </div>

      {/* Verification + source count */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <VerificationBadge isVerified={event.is_verified} sourceCount={event.source_count} />
      </div>
    </div>
  );
}
