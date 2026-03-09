import { EventsResponse, GeoEventDetail, EventType } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchEvents(params: {
  date?: string;
  type?: string;
  verified?: boolean;
  limit?: number;
}): Promise<EventsResponse> {
  const url = new URL(`${API_BASE}/api/v1/events`);
  if (params.date) url.searchParams.set("date", params.date);
  if (params.type) url.searchParams.set("type", params.type);
  if (params.verified !== undefined) url.searchParams.set("verified", String(params.verified));
  if (params.limit) url.searchParams.set("limit", String(params.limit));

  const res = await fetch(url.toString(), { next: { revalidate: 120 } });
  if (!res.ok) throw new Error("Failed to fetch events");
  return res.json();
}

export async function fetchEvent(id: number): Promise<GeoEventDetail> {
  const res = await fetch(`${API_BASE}/api/v1/events/${id}`);
  if (!res.ok) throw new Error(`Event ${id} not found`);
  return res.json();
}

export async function fetchEventTypes(): Promise<EventType[]> {
  const res = await fetch(`${API_BASE}/api/v1/event-types`, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error("Failed to fetch event types");
  return res.json();
}

export async function fetchHealth(): Promise<{ status: string; db_events: number; last_scrape: string | null }> {
  const res = await fetch(`${API_BASE}/api/v1/health`);
  if (!res.ok) throw new Error("Health check failed");
  return res.json();
}
