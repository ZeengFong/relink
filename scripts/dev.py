"""Cross-platform development runner for reLink."""
from __future__ import annotations

import argparse
import os
import shutil
import signal
import socket
import subprocess
import sys
import time
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Sequence, Tuple

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_BACKEND_PORT = int(os.environ.get("PORT", 5050))
DEFAULT_FRONTEND_PORT = 5173


def _port_in_use(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(0.2)
        return sock.connect_ex(("127.0.0.1", port)) == 0


def _warn_busy_ports(ports: Iterable[int]) -> None:
    busy = [str(port) for port in ports if _port_in_use(port)]
    if busy:
        joined = ", ".join(busy)
        print(
            f"Warning: port(s) {joined} already in use. Existing processes won't be terminated automatically;\n"
            "Press Ctrl+C and stop them manually or re-run with --no-backend/--no-frontend."
        )


def _ensure_command(name: str) -> None:
    if shutil.which(name) is None:
        raise SystemExit(f"Required command '{name}' was not found on PATH.")


def _parse_args():
    parser = argparse.ArgumentParser(description="Run backend and frontend together.")
    parser.add_argument("--no-backend", action="store_true", help="Skip launching the Flask backend")
    parser.add_argument("--no-frontend", action="store_true", help="Skip launching the Vite frontend")
    parser.add_argument("--backend-port", type=int, default=DEFAULT_BACKEND_PORT, help="Port for the backend app")
    parser.add_argument("--frontend-port", type=int, default=DEFAULT_FRONTEND_PORT, help="Port for the Vite dev server")
    return parser.parse_args()


def _start_process(
    cmd: Sequence[str], label: str, *, env: Optional[Dict[str, str]] = None
) -> subprocess.Popen[str]:
    print(f"Starting {label}: {' '.join(cmd)}")

    # --- Windows fix: resolve full path to executable and use shell ---
    exe = shutil.which(cmd[0])
    if exe:
        cmd[0] = exe

    # On Windows, use shell=True so that PATH resolution works even with cwd changed
    return subprocess.Popen(cmd, cwd=str(ROOT), env=env, shell=os.name == "nt")


def main() -> None:
    args = _parse_args()

    if args.no_backend and args.no_frontend:
        print("Nothing to run (both backend and frontend disabled).")
        return

    # Check for required commands
    if not args.no_frontend:
        _ensure_command("npm")
        print(
            f"Frontend dev server will be reachable at http://localhost:{args.frontend_port} "
            "once Vite finishes compiling."
        )

    # Auto-detect Python command
    python_cmd = shutil.which("py") or shutil.which("python") or shutil.which("python3")
    if not python_cmd:
        raise SystemExit("Error: No Python interpreter found. Please install Python and add it to PATH.")

    # Build runner list
    runners: List[Tuple[str, List[str]]] = []
    if not args.no_backend:
        runners.append(("backend", [python_cmd, "-m", "backend.app"]))
    if not args.no_frontend:
        runners.append((
            "frontend",
            [
                "npm",
                "--prefix",
                "frontend",
                "run",
                "dev",
                "--",
                "--host",
                "--port",
                str(args.frontend_port),
            ],
        ))

    _warn_busy_ports(
        port for port, should_check in (
            (args.backend_port, not args.no_backend),
            (args.frontend_port, not args.no_frontend),
        ) if should_check
    )

    procs: List[Tuple[str, subprocess.Popen[str]]] = []
    stopping = False

    def _shutdown(*_):
        nonlocal stopping
        if stopping:
            return
        stopping = True
        print("\nShutting down dev processes...")
        for label, proc in procs:
            if proc.poll() is None:
                print(f"Stopping {label}...")
                proc.terminate()
        for _, proc in procs:
            try:
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                proc.kill()

    # Ensure Ctrl+C and task kill signals stop everything cleanly
    for sig in (signal.SIGINT, signal.SIGTERM):
        signal.signal(sig, _shutdown)
    if hasattr(signal, "SIGBREAK"):
        signal.signal(getattr(signal, "SIGBREAK"), _shutdown)

    backend_env = os.environ.copy()
    backend_env.setdefault("PORT", str(args.backend_port))

    try:
        for label, cmd in runners:
            env = backend_env if label == "backend" else None
            procs.append((label, _start_process(cmd, label, env=env)))

        while procs:
            for label, proc in list(procs):
                code = proc.poll()
                if code is not None:
                    if not stopping:
                        print(f"{label} exited with status {code}")
                    _shutdown()
                    return
            time.sleep(0.5)
    finally:
        _shutdown()


if __name__ == "__main__":
    main()
