"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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

export default function MapContainer({ events, selectedEventId, onEventSelect }: MapContainerProps) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapDivRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<number, { marker: mapboxgl.Marker; el: HTMLDivElement }>>(new Map());
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const [popupEvent, setPopupEvent] = useState<GeoEvent | null>(null);
  const [popupLngLat, setPopupLngLat] = useState<[number, number] | null>(null);

  // Initialize map once
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

  // Create HTML element for a pin
  const createPinElement = useCallback((event: GeoEvent, isSelected: boolean): HTMLDivElement => {
    const el = document.createElement("div");
    el.className = `map-marker${isSelected ? " is-selected" : ""}`;

    const IconComponent = getPinIcon(event.event_type.slug);
    const typeClass = `pin-${event.event_type.slug}`;

    el.innerHTML = `<div class="${typeClass}">${ReactDOM.renderToStaticMarkup(
      <IconComponent size={32} isSelected={isSelected} />
    )}</div>`;

    return el;
  }, []);

  // Sync markers when events change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const currentIds = new Set(events.map((e) => e.id));
    const existingIds = new Set(markersRef.current.keys());

    // Remove stale markers
    for (const id of existingIds) {
      if (!currentIds.has(id)) {
        markersRef.current.get(id)?.marker.remove();
        markersRef.current.delete(id);
      }
    }

    // Add or update markers
    for (const event of events) {
      const isSelected = event.id === selectedEventId;

      if (markersRef.current.has(event.id)) {
        // Update selected class
        const { el } = markersRef.current.get(event.id)!;
        el.className = `map-marker${isSelected ? " is-selected" : ""}`;
        continue;
      }

      const el = createPinElement(event, isSelected);

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onEventSelect(event);
        setPopupEvent(event);
        setPopupLngLat([event.lng, event.lat]);
      });

      const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat([event.lng, event.lat])
        .addTo(map);

      markersRef.current.set(event.id, { marker, el });
    }
  }, [events, selectedEventId, createPinElement, onEventSelect]);

  // Show/hide popup
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old popup
    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
    }

    if (!popupEvent || !popupLngLat) return;

    const container = document.createElement("div");
    const popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: [0, -20],
      maxWidth: "280px",
    })
      .setLngLat(popupLngLat)
      .setDOMContent(container)
      .addTo(map);

    // Render React component into popup container
    const { createRoot } = require("react-dom/client");
    const root = createRoot(container);
    root.render(
      <MapPopup
        event={popupEvent}
        onClose={() => {
          popup.remove();
          setPopupEvent(null);
          setPopupLngLat(null);
          onEventSelect(null);
        }}
      />
    );

    popupRef.current = popup;

    return () => {
      root.unmount();
      popup.remove();
    };
  }, [popupEvent, popupLngLat, onEventSelect]);

  // Fly to selected event
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

      {/* Zoom controls overlay styling handled by CSS */}
      {/* Map attribution is kept minimal via CSS */}
    </div>
  );
}
