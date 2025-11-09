"""Simple helpers for constructing JSON-friendly objects."""
from __future__ import annotations

import time
import uuid
from typing import Any, Dict, List


def _ts() -> int:
    return int(time.time())


def new_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:8]}"


def user_schema(email: str, name: str, password_hash: str) -> Dict[str, Any]:
    return {
        "id": new_id("u"),
        "email": email.lower(),
        "name": name,
        "password_hash": password_hash,
        "created_at": _ts(),
    }


def post_schema(
    creator_id: str,
    title: str,
    description: str,
    capacity: int,
    location: Dict[str, float],
    image: str | None = None,
    *,
    post_id: str | None = None,
    chat_id: str | None = None,
) -> Dict[str, Any]:
    chat_id = chat_id or new_id("c")
    post_id = post_id or new_id("p")
    return {
        "id": post_id,
        "creator_id": creator_id,
        "title": title,
        "description": description,
        "image": image,
        "capacity": capacity,
        "members": [creator_id],
        "chat_id": chat_id,
        "location": location,
        "created_at": _ts(),
    }


def chat_schema(post_id: str, member_ids: List[str], chat_id: str | None = None) -> Dict[str, Any]:
    return {
        "id": chat_id or new_id("c"),
        "post_id": post_id,
        "member_ids": member_ids,
        "messages": [],
    }


def message_schema(user_id: str, text: str) -> Dict[str, Any]:
    return {
        "id": new_id("m"),
        "user_id": user_id,
        "text": text,
        "ts": _ts(),
    }


def hazard_schema(
    reporter_id: str,
    hazard_type: str,
    center: Dict[str, float],
    radius_m: int,
    note: str,
) -> Dict[str, Any]:
    return {
        "id": new_id("h"),
        "type": hazard_type,
        "center": center,
        "radius_m": radius_m,
        "reporter_id": reporter_id,
        "note": note,
        "created_at": _ts(),
    }
