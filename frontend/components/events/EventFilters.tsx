"use client";

import { EventType } from "@/types";

interface EventFiltersProps {
  eventTypes: EventType[];
  activeTypes: string[];
  onTypesChange: (types: string[]) => void;
  verifiedOnly: boolean;
  onVerifiedChange: (v: boolean) => void;
}

export default function EventFilters({
  eventTypes,
  activeTypes,
  onTypesChange,
  verifiedOnly,
  onVerifiedChange,
}: EventFiltersProps) {
  const toggleType = (slug: string) => {
    if (activeTypes.includes(slug)) {
      onTypesChange(activeTypes.filter((t) => t !== slug));
    } else {
      onTypesChange([...activeTypes, slug]);
    }
  };

  return (
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
          marginBottom: 8,
        }}
      >
        Filter events
      </div>

      {/* Event type checkboxes */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
        {eventTypes.map((et) => {
          const isActive = activeTypes.includes(et.slug);
          return (
            <button
              key={et.slug}
              onClick={() => toggleType(et.slug)}
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize: 10,
                padding: "2px 7px",
                border: `1px solid ${isActive ? "var(--color-ink)" : "var(--color-rule)"}`,
                background: isActive ? "var(--color-ink)" : "transparent",
                color: isActive ? "white" : "var(--color-ink-light)",
                cursor: "pointer",
                borderRadius: 2,
                transition: "all 0.1s",
              }}
            >
              {et.label}
            </button>
          );
        })}
        {activeTypes.length > 0 && (
          <button
            onClick={() => onTypesChange([])}
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 10,
              padding: "2px 7px",
              border: "1px solid var(--color-rule)",
              background: "transparent",
              color: "var(--color-ink-faint)",
              cursor: "pointer",
              borderRadius: 2,
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Verified only toggle */}
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          cursor: "pointer",
          fontFamily: "'Courier New', monospace",
          fontSize: 10,
          color: "var(--color-ink-light)",
        }}
      >
        <input
          type="checkbox"
          checked={verifiedOnly}
          onChange={(e) => onVerifiedChange(e.target.checked)}
          style={{ accentColor: "var(--color-verified)" }}
        />
        Verified only (2+ sources)
      </label>
    </div>
  );
}
