"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Header from "@/components/layout/Header";
import Timeline from "@/components/timeline/Timeline";
import Sidebar from "@/components/layout/Sidebar";
import { useEvents, useEventTypes } from "@/hooks/useEvents";
import { GeoEvent } from "@/types";

// MapContainer must be dynamically imported (no SSR) – Mapbox uses window
const MapContainer = dynamic(() => import("@/components/map/MapContainer"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full" style={{ background: "#1a1a2e" }}>
      <div className="loading-dots text-center">
        <span /><span /><span />
      </div>
    </div>
  ),
});

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

export default function HomePage() {
  const [selectedDate, setSelectedDate] = useState<string>(todayISO());
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [activeTypes, setActiveTypes] = useState<string[]>([]);
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const { events, total, isLoading } = useEvents({
    date: selectedDate,
    types: activeTypes,
    verified: verifiedOnly || undefined,
  });

  const { eventTypes } = useEventTypes();

  const handleEventSelect = useCallback((event: GeoEvent | null) => {
    setSelectedEventId(event?.id ?? null);
  }, []);

  const handleDateChange = useCallback((date: string) => {
    setSelectedDate(date);
    setSelectedEventId(null);
  }, []);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: "auto auto 1fr",
        gridTemplateColumns: "1fr 360px",
        gridTemplateAreas: `
          "header  header"
          "timeline timeline"
          "map     sidebar"
        `,
        height: "100vh",
        overflow: "hidden",
        background: "var(--color-paper)",
      }}
    >
      {/* ─── Masthead ─── */}
      <div style={{ gridArea: "header" }}>
        <Header eventCount={total} isLoading={isLoading} />
      </div>

      {/* ─── Timeline ─── */}
      <div
        style={{
          gridArea: "timeline",
          borderTop: "3px solid var(--color-ink)",
          borderBottom: "1px solid var(--color-rule)",
          background: "var(--color-paper)",
        }}
      >
        <Timeline
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
          events={events}
        />
      </div>

      {/* ─── Map ─── */}
      <div style={{ gridArea: "map", position: "relative", overflow: "hidden" }}>
        <MapContainer
          events={events}
          selectedEventId={selectedEventId}
          onEventSelect={handleEventSelect}
        />
      </div>

      {/* ─── Sidebar ─── */}
      <div style={{ gridArea: "sidebar" }}>
        <Sidebar
          events={events}
          eventTypes={eventTypes}
          selectedEventId={selectedEventId}
          onEventSelect={handleEventSelect}
          activeTypes={activeTypes}
          onTypesChange={setActiveTypes}
          verifiedOnly={verifiedOnly}
          onVerifiedChange={setVerifiedOnly}
          isLoading={isLoading}
          selectedDate={selectedDate}
        />
      </div>
    </div>
  );
}
