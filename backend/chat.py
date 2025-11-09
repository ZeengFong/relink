"""Chat HTTP + Socket.IO handlers."""
from __future__ import annotations

from pathlib import Path
from typing import Dict, List

from flask import Blueprint, jsonify, request
from flask_socketio import Namespace, SocketIO, emit, join_room

from .auth import require_auth
from . import storage
from .schemas import message_schema
from .validators import ValidationError

CHATS_PATH = Path("chats.json")

bp = Blueprint("chat", __name__, url_prefix="/api")


def _load_chats() -> List[Dict]:
    return storage.read_json(CHATS_PATH)


def _get_chat(chat_id: str) -> Dict | None:
    return next((c for c in _load_chats() if c["id"] == chat_id), None)


@bp.route("/chats/<chat_id>/messages", methods=["GET"])
def list_messages(chat_id: str):
    user = require_auth()
    chat = _get_chat(chat_id)
    if not chat:
        return jsonify({"error": "Chat not found"}), 404
    if user["id"] not in chat["member_ids"]:
        return jsonify({"error": "Join the offer to chat"}), 403
    after = int(request.args.get("after", 0))
    messages = [m for m in chat["messages"] if m["ts"] > after]
    return jsonify({"messages": messages})


def register_socketio(socketio: SocketIO) -> None:
    """Attach application-specific events to the shared Socket.IO instance."""

    class ChatNamespace(Namespace):
        namespace = "/chat"

        def on_join_room(self, data):  # type: ignore[override]
            try:
                user = require_auth()
            except ValidationError as exc:
                emit("error", {"error": str(exc)})
                return
            chat_id = data.get("chat_id")
            chat = _get_chat(chat_id) if chat_id else None
            if not chat or user["id"] not in chat["member_ids"]:
                emit("error", {"error": "Not allowed"})
                return
            join_room(chat_id)
            emit("joined", {"chat_id": chat_id})

        def on_message(self, data):  # type: ignore[override]
            try:
                user = require_auth()
            except ValidationError as exc:
                emit("error", {"error": str(exc)})
                return
            text = (data.get("text") or "").strip()
            chat_id = data.get("chat_id")
            if not text or not chat_id:
                emit("error", {"error": "Missing chat_id/text"})
                return
            chats = _load_chats()
            chat = next((c for c in chats if c["id"] == chat_id), None)
            if not chat or user["id"] not in chat["member_ids"]:
                emit("error", {"error": "Not allowed"})
                return
            msg = message_schema(user["id"], text)
            def _persist(entries: List[Dict]) -> List[Dict]:
                for entry in entries:
                    if entry["id"] == chat_id:
                        entry["messages"].append(msg)
                        break
                return entries

            storage.update_json(CHATS_PATH, _persist)
            emit("message", {"chat_id": chat_id, "message": msg}, room=chat_id)

    socketio.on_namespace(ChatNamespace(ChatNamespace.namespace))
