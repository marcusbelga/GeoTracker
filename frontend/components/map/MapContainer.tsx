"use client";

import { useEffect, useRef, useCallback } from "react";
import ReactDOM from "react-dom/server";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { GeoEvent } from "@/types";
import { getPinIcon } from "./PinIcons";
import MapPopup from "./MapPopup";
import { MAP_CONFIG } from "./mapStyles";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

interface MapContainerProps {
  events: GeoEvent[];
  selectedEventId: number | null;
  onEventSelect: (event: GeoEvent | null) => void;
}

/** Group events into spatial clusters (≈1 km grid by rounding to 2 decimal places). */
function buildClusters(events: GeoEvent[]): Map<string, GeoEvent[]> {
  const clusters = new Map<string, GeoEvent[]>();
  for (const event of events) {
    const key = `${event.lat.toFixed(2)},${event.lng.toFixed(2)}`;
    if (!clusters.has(key)) clusters.set(key, []);
    clusters.get(key)!.push(event);
  }
  return clusters;
}

/** Evenly space N items around a circle, starting from the top (−90°). */
function radialPositions(count: number, radius: number): { x: number; y: number }[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = ((360 / count) * i - 90) * (Math.PI / 180);
    return {
      x: Math.round(Math.cos(angle) * radius),
      y: Math.round(Math.sin(angle) * radius),
    };
  });
}

export default function MapContainer({ events, selectedEventId, onEventSelect }: MapContainerProps) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapDivRef = useRef<HTMLDivElement>(null);
  const clusterMarkersRef = useRef<Map<string, { marker: mapboxgl.Marker; el: HTMLDivElement }>>(new Map());
  const popupRootRef = useRef<{ root: ReturnType<typeof import("react-dom/client")["createRoot"]>; popup: mapboxgl.Popup } | null>(null);

  /**
   * Tracks which cluster key is "pinned open" (i.e. user clicked a pin in it).
   * Using a ref so we can read the current value inside callbacks without stale closures,
   * and without causing extra re-renders.
   */
  const pinnedClusterKeyRef = useRef<string | null>(null);

  // ── Initialize map once ──────────────────────────────────────────────────
  useEffect(() => {
    if (!mapDivRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapDivRef.current,
      ...MAP_CONFIG,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-left");
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ── Show Mapbox popup for an event ──────────────────────────────────────
  const showPopup = useCallback(
    (event: GeoEvent) => {
      const map = mapRef.current;
      if (!map) return;

      // Tear down previous popup (without triggering its onClose)
      if (popupRootRef.current) {
        popupRootRef.current.root.unmount();
        popupRootRef.current.popup.remove();
        popupRootRef.current = null;
      }

      const container = document.createElement("div");
      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: [0, -20],
        maxWidth: "280px",
      })
        .setLngLat([event.lng, event.lat])
        .setDOMContent(container)
        .addTo(map);

      const { createRoot } = require("react-dom/client");
      const root = createRoot(container);
      root.render(
        <MapPopup
          event={event}
          onClose={() => {
            root.unmount();
            popup.remove();
            popupRootRef.current = null;
            // Unpin the cluster so the radial collapses
            pinnedClusterKeyRef.current = null;
            onEventSelect(null);
          }}
        />
      );

      popupRootRef.current = { root, popup };
    },
    [onEventSelect]
  );

  // ── Build one cluster marker element ────────────────────────────────────
  const createClusterElement = useCallback(
    (clusterEvents: GeoEvent[], clusterKey: string): HTMLDivElement => {
      const container = document.createElement("div");
      const count = clusterEvents.length;

      // A multi-event cluster is "pinned open" if the user clicked a pin inside it.
      // We persist this across the marker rebuild that happens after onEventSelect().
      const isPinned = count > 1 && pinnedClusterKeyRef.current === clusterKey;

      const classes = ["cluster-marker"];
      if (count === 1) classes.push("single");
      if (isPinned) classes.push("is-expanded");
      container.className = classes.join(" ");

      // Max 8 pins in radial display
      const displayEvents = clusterEvents.slice(0, 8);
      const displayCount = displayEvents.length;
      const positions = radialPositions(displayCount, displayCount === 1 ? 0 : 62);
      const midIdx = Math.floor((displayCount - 1) / 2);

      displayEvents.forEach((event, i) => {
        const pinDiv = document.createElement("div");
        pinDiv.className = "cluster-pin";
        pinDiv.title = event.title;

        // Stack offsets (deck-of-cards appearance when collapsed)
        const offset = i - midIdx;
        const stackX = offset * 3;
        const stackY = offset * -2;
        const stackRot = offset * 7;
        const { x: expandX, y: expandY } = positions[i];

        pinDiv.style.cssText = [
          `--stack-x:${stackX}px`,
          `--stack-y:${stackY}px`,
          `--stack-rot:${stackRot}deg`,
          `--expand-x:${expandX}px`,
          `--expand-y:${expandY}px`,
          `--z:${i + 1}`,
        ].join(";");

        const isSelected = event.id === selectedEventId;
        const IconComponent = getPinIcon(event.event_type.slug);
        const typeClass = `pin-${event.event_type.slug}`;

        pinDiv.innerHTML = `<div class="${typeClass}">${ReactDOM.renderToStaticMarkup(
          <IconComponent size={28} isSelected={isSelected} />
        )}</div>`;

        pinDiv.addEventListener("click", (e) => {
          e.stopPropagation();
          // Pin this cluster open BEFORE calling onEventSelect so that when
          // the markers rebuild (triggered by selectedEventId change) the cluster
          // is already marked as expanded.
          pinnedClusterKeyRef.current = clusterKey;
          onEventSelect(event);
          showPopup(event);
        });

        container.appendChild(pinDiv);
      });

      // Count badge for multi-event clusters
      if (count > 1) {
        const badge = document.createElement("div");
        badge.className = "cluster-badge";
        badge.textContent = String(count);
        container.appendChild(badge);
      }

      return container;
    },
    [selectedEventId, onEventSelect, showPopup] // eslint-disable-line
  );

  // ── Sync cluster markers when events / selection changes ─────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Tear down all existing markers
    for (const { marker } of clusterMarkersRef.current.values()) {
      marker.remove();
    }
    clusterMarkersRef.current.clear();

    const clusters = buildClusters(events);

    for (const [, clusterEvents] of clusters) {
      const avgLat = clusterEvents.reduce((s, e) => s + e.lat, 0) / clusterEvents.length;
      const avgLng = clusterEvents.reduce((s, e) => s + e.lng, 0) / clusterEvents.length;
      const clusterKey = `${avgLat.toFixed(2)},${avgLng.toFixed(2)}`;

      const el = createClusterElement(clusterEvents, clusterKey);
      const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat([avgLng, avgLat])
        .addTo(map);

      clusterMarkersRef.current.set(clusterKey, { marker, el });
    }
  }, [events, selectedEventId, createClusterElement]);

  // ── Fly to selected event ────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedEventId) return;

    const event = events.find((e) => e.id === selectedEventId);
    if (!event) return;

    map.flyTo({
      center: [event.lng, event.lat],
      zoom: Math.max(map.getZoom(), 6),
      duration: 800,
      essential: true,
    });
  }, [selectedEventId, events]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <div ref={mapDivRef} id="map-root" />
    </div>
  );
}
