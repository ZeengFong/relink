"""Local news fetcher using Google News RSS via feedparser."""
from __future__ import annotations

from flask import Blueprint, jsonify, request
import feedparser
import requests

bp = Blueprint("news", __name__, url_prefix="/api")


@bp.route("/news", methods=["GET"])
def news():
    lat = request.args.get("lat") or "0"
    lng = request.args.get("lng") or "0"
    query = f"severe weather {lat},{lng}".replace(" ", "+")
    url = f"https://news.google.com/rss/search?q={query}&hl=en-US&gl=US&ceid=US:en"
    try:
        resp = requests.get(url, timeout=5)
        resp.raise_for_status()
    except requests.RequestException:
        return jsonify({"items": []}), 502
    feed = feedparser.parse(resp.text)
    items = [
        {
            "title": entry.get("title"),
            "link": entry.get("link"),
            "summary": entry.get("summary"),
            "published": entry.get("published"),
        }
        for entry in feed.entries[:5]
    ]
    return jsonify({"items": items})
