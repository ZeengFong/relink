"""Flask application entrypoint for reLink."""
from __future__ import annotations

import os
import time
from collections import defaultdict, deque
from typing import Deque, Dict

from flask import Flask, jsonify, request
from flask_socketio import SocketIO

from . import auth, chat, hazards, news, posts, disasters
from .validators import ValidationError

FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "http://localhost:5173")
RATE_LIMIT = int(os.environ.get("RATE_LIMIT", 120))
RATE_WINDOW = int(os.environ.get("RATE_WINDOW", 60))


class SimpleRateLimiter:
    """In-memory sliding window limiter keyed by requester IP."""

    def __init__(self, limit: int, window: int):
        self.limit = limit
        self.window = window
        self._hits: Dict[str, Deque[float]] = defaultdict(deque)

    def allow(self, key: str) -> bool:
        now = time.time()
        dq = self._hits[key]
        cutoff = now - self.window
        while dq and dq[0] < cutoff:
            dq.popleft()
        if len(dq) >= self.limit:
            return False
        dq.append(now)
        return True


def create_app() -> Flask:
    app = Flask(__name__)
    app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret")
    app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
    app.config["SESSION_COOKIE_HTTPONLY"] = True

    limiter = SimpleRateLimiter(RATE_LIMIT, RATE_WINDOW)

    @app.before_request
    def _rate_limit():
        key = request.remote_addr or "anon"
        if not limiter.allow(key):
            return jsonify({"error": "Take a short breather before retrying."}), 429

    @app.after_request
    def _cors(resp):
        origin = request.headers.get("Origin")
        if origin:
            resp.headers["Access-Control-Allow-Origin"] = origin
            resp.headers["Vary"] = "Origin"
            resp.headers["Access-Control-Allow-Credentials"] = "true"
        resp.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
        resp.headers["Access-Control-Allow-Methods"] = "GET,POST,DELETE,OPTIONS"
        return resp

    @app.errorhandler(ValidationError)
    def _handle_validation(err):
        return jsonify({"error": str(err)}), 400

    app.register_blueprint(auth.bp)
    app.register_blueprint(posts.bp)
    app.register_blueprint(disasters.bp)
    app.register_blueprint(chat.bp)
    app.register_blueprint(hazards.bp)
    app.register_blueprint(news.bp)

    @app.route("/health")
    def health():
        return jsonify({"ok": True})

    return app


app = create_app()
socketio = SocketIO(app, cors_allowed_origins="*", manage_session=True)
chat.register_socketio(socketio)


if __name__ == "__main__":
    socketio.run(
        app,
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5050)),
        allow_unsafe_werkzeug=True
    )
