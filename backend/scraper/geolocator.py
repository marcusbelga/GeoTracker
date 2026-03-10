"""
Resolves location names to lat/lng coordinates.
Priority: 1. Article already has coords (GDELT), 2. Known cities dict, 3. Nominatim API.
"""

import asyncio
import httpx
from typing import Optional

from .base_scraper import RawArticle

# Known cities/locations with coordinates (lat, lng, country)
KNOWN_LOCATIONS: dict[str, tuple[float, float, str]] = {
    "tehran": (35.6892, 51.3890, "Iran"),
    "isfahan": (32.6546, 51.6680, "Iran"),
    "natanz": (33.5203, 51.9162, "Iran"),
    "fordow": (34.8853, 50.9856, "Iran"),
    "arak": (34.0954, 49.7013, "Iran"),
    "bushehr": (28.9684, 50.8385, "Iran"),
    "mashhad": (36.2972, 59.6067, "Iran"),
    "shiraz": (29.5918, 52.5836, "Iran"),
    "tabriz": (38.0962, 46.2738, "Iran"),
    "ahvaz": (31.3183, 48.6706, "Iran"),
    "tel aviv": (32.0853, 34.7818, "Israel"),
    "jerusalem": (31.7683, 35.2137, "Israel"),
    "haifa": (32.8191, 34.9983, "Israel"),
    "beersheba": (31.2518, 34.7913, "Israel"),
    "eilat": (29.5569, 34.9516, "Israel"),
    "netanya": (32.3329, 34.8600, "Israel"),
    "gaza": (31.5017, 34.4668, "Palestine"),
    "rafah": (31.2845, 34.2486, "Palestine"),
    "ramallah": (31.8996, 35.2042, "Palestine"),
    "nablus": (32.2211, 35.2544, "Palestine"),
    "beirut": (33.8886, 35.4955, "Lebanon"),
    "damascus": (33.5138, 36.2765, "Syria"),
    "aleppo": (36.2021, 37.1343, "Syria"),
    "baghdad": (33.3152, 44.3661, "Iraq"),
    "erbil": (36.1911, 44.0091, "Iraq"),
    "amman": (31.9539, 35.9106, "Jordan"),
    "riyadh": (24.7136, 46.6753, "Saudi Arabia"),
    "dubai": (25.2048, 55.2708, "UAE"),
    "abu dhabi": (24.4539, 54.3773, "UAE"),
    "doha": (25.2854, 51.5310, "Qatar"),
    "kuwait city": (29.3759, 47.9774, "Kuwait"),
    "muscat": (23.5880, 58.3829, "Oman"),
    "sanaa": (15.3694, 44.1910, "Yemen"),
    "aden": (12.7797, 45.0095, "Yemen"),
    "strait of hormuz": (26.5942, 56.4870, "Strait of Hormuz"),
    "red sea": (20.0, 38.0, "Red Sea"),
    "persian gulf": (26.0, 52.0, "Persian Gulf"),
    "west bank": (31.9522, 35.2332, "Palestine"),
}

# Country → its capital city key in KNOWN_LOCATIONS
COUNTRY_TO_CAPITAL: dict[str, str] = {
    "iran": "tehran",
    "israel": "jerusalem",
    "palestine": "ramallah",
    "lebanon": "beirut",
    "syria": "damascus",
    "iraq": "baghdad",
    "jordan": "amman",
    "saudi arabia": "riyadh",
    "qatar": "doha",
    "kuwait": "kuwait city",
    "uae": "dubai",
    "oman": "muscat",
    "yemen": "sanaa",
    "usa": "washington",
    "united states": "washington",
    "us": "washington",
    "american": "washington",
}

# Washington D.C. added to known locations
KNOWN_LOCATIONS["washington"] = (38.9072, -77.0369, "USA")
KNOWN_LOCATIONS["washington dc"] = (38.9072, -77.0369, "USA")

# Country-level fallback — now all point to capital coords
COUNTRY_COORDS: dict[str, tuple[float, float]] = {
    "iran": (35.6892, 51.3890),
    "israel": (31.7683, 35.2137),
    "usa": (38.9072, -77.0369),
    "united states": (38.9072, -77.0369),
    "us": (38.9072, -77.0369),
    "palestine": (31.8996, 35.2042),
    "lebanon": (33.8886, 35.4955),
    "syria": (33.5138, 36.2765),
    "iraq": (33.3152, 44.3661),
    "jordan": (31.9539, 35.9106),
    "saudi arabia": (24.7136, 46.6753),
    "qatar": (25.2854, 51.5310),
    "kuwait": (29.3759, 47.9774),
    "uae": (25.2048, 55.2708),
    "oman": (23.5880, 58.3829),
    "yemen": (15.3694, 44.1910),
}

