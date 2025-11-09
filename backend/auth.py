"""Authentication blueprint handling register/login/session helpers."""
from __future__ import annotations

from pathlib import Path
from typing import Dict, Optional

import bcrypt
from flask import Blueprint, jsonify, request, session

from . import storage
from .schemas import user_schema
from .validators import ValidationError, require_fields, validate_email, validate_password

USERS_PATH = Path("users.json")

bp = Blueprint("auth", __name__, url_prefix="/api")


def _sanitize(user: Dict) -> Dict:
    data = user.copy()
    data.pop("password_hash", None)
    return data


def _load_users() -> list[Dict]:
    return storage.read_json(USERS_PATH)


def get_user_by_id(user_id: str) -> Optional[Dict]:
    return next((u for u in _load_users() if u["id"] == user_id), None)


def get_user_by_email(email: str) -> Optional[Dict]:
    return next((u for u in _load_users() if u["email"] == email.lower()), None)


def require_auth() -> Dict:
    user_id = session.get("user_id")
    if not user_id:
        raise ValidationError("Authentication required")
    user = get_user_by_id(user_id)
    if not user:
        raise ValidationError("Session expired")
    return user


@bp.route("/auth/register", methods=["POST"])
def register():
    payload = request.get_json(force=True, silent=True) or {}
    try:
        require_fields(payload, ("email", "name", "password"))
        validate_email(payload["email"])
        validate_password(payload["password"])
    except ValidationError as exc:
        return jsonify({"error": str(exc)}), 400

    if get_user_by_email(payload["email"]):
        return jsonify({"error": "Email already registered"}), 400

    password_hash = bcrypt.hashpw(payload["password"].encode(), bcrypt.gensalt()).decode()
    new_user = user_schema(payload["email"], payload["name"], password_hash)

    def _insert(users: list[Dict]):
        users.append(new_user)
        return users

    storage.update_json(USERS_PATH, _insert)
    session["user_id"] = new_user["id"]
    return jsonify(_sanitize(new_user)), 201


@bp.route("/auth/login", methods=["POST"])
def login():
    payload = request.get_json(force=True, silent=True) or {}
    try:
        require_fields(payload, ("email", "password"))
        validate_email(payload["email"])
    except ValidationError as exc:
        return jsonify({"error": str(exc)}), 400

    user = get_user_by_email(payload["email"])
    if not user or not bcrypt.checkpw(payload["password"].encode(), user["password_hash"].encode()):
        return jsonify({"error": "Invalid credentials"}), 401

    session["user_id"] = user["id"]
    return jsonify(_sanitize(user))


@bp.route("/auth/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"ok": True})


@bp.route("/me", methods=["GET"])
def me():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"user": None})
    user = get_user_by_id(user_id)
    return jsonify({"user": _sanitize(user) if user else None})
