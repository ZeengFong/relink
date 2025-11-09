# reLink

Crowd-sourced disaster relief hub built for hackathons: neighbors can post offers, mark hazards on a live map, follow weather headlines, and coordinate through realtime group chats backed by Flask-SocketIO.

## Stack & Constraints
- **Backend**: Flask + Flask-SocketIO, bcrypt for credentials, feedparser + requests for local news. JSON files in `./data` are the only persistence layer, guarded with POSIX file locks to keep writes atomic.
- **Frontend**: React (Vite) with React Router, Socket.IO client, Leaflet, and Pico.css for accessible defaults.
- **Data**: simple JSON schemas (`users`, `posts`, `chats`, `hazards`) stored locally. `backend/storage.py` enforces a single-writer pattern and can be redirected via `RELINK_DATA_DIR` for tests.

## Getting Started
```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cd frontend && npm install  # offline installs may need a cached registry
```

### Development
Two terminals or `make dev` (runs backend + Vite dev server):
```bash
make dev
```
Backend: http://localhost:5050, Frontend: http://localhost:5173 (proxy forwards `/api` + `/socket.io`).

### Seed / Reset data
Resets `./data/*.json` with demo users, posts, chats, and hazards:
```bash
make seed
```
Seeded accounts:
- `luca@rel.ink / password123`
- `sky@rel.ink / password123`

### Tests
Pytest exercises auth hashing, capacity checks, and chat membership:
```bash
python3 -m pytest
```
Set `RELINK_DATA_DIR` to point at a temp folder to keep fixtures isolated (handled automatically in `tests/conftest.py`).

### Build
Create a static frontend build:
```bash
make build
```
The backend serves JSON + websockets only; deploy the compiled frontend with any static host or reverse proxy to `/api`.

## Features
- Secure register/login with bcrypt + cookie sessions (`/api/auth/*`, `/api/me`).
- Offer feed with quick join actions, creation form, and proximity filtering.
- Automatic chat rooms per offer with realtime updates over Socket.IO and persisted history.
- Hazard map powered by Leaflet with colored radiuses and accessible legend.
- Localized Google News RSS feed (via feedparser + requests) keyed off user-provided coordinates.
- Profile screen summarizing authored offers, chat hub, and responsive Pico.css UI tuned for keyboard navigation.

## Design Notes
Comments and docstrings highlight tradeoffs—e.g., file-locking strategy, rate limiter, and why JSON storage was chosen for the hackathon timeline. The UI favors clarity (pictographic legend, focus-visible controls) over ornamental visuals so first-time users can flow from login → find aid → coordinate within a minute.
