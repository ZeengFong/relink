"""Hazard reporting endpoints."""
from __future__ import annotations

from pathlib import Path
from typing import Dict, List
import time

from flask import Blueprint, jsonify, request

from .auth import require_auth
from . import storage
from .schemas import hazard_schema
from .validators import ValidationError, require_fields, validate_location, validate_radius

HAZARDS_PATH = Path("hazards.json")
HAZARD_TYPES = {"fire", "flood", "tornado", "earthquake", "storm"}

bp = Blueprint("hazards", __name__, url_prefix="/api")


def _load() -> List[Dict]:
    return storage.read_json(HAZARDS_PATH)


def prune_old_hazards(max_age_seconds: int = 172800) -> List[Dict]:
    """Drop hazards older than ``max_age_seconds`` and persist the rest."""

    def _prune(entries: List[Dict]) -> List[Dict]:
        cutoff = time.time() - max_age_seconds
        fresh = [entry for entry in entries if entry.get("created_at", 0) >= cutoff]
        # only write if pruning occurred to avoid unnecessary disk churn
        if len(fresh) != len(entries):
            return fresh
        return entries

    return storage.update_json(HAZARDS_PATH, _prune)


@bp.route("/hazards", methods=["GET"])
def list_hazards():
    fresh = prune_old_hazards()
    return jsonify({"hazards": fresh})


@bp.route("/hazards", methods=["POST"])
def create_hazard():
    user = require_auth()
    payload = request.get_json(force=True, silent=True) or {}
    try:
        require_fields(payload, ("type", "center", "radius_m"))
        hazard_type = payload["type"].lower()
        if hazard_type not in HAZARD_TYPES:
            raise ValidationError("Unknown hazard type")
        center = validate_location(payload["center"])
        radius = validate_radius(payload["radius_m"])
    except ValidationError as exc:
        return jsonify({"error": str(exc)}), 400

    hazard = hazard_schema(user["id"], hazard_type, center, radius, payload.get("note", ""))
    def _add(existing: List[Dict]) -> List[Dict]:
        existing.append(hazard)
        return existing

    storage.update_json(HAZARDS_PATH, _add)
    return jsonify(hazard), 201
