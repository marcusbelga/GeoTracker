"use client";

import { GeoEvent } from "@/types";
import VerificationBadge from "@/components/ui/VerificationBadge";
import { SOURCE_ORIENTATION, PoliticalOrientation } from "@/lib/constants";

interface EventCardProps {
  event: GeoEvent;
  isSelected: boolean;
  onClick: () => void;
}

const ORIENTATION_STYLE: Record<
  PoliticalOrientation,
  { bg: string; label: string }
> = {
  left:   { bg: "#1a3a8b", label: "LEFT"   },
  center: { bg: "#1a1a1a", label: "CENTER" },
  right:  { bg: "#8b1a1a", label: "RIGHT"  },
};

function PoliticalBadge({ slug }: { slug?: string }) {
  if (!slug) return null;
  const orientation = SOURCE_ORIENTATION[slug];
  if (!orientation) return null;
  const { bg, label } = ORIENTATION_STYLE[orientation];
  return (
    <span
      style={{
        background: bg,
        color: "#f7f4ef",
        fontFamily: "'Courier New', monospace",
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.06em",
        padding: "2px 5px",
        borderRadius: 3,
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {label}
    </span>
  );
}

export default function EventCard({ event, isSelected, onClick }: EventCardProps) {
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <div
      style={{
        borderBottom: "1px solid var(--color-rule)",
        borderLeft: isSelected ? "3px solid var(--color-ink)" : "3px solid transparent",
        background: isSelected ? "var(--color-paper-dark)" : "transparent",
        transition: "background 0.1s",
        position: "relative",
      }}
    >
      {/* Main clickable area — selects on map */}
      <button
        onClick={onClick}
        style={{
          width: "100%",
          padding: "10px 14px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          display: "block",
          paddingRight: event.source_url ? "36px" : "14px",
        }}
      >
        {/* Event type label + date */}
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

        {/* Location + verification + political badge */}
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
          <PoliticalBadge slug={event.source_slug} />
        </div>
      </button>

      {/* ↗ external link — opens source article in new tab */}
      {event.source_url && (
        <a
          href={event.source_url}
          target="_blank"
          rel="noopener noreferrer"
          title="Open source article"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            width: "22px",
            height: "22px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--color-ink-faint)",
            fontFamily: "'Courier New', monospace",
            fontSize: 13,
            textDecoration: "none",
            borderRadius: "2px",
            border: "1px solid transparent",
            transition: "border-color 0.15s, color 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--color-rule)";
            (e.currentTarget as HTMLAnchorElement).style.color = "var(--color-ink)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.borderColor = "transparent";
            (e.currentTarget as HTMLAnchorElement).style.color = "var(--color-ink-faint)";
          }}
        >
          ↗
        </a>
      )}
    </div>
  );
}
