export const MAP_CENTER: [number, number] = [44.0, 32.0]; // [lng, lat] - Middle East
export const MAP_ZOOM = 4.5;
export const TIMELINE_DAYS = 30;

export const EVENT_TYPE_COLORS: Record<string, string> = {
  airstrike: "#8b1a1a",
  missile: "#8b1a1a",
  "ground-ops": "#3d3d3d",
  diplomatic: "#2d5a27",
  political: "#2d5a27",
  sanctions: "#0a0a0a",
  protest: "#0a0a0a",
};

export const SOURCE_DISPLAY: Record<string, string> = {
  reuters: "Reuters",
  ap: "AP",
  bbc: "BBC",
  guardian: "Guardian",
  aljazeera: "Al Jazeera",
  gdelt: "GDELT",
  "middle-east-eye": "Mid East Eye",
  "times-of-israel": "Times of Israel",
};

export type PoliticalOrientation = "left" | "center" | "right";

/** Editorial orientation of each news source — used for the sidebar badge. */
export const SOURCE_ORIENTATION: Record<string, PoliticalOrientation> = {
  // Left-leaning
  guardian: "left",
  aljazeera: "left",
  "middle-east-eye": "left",
  // Centrist / wire services / data
  reuters: "center",
  ap: "center",
  bbc: "center",
  gdelt: "center",
  // Right-leaning
  "times-of-israel": "right",
};
