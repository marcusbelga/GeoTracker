"use client";

import useSWR from "swr";
import { EventsResponse, GeoEvent } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useEvents(params: {
  date?: string;
  types?: string[];
  verified?: boolean;
}) {
  const searchParams = new URLSearchParams();
  if (params.date) searchParams.set("date", params.date);
  if (params.types?.length) searchParams.set("type", params.types.join(","));
  if (params.verified) searchParams.set("verified", "true");

  const url = `${API_BASE}/api/v1/events?${searchParams.toString()}`;

  const { data, error, isLoading } = useSWR<EventsResponse>(url, fetcher, {
    refreshInterval: 5 * 60 * 1000, // Revalidate every 5 minutes
    revalidateOnFocus: false,
  });

  return {
    events: data?.events ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
  };
}

export function useEventTypes() {
  const { data, error } = useSWR<Array<{ id: number; slug: string; label: string; icon_name: string }>>(
    `${API_BASE}/api/v1/event-types`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );
  return { eventTypes: data ?? [], error };
}

export function useScrapeStatus() {
  const { data } = useSWR(
    `${API_BASE}/api/v1/scrape/status`,
    fetcher,
    { refreshInterval: 60 * 1000 }
  );
  return data;
}
