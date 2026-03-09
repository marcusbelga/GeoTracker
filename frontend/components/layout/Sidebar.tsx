"use client";

import { GeoEvent, EventType } from "@/types";
import EventCard from "@/components/events/EventCard";
import EventFilters from "@/components/events/EventFilters";
import { useScrapeStatus } from "@/hooks/useEvents";

interface SidebarProps {
  events: GeoEvent[];
  eventTypes: EventType[];
  selectedEventId: number | null;
  onEventSelect: (event: GeoEvent | null) => void;
  activeTypes: string[];
  onTypesChange: (types: string[]) => void;
  verifiedOnly: boolean;
  onVerifiedChange: (v: boolean) => void;
  isLoading: boolean;
  selectedDate: string;
}

export default function Sidebar({
  events,
  eventTypes,
  selectedEventId,
  onEventSelect,
  activeTypes,
  onTypesChange,
  verifiedOnly,
  onVerifiedChange,
  isLoading,
  selectedDate,
}: SidebarProps) {
  const scrapeStatus = useScrapeStatus();

  const formatRelativeTime = (iso: string | null | undefined): string => {
    if (!iso) return "Never";
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  };

  const formattedDate = new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="sidebar" style={{ height: "100%" }}>
      {/* Sidebar header */}
      <div
        style={{
          padding: "10px 14px",
          borderBottom: "1px solid var(--color-rule)",
          background: "var(--color-paper-dark)",
        }}
      >
        <div
          style={{
            fontFamily: "'Courier New', monospace",
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "var(--color-ink-faint)",
            marginBottom: 2,
          }}
        >
          Events for
        </div>
        <div
          style={{
            fontFamily: "Georgia, serif",
            fontSize: 14,
            fontWeight: 700,
            color: "var(--color-ink)",
          }}
        >
          {formattedDate}
        </div>
      </div>

      {/* Filters */}
      <EventFilters
        eventTypes={eventTypes}
        activeTypes={activeTypes}
        onTypesChange={onTypesChange}
        verifiedOnly={verifiedOnly}
        onVerifiedChange={onVerifiedChange}
      />

      {/* Event list */}
      <div className="event-list">
        {isLoading && (
          <div style={{ padding: "20px", textAlign: "center" }}>
            <div className="loading-dots"><span /><span /><span /></div>
          </div>
        )}

        {!isLoading && events.length === 0 && (
          <div
            style={{
              padding: "24px 14px",
              textAlign: "center",
              fontFamily: "Georgia, serif",
              fontSize: 13,
              color: "var(--color-ink-faint)",
              fontStyle: "italic",
            }}
          >
            No events recorded for this date.
          </div>
        )}

        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            isSelected={event.id === selectedEventId}
            onClick={() => onEventSelect(event.id === selectedEventId ? null : event)}
          />
        ))}
      </div>

      {/* Status bar */}
      <div
        style={{
          padding: "8px 14px",
          borderTop: "1px solid var(--color-rule)",
          background: "var(--color-paper-dark)",
          fontFamily: "'Courier New', monospace",
          fontSize: 10,
          color: "var(--color-ink-faint)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <span>Updated: {formatRelativeTime(scrapeStatus?.last_run_at)}</span>
        <span>{scrapeStatus?.events_in_db ?? 0} total events</span>
      </div>
    </div>
  );
}
