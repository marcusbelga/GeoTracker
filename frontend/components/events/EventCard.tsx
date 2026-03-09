"use client";

import { GeoEvent } from "@/types";
import VerificationBadge from "@/components/ui/VerificationBadge";

interface EventCardProps {
  event: GeoEvent;
  isSelected: boolean;
  onClick: () => void;
}

export default function EventCard({ event, isSelected, onClick }: EventCardProps) {
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        padding: "10px 14px",
        borderBottom: "1px solid var(--color-rule)",
        background: isSelected ? "var(--color-paper-dark)" : "transparent",
        border: "none",
        borderLeft: isSelected ? "3px solid var(--color-ink)" : "3px solid transparent",
        cursor: "pointer",
        textAlign: "left",
        transition: "background 0.1s",
        display: "block",
      }}
    >
      {/* Event type label */}
      <div
        style={{
          fontFamily: "'Courier New', monospace",
          fontSize: 9,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "var(--color-ink-faint)",
          marginBottom: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span>{event.event_type.label}</span>
        <span>{formatDate(event.event_date)}</span>
      </div>

      {/* Title */}
      <div
        style={{
          fontFamily: "Georgia, serif",
          fontSize: 13,
          fontWeight: isSelected ? 700 : 400,
          lineHeight: 1.35,
          color: "var(--color-ink)",
          marginBottom: 6,
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {event.title}
      </div>

      {/* Location + verification */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        {event.location_name && (
          <span
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 10,
              color: "var(--color-ink-faint)",
            }}
          >
            {event.location_name}
          </span>
        )}
        <VerificationBadge isVerified={event.is_verified} sourceCount={event.source_count} />
      </div>
    </button>
  );
}
