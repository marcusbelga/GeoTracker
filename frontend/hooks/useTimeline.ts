"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { GeoEvent } from "@/types";
import { TIMELINE_DAYS } from "@/lib/constants";

export interface TimelineDay {
  dateISO: string;
  label: string;         // "Mar 9"
  shortLabel: string;    // "9"
  monthLabel: string;    // "MAR"
  isToday: boolean;
  eventCount: number;
}

function buildDays(events: GeoEvent[]): TimelineDay[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Count events per date
  const countByDate: Record<string, number> = {};
  for (const ev of events) {
    countByDate[ev.event_date] = (countByDate[ev.event_date] ?? 0) + 1;
  }

  const days: TimelineDay[] = [];
  for (let i = TIMELINE_DAYS - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().split("T")[0];
    days.push({
      dateISO: iso,
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      shortLabel: String(d.getDate()),
      monthLabel: d.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
      isToday: i === 0,
      eventCount: countByDate[iso] ?? 0,
    });
  }
  return days;
}

export function useTimeline(selectedDate: string, onDateChange: (d: string) => void, events: GeoEvent[]) {
  const railRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const scrollStartX = useRef(0);

  const days = buildDays(events);

  // Scroll to today / selected on mount
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    // Today is last item; scroll to end
    rail.scrollLeft = rail.scrollWidth;
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    dragStartX.current = e.clientX;
    scrollStartX.current = railRef.current?.scrollLeft ?? 0;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current || !railRef.current) return;
    const delta = dragStartX.current - e.clientX;
    railRef.current.scrollLeft = scrollStartX.current + delta;
  }, []);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const idx = days.findIndex((d) => d.dateISO === selectedDate);
    if (e.key === "ArrowLeft" && idx > 0) onDateChange(days[idx - 1].dateISO);
    if (e.key === "ArrowRight" && idx < days.length - 1) onDateChange(days[idx + 1].dateISO);
  }, [days, selectedDate, onDateChange]);

  return { days, railRef, handlePointerDown, handlePointerMove, handlePointerUp, handleKeyDown };
}
