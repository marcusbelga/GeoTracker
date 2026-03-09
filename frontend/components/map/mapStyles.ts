// Custom Mapbox black & white style configuration
// Uses a monochrome dark base map focused on the Middle East

export const MAPBOX_STYLE = "mapbox://styles/mapbox/dark-v11";

// Override layer paint properties for a newspaper B&W look
// Applied after map loads via setPaintProperty
export const MONOCHROME_OVERRIDES: Array<{
  layer: string;
  property: string;
  value: unknown;
}> = [
  // Land: dark paper
  { layer: "land", property: "background-color", value: "#1a1a1a" },
  // Water: slightly lighter dark
  { layer: "water", property: "fill-color", value: "#0d1117" },
  // Country boundaries: medium gray
  { layer: "admin-1-boundary", property: "line-color", value: "#444" },
  { layer: "admin-0-boundary", property: "line-color", value: "#666" },
  { layer: "admin-0-boundary", property: "line-width", value: 1.5 },
];

export const MAP_CONFIG = {
  style: MAPBOX_STYLE,
  center: [44.0, 32.0] as [number, number], // Middle East [lng, lat]
  zoom: 4.5,
  minZoom: 2,
  maxZoom: 15,
  attributionControl: true,
  logoPosition: "bottom-right" as const,
};
