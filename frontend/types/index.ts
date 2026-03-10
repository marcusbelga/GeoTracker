export interface EventType {
  id: number;
  slug: string;
  label: string;
  icon_name: string;
  description?: string;
}

export interface EventSource {
  id: number;
  slug: string;
  display_name: string;
  article_url: string;
  article_title?: string;
  article_snippet?: string;
  published_at?: string;
}

export interface GeoEvent {
  id: number;
  title: string;
  summary?: string;
  event_date: string;
  lat: number;
  lng: number;
  location_name?: string;
  country?: string;
  event_type: EventType;
  source_count: number;
  is_verified: boolean;
  confidence: number;
  source_url?: string;
  source_slug?: string;
}

export interface GeoEventDetail extends GeoEvent {
  sources: EventSource[];
}

export interface EventsResponse {
  events: GeoEvent[];
  total: number;
  date?: string;
}

export type EventTypeFilter = string; // slug
