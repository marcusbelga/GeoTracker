"""
Classifies RawArticles into event types using keyword heuristics.
Returns (event_type_slug, confidence_score).
"""

from .base_scraper import RawArticle

EVENT_KEYWORDS: dict[str, list[str]] = {
    "airstrike": [
        "airstrike", "air strike", "bombing", "bombed", "bomb", "explosion",
        "blast", "strike", "targeted", "hit", "destroyed", "leveled",
        "aerial attack", "air attack", "aircraft", "fighter jet", "f-35",
    ],
    "missile": [
        "missile", "rocket", "drone", "uav", "launched", "fired",
        "intercepted", "iron dome", "ballistic", "cruise missile",
        "shahab", "hypersonic", "projectile", "warhead",
    ],
    "diplomatic": [
        "talks", "negotiations", "diplomat", "diplomatic", "meeting",
        "agreement", "deal", "summit", "ceasefire", "treaty", "envoy",
        "ambassador", "foreign minister", "secretary of state",
        "united nations", "un resolution", "sanctions lifted",
    ],
    "political": [
        "election", "vote", "parliament", "knesset", "majlis",
        "president", "prime minister", "minister", "policy", "government",
        "coalition", "opposition", "referendum", "inauguration",
    ],
    "ground-ops": [
        "ground", "troops", "soldiers", "invasion", "advance", "offensive",
        "infantry", "tank", "armored", "forces entered", "raided",
        "incursion", "military operation", "special forces",
    ],
    "sanctions": [
        "sanctions", "embargo", "trade", "economic", "freeze", "assets",
        "oil export", "oil ban", "financial", "treasury", "blocked",
        "restricted", "import ban", "export control",
    ],
    "protest": [
        "protest", "demonstration", "rally", "riot", "civil unrest",
        "marched", "demonstrators", "clashes", "crowd", "uprising",
        "dissent", "strike", "blockade",
    ],
}

DEFAULT_TYPE = "diplomatic"  # fallback when no keywords match


def classify_event_type(article: RawArticle) -> tuple[str, float]:
    """
    Returns (event_type_slug, confidence) where confidence is 0.0 – 1.0.
    """
    text = f"{article.title} {article.snippet}".lower()

    scores: dict[str, int] = {}
    for slug, keywords in EVENT_KEYWORDS.items():
        count = sum(1 for kw in keywords if kw in text)
        if count:
            scores[slug] = count

    if not scores:
        return DEFAULT_TYPE, 0.3

    best_slug = max(scores, key=lambda s: scores[s])
    best_count = scores[best_slug]
    max_possible = len(EVENT_KEYWORDS[best_slug])
    confidence = min(best_count / max(max_possible * 0.3, 1), 1.0)

    return best_slug, round(confidence, 2)