# Nominatim cache to avoid duplicate API calls
_geocode_cache: dict[str, Optional[tuple[float, float, str]]] = {}


async def _nominatim_geocode(query: str) -> Optional[tuple[float, float, str]]:
    """Call OpenStreetMap Nominatim as fallback. Respects rate limit (1 req/s)."""
    if query in _geocode_cache:
        return _geocode_cache[query]

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                "https://nominatim.openstreetmap.org/search",
                params={"q": query, "format": "json", "limit": 1},
                headers={"User-Agent": "GeoTracker/1.0 (conflict-news-tracker)"},
            )
            data = resp.json()
            if data:
                result = (float(data[0]["lat"]), float(data[0]["lon"]), query.title())
                _geocode_cache[query] = result
                await asyncio.sleep(1.1)  # Nominatim rate limit
                return result
    except Exception:
        pass

    _geocode_cache[query] = None
    return None


def extract_location_from_text(text: str) -> Optional[str]:
    """Simple regex to find known city names in article text."""
    text_lower = text.lower()
    for location in KNOWN_LOCATIONS:
        if location in text_lower:
            return location
    for country in COUNTRY_COORDS:
        if country in text_lower:
            return country
    return None


async def geolocate_article(article: RawArticle) -> tuple[Optional[float], Optional[float], Optional[str], Optional[str]]:
    """
    Returns (lat, lng, location_name, country) or (None, None, None, None).
    Priority: article coords → location_hint → text extraction → Nominatim.
    """
    # 1. Article already has coords (GDELT)
    if article.lat and article.lng:
        location_name = article.location_hint or "Unknown"
        country = _infer_country(article.lat, article.lng)
        return article.lat, article.lng, location_name, country

    # 2. Known location hint
    hint = article.location_hint
    if hint:
        hint_lower = hint.lower()
        if hint_lower in KNOWN_LOCATIONS:
            lat, lng, country = KNOWN_LOCATIONS[hint_lower]
            return lat, lng, hint.title(), country
        # Country hint → use capital city
        if hint_lower in COUNTRY_TO_CAPITAL:
            capital = COUNTRY_TO_CAPITAL[hint_lower]
            lat, lng, country = KNOWN_LOCATIONS[capital]
            return lat, lng, capital.title(), country
        if hint_lower in COUNTRY_COORDS:
            lat, lng = COUNTRY_COORDS[hint_lower]
            return lat, lng, hint.title(), hint.title()

    # 3. Extract from article text
    text = f"{article.title} {article.snippet}"
    location = extract_location_from_text(text)
    if location:
        if location in KNOWN_LOCATIONS:
            lat, lng, country = KNOWN_LOCATIONS[location]
            return lat, lng, location.title(), country
        # Country mention → use capital city
        if location in COUNTRY_TO_CAPITAL:
            capital = COUNTRY_TO_CAPITAL[location]
            lat, lng, country = KNOWN_LOCATIONS[capital]
            return lat, lng, capital.title(), country
        if location in COUNTRY_COORDS:
            lat, lng = COUNTRY_COORDS[location]
            return lat, lng, location.title(), location.title()

    # 4. Nominatim fallback
    if location:
        result = await _nominatim_geocode(location)
        if result:
            lat, lng, loc_name = result
            country = _infer_country(lat, lng)
            return lat, lng, loc_name, country

    return None, None, None, None


def _infer_country(lat: float, lng: float) -> str:
    """Very rough bounding-box country inference for Middle East."""
    if 25 <= lat <= 40 and 43 <= lng <= 64:
        return "Iran"
    if 29 <= lat <= 34 and 34 <= lng <= 36:
        return "Israel"
    if 33 <= lat <= 36 and 35 <= lng <= 37:
        return "Lebanon/Syria"
    if 29 <= lat <= 38 and 39 <= lng <= 49:
        return "Iraq/Saudi Arabia"
    return "Middle East"
