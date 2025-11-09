"""Reset JSON data files with predictable demo content."""
from __future__ import annotations

import bcrypt

from . import storage
from .schemas import chat_schema, hazard_schema, post_schema, user_schema, new_id


def build_seed():
    password_hash = bcrypt.hashpw(b"password123", bcrypt.gensalt()).decode()
    luca = user_schema("luca@rel.ink", "Luca", password_hash)
    sky = user_schema("sky@rel.ink", "Sky", password_hash)

    post = post_schema(
        luca["id"],
        "Hot meals at Y community centre",
        "Serving 30 plates between 6-9pm. Priority for displaced families.",
        30,
        {"lat": 51.0486, "lng": -114.0708},
    )
    chat = chat_schema(post["id"], [luca["id"], sky["id"]], chat_id=post["chat_id"])
    chat["messages"].append(
        {
            "id": new_id("m"),
            "user_id": luca["id"],
            "text": "Welcome! Let us know dietary needs.",
            "ts": post["created_at"],
        }
    )

    hazard = hazard_schema(
        sky["id"],
        "fire",
        {"lat": 51.05, "lng": -114.07},
        1500,
        "Smoke drifting near Bow Trail",
    )

    return {
        "users.json": [luca, sky],
        "posts.json": [post],
        "chats.json": [chat],
        "hazards.json": [hazard],
    }


def run():
    seed = build_seed()
    storage.load_seed(seed.items())
    print("Seed data written. Accounts: luca@rel.ink / password123")


if __name__ == "__main__":
    run()
