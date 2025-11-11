# How to run it

The project relies on Python for the backend and Node/npm for the frontend. The commands below work the same on Windows, macOS, and Linux.

1. (Optional) `python -m venv .venv && source .venv/bin/activate` (Windows PowerShell: `.\.venv\Scripts\Activate.ps1`).
2. Install backend deps from the repo root: `python -m pip install -r requirements.txt`.
3. Install frontend deps: `npm --prefix frontend install`.
4. Start both servers with `python scripts/dev.py` (or `make dev` if you already have make installed). The script launches the Flask API on port 5050, Vite on port 5173, and prints the `http://localhost:5173` link so you always know where to connect.
5. Open the printed URL in your browser and sign up with a valid email to access reLink (the frontend uses port 5173 by default).

Individual services can still be run via `python -m backend.app` or `npm --prefix frontend run dev -- --host` if you prefer separate terminals.
