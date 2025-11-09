"""Post creation/listing endpoints."""
from __future__ import annotations

import math
from pathlib import Path
from typing import Dict, List

from flask import Blueprint, jsonify, request

from .auth import require_auth
from . import storage
from .schemas import chat_schema, post_schema
from .validators import ValidationError, require_fields, validate_capacity, validate_location

POSTS_PATH = Path("posts.json")
CHATS_PATH = Path("chats.json")

bp = Blueprint("posts", __name__, url_prefix="/api")


def _load_posts() -> List[Dict]:
    return storage.read_json(POSTS_PATH)


def _haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6371
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lng2 - lng1)
    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


@bp.route("/posts", methods=["GET"])
def list_posts():
    posts = _load_posts()
    near = request.args.get("near")
    radius_km = float(request.args.get("km", 25))
    if near:
        try:
            lat_str, lng_str = near.split(",")
            lat, lng = float(lat_str), float(lng_str)
        except ValueError:
            return jsonify({"error": "Invalid near format"}), 400
        posts = [
            post
            for post in posts
            if _haversine(lat, lng, post["location"]["lat"], post["location"]["lng"]) <= radius_km
        ]
    return jsonify({"posts": posts})


@bp.route("/posts", methods=["POST"])
def create_post():
    user = require_auth()
    payload = request.get_json(force=True, silent=True) or {}
    try:
        require_fields(payload, ("title", "description", "capacity", "location"))
        validate_capacity(int(payload["capacity"]))
        location = validate_location(payload["location"])
    except (ValidationError, ValueError) as exc:
        return jsonify({"error": str(exc)}), 400

    new_post = post_schema(
        user["id"],
        payload["title"].strip(),
        payload["description"].strip(),
        int(payload["capacity"]),
        location,
        image=payload.get("image"),
    )
    new_chat = chat_schema(new_post["id"], member_ids=new_post["members"], chat_id=new_post["chat_id"])

    def _add_post(posts: List[Dict]):
        posts.append(new_post)
        return posts

    def _add_chat(chats: List[Dict]):
        chats.append(new_chat)
        return chats

    storage.update_json(POSTS_PATH, _add_post)
    storage.update_json(CHATS_PATH, _add_chat)
    return jsonify(new_post), 201


@bp.route("/posts/<post_id>", methods=["GET"])
def get_post(post_id: str):
    posts = _load_posts()
    post = next((p for p in posts if p["id"] == post_id), None)
    if not post:
        return jsonify({"error": "Post not found"}), 404
    return jsonify(post)


@bp.route("/posts/<post_id>/join", methods=["POST"])
def join_post(post_id: str):
    user = require_auth()
    status = {"error": None}
    updated_post: Dict | None = None

    def _join(posts: List[Dict]) -> List[Dict]:
        nonlocal updated_post
        for post in posts:
            if post["id"] == post_id:
                updated_post = post
                break
        if not updated_post:
            status["error"] = ("not_found", 404)
            return posts
        if user["id"] in updated_post["members"]:
            return posts
        if len(updated_post["members"]) >= updated_post["capacity"]:
            status["error"] = ("full", 400)
            return posts
        updated_post["members"].append(user["id"])
        return posts

    storage.update_json(POSTS_PATH, _join)

    if status["error"]:
        code = status["error"][1]
        message = "Post not found" if code == 404 else "Offer is full"
        return jsonify({"error": message}), code
    if updated_post is None:
        return jsonify({"error": "Post not found"}), 404

    def _sync_chat(chats: List[Dict]) -> List[Dict]:
        for chat in chats:
            if chat["id"] == updated_post["chat_id"] and user["id"] not in chat["member_ids"]:
                chat["member_ids"].append(user["id"])
                break
        return chats

    storage.update_json(CHATS_PATH, _sync_chat)
    return jsonify(updated_post)
