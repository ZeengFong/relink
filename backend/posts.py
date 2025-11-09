"""Post creation/listing endpoints."""
from __future__ import annotations

import base64
import math
from binascii import Error as BinasciiError
from pathlib import Path
from typing import Dict, List

from flask import Blueprint, jsonify, request

from .auth import require_auth
from . import storage
from .schemas import chat_schema, post_schema
from .validators import ValidationError, require_fields, validate_capacity, validate_location

POSTS_PATH = Path("posts.json")
CHATS_PATH = Path("chats.json")
MAX_IMAGE_BYTES = 1_500_000

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

    image_data = _sanitize_image(payload.get("image"))

    new_post = post_schema(
        user["id"],
        payload["title"].strip(),
        payload["description"].strip(),
        int(payload["capacity"]),
        location,
        image=image_data,
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
        filled_slots = max(0, len(updated_post["members"]) - 1)
        if filled_slots >= updated_post["capacity"]:
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


@bp.route("/posts/<post_id>/leave", methods=["POST"])
def leave_post(post_id: str):
    user = require_auth()
    state: Dict[str, Dict | tuple[str, int] | None] = {"post": None, "error": None}

    def _leave(posts: List[Dict]) -> List[Dict]:
        for post in posts:
            if post["id"] == post_id:
                state["post"] = post
                break
        if state["post"] is None:
            state["error"] = ("Post not found", 404)
            return posts
        post = state["post"]
        if user["id"] not in post["members"]:
            state["error"] = ("You are not part of this offer", 400)
            return posts
        if post["creator_id"] == user["id"]:
            state["error"] = ("Creators must delete their offers instead of leaving them", 400)
            return posts
        post["members"] = [member for member in post["members"] if member != user["id"]]
        return posts

    storage.update_json(POSTS_PATH, _leave)

    if state["error"]:
        message, code = state["error"]
        return jsonify({"error": message}), code

    def _sync_chat(chats: List[Dict]) -> List[Dict]:
        for chat in chats:
            if chat["id"] == state["post"]["chat_id"]:
                chat["member_ids"] = [member for member in chat["member_ids"] if member != user["id"]]
                break
        return chats

    storage.update_json(CHATS_PATH, _sync_chat)
    return jsonify(state["post"])


@bp.route("/posts/<post_id>", methods=["DELETE"])
def delete_post(post_id: str):
    user = require_auth()
    state: Dict[str, Dict | tuple[str, int] | None] = {"post": None, "error": None}

    def _delete(posts: List[Dict]) -> List[Dict]:
        for idx, post in enumerate(posts):
            if post["id"] != post_id:
                continue
            if post["creator_id"] != user["id"]:
                state["error"] = ("You can only take down offers you created", 403)
                return posts
            state["post"] = post
            posts.pop(idx)
            break
        else:
            state["error"] = ("Post not found", 404)
        return posts

    storage.update_json(POSTS_PATH, _delete)

    if state["error"]:
        message, code = state["error"]
        return jsonify({"error": message}), code

    def _delete_chat(chats: List[Dict]) -> List[Dict]:
        return [chat for chat in chats if chat["id"] != state["post"]["chat_id"]]

    storage.update_json(CHATS_PATH, _delete_chat)
    return jsonify({"success": True})


def _sanitize_image(data: str | None) -> str | None:
    if not data:
        return None
    if not isinstance(data, str):
        raise ValidationError("Invalid image payload")
    if not data.startswith("data:image/") or "," not in data:
        raise ValidationError("Images must be base64 data URLs")
    header, b64data = data.split(",", 1)
    mime = header.split(";")[0]
    allowed = {"data:image/png", "data:image/jpeg", "data:image/webp", "data:image/gif"}
    if mime not in allowed:
        raise ValidationError("Unsupported image format. Use PNG, JPG, GIF, or WebP.")
    try:
        raw = base64.b64decode(b64data, validate=True)
    except (BinasciiError, ValueError) as exc:
        raise ValidationError("Could not decode image") from exc
    if len(raw) > MAX_IMAGE_BYTES:
        raise ValidationError("Image must be smaller than 1.5MB")
    encoded = base64.b64encode(raw).decode()
    return f"{header},{encoded}"
