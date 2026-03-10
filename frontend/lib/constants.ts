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
  wsj: "WSJ",
  nyt: "NYT",
  cnn: "CNN",
  "foreign-affairs": "Foreign Affairs",
  dw: "DW",
  ft: "Financial Times",
  guardian: "Guardian",
  bbc: "BBC",
  ap: "AP",
  aljazeera: "Al Jazeera",
  "middle-east-eye": "Mid East Eye",
  "times-of-israel": "Times of Israel",
};

export type PoliticalOrientation = "left" | "center" | "right";

/** Editorial orientation of each news source — used for the sidebar badge. */
export const SOURCE_ORIENTATION: Record<string, PoliticalOrientation> = {
  // Left-leaning
  nyt: "left",
  cnn: "left",
  guardian: "left",
  aljazeera: "left",
  "middle-east-eye": "left",
  // Centrist / wire services
  reuters: "center",
  ap: "center",
  bbc: "center",
  dw: "center",
  "foreign-affairs": "center",
  // Right-leaning / pro-market
  wsj: "right",
  ft: "right",
  "times-of-israel": "right",
};
