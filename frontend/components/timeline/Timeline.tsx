"use client";

import { GeoEvent } from "@/types";
import { useTimeline } from "@/hooks/useTimeline";

interface TimelineProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  events: GeoEvent[];
}

export default function Timeline({ selectedDate, onDateChange, events }: TimelineProps) {
  const { days, railRef, handlePointerDown, handlePointerMove, handlePointerUp, handleKeyDown } = useTimeline(
    selectedDate,
    onDateChange,
    events
  );

  return (
    <div
      ref={railRef}
      className="timeline-rail"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="slider"
      aria-label="Select date"
      aria-valuetext={selectedDate}
      style={{ outline: "none" }}
    >
      {days.map((day) => {
        const isSelected = day.dateISO === selectedDate;
        const classes = [
          "timeline-day",
          isSelected ? "is-selected" : "",
          day.isToday ? "is-today" : "",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <button
            key={day.dateISO}
            className={classes}
            onClick={() => onDateChange(day.dateISO)}
            style={{ border: "none", background: "inherit", color: "inherit", cursor: "pointer" }}
            aria-pressed={isSelected}
            title={day.label}
          >
            <span style={{ fontSize: 9, opacity: 0.7, lineHeight: 1 }}>{day.monthLabel}</span>
            <span style={{ fontSize: 14, fontWeight: isSelected || day.isToday ? 700 : 400, lineHeight: 1.2 }}>
              {day.shortLabel}
            </span>
            {day.isToday && (
              <span style={{ fontSize: 8, lineHeight: 1, opacity: 0.8 }}>TODAY</span>
            )}
            {day.eventCount > 0 && (
              <span className="event-count-badge">{day.eventCount}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
