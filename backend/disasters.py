"""Disaster data + alert endpoints."""
from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List

import requests
from flask import Blueprint, jsonify

DATA_DIR = Path(__file__).resolve().parent.parent / "frontend" / "disaster"
EONET_URL = "https://eonet.gsfc.nasa.gov/api/v3/events?status=open&days=7"
MAJOR_CATEGORIES = {
    "Wildfires",
    "Severe Storms",
    "Volcanoes",
    "Earthquakes",
    "Floods",
}

bp = Blueprint("disaster", __name__, url_prefix="/api/disaster")


def _load_file(name: str) -> List[Dict[str, Any]]:
    path = DATA_DIR / name
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


@bp.route("/map", methods=["GET"])
def map_locations():
    return jsonify({"locations": _load_file("locations.json")})


@bp.route("/areas", methods=["GET"])
def area_polygons():
    return jsonify({"areas": _load_file("regions.json")})


@bp.route("/events", methods=["GET"])
def live_events():
    try:
        resp = requests.get(EONET_URL, timeout=10)
        resp.raise_for_status()
        payload = resp.json()
    except requests.RequestException:
        return jsonify({"error": "Unable to fetch live events"}), 502

    events: List[Dict[str, Any]] = []
    for event in payload.get("events", []):
        categories = {item["title"] for item in event.get("categories", [])}
        intersection = list(categories & MAJOR_CATEGORIES)
        if not intersection:
            continue
        geometry = event.get("geometry") or []
        latest = geometry[-1] if geometry else {}
        coords = latest.get("coordinates")
        if (
            not isinstance(coords, list)
            or len(coords) < 2
            or coords[0] is None
            or coords[1] is None
        ):
            continue

        events.append(
            {
                "id": event.get("id"),
                "title": event.get("title"),
                "category": intersection[0],
                "latitude": coords[1],
                "longitude": coords[0],
                "link": event.get("link"),
                "date": latest.get("date"),
            }
        )

    events.sort(
        key=lambda item: item.get("date") or "",
        reverse=True,
    )
    return jsonify({"events": events})
