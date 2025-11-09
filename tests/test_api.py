from pathlib import Path

import bcrypt


def get_storage():
    import backend.storage as storage

    return storage


def register(client, email="user@example.com", name="User", password="password123"):
    return client.post(
        "/api/auth/register",
        json={"email": email, "name": name, "password": password},
    )


def test_registration_hashes_password(client, data_dir):
    resp = register(client)
    assert resp.status_code == 201
    users = get_storage().read_json(Path("users.json"))
    assert len(users) == 1
    assert users[0]["email"] == "user@example.com"
    assert users[0]["password_hash"] != "password123"
    assert bcrypt.checkpw(b"password123", users[0]["password_hash"].encode())


def create_post(client, capacity=2):
    return client.post(
        "/api/posts",
        json={
            "title": "Meals",
            "description": "Hot meals",
            "capacity": capacity,
            "location": {"lat": 10, "lng": 10},
        },
    )


def test_join_respects_capacity(client):
    register(client, "owner@rel.ink")
    create_post(client, capacity=1)
    posts = client.get("/api/posts").get_json()["posts"]
    post_id = posts[0]["id"]
    client.post("/api/auth/logout")
    register(client, "guest@rel.ink")
    join_resp = client.post(f"/api/posts/{post_id}/join")
    assert join_resp.status_code == 200
    client.post("/api/auth/logout")
    register(client, "overflow@rel.ink")
    full_resp = client.post(f"/api/posts/{post_id}/join")
    assert full_resp.status_code == 400


def test_join_adds_member_to_chat(client):
    register(client, "owner@rel.ink")
    create_post(client)
    posts = client.get("/api/posts").get_json()["posts"]
    post_id = posts[0]["id"]
    chat_id = posts[0]["chat_id"]
    client.post("/api/auth/logout")
    joined = register(client, "member@rel.ink").get_json()
    client.post(f"/api/posts/{post_id}/join")
    chats = get_storage().read_json(Path("chats.json"))
    chat = next(chat for chat in chats if chat["id"] == chat_id)
    assert joined["id"] in chat["member_ids"]
