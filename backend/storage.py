"""Storage helpers for JSON files with portable file locking.

This module centralizes all disk interactions so the rest of the app can
trust atomic, serialized access to the JSON blobs we use as a local data store.
"""
from __future__ import annotations

import json
import os
from contextlib import contextmanager
from pathlib import Path
from tempfile import NamedTemporaryFile
from typing import Any, Iterable

IS_WINDOWS = os.name == "nt"

if IS_WINDOWS:  # pragma: no cover - exercised in Windows environments
    import msvcrt
else:  # pragma: no cover - skipped on Windows
    import fcntl

DEFAULT_DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def get_data_dir() -> Path:
    """
    Resolve the active data directory (can be overridden via RELINK_DATA_DIR).
    The directory is created on demand which keeps tests isolated.
    """
    override = os.environ.get("RELINK_DATA_DIR")
    base = Path(override) if override else DEFAULT_DATA_DIR
    base.mkdir(parents=True, exist_ok=True)
    return base


def _ensure_file(path: Path) -> None:
    if not path.exists():
        path.write_text("[]", encoding="utf-8")


@contextmanager
def with_lock(path: Path):
    """Acquire an exclusive lock on ``path`` via a sibling ``.lock`` file."""
    lock_file = Path(f"{path}.lock")
    lock_file.parent.mkdir(parents=True, exist_ok=True)

    if IS_WINDOWS:
        lock_file.touch(exist_ok=True)
        with open(lock_file, "r+", encoding="utf-8") as handle:
            handle.seek(0)
            handle.write("0")
            handle.flush()
            handle.seek(0)
            msvcrt.locking(handle.fileno(), msvcrt.LK_LOCK, 1)
            try:
                yield
            finally:
                handle.seek(0)
                msvcrt.locking(handle.fileno(), msvcrt.LK_UNLCK, 1)
    else:
        with open(lock_file, "w", encoding="utf-8") as handle:
            fcntl.flock(handle, fcntl.LOCK_EX)
            try:
                yield
            finally:
                fcntl.flock(handle, fcntl.LOCK_UN)


def read_json(path: Path) -> Any:
    """Load JSON data from ``path`` after ensuring it exists."""
    path = get_data_dir() / path
    _ensure_file(path)
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def write_json(path: Path, payload: Any) -> None:
    """Atomically write ``payload`` to ``path`` using a temp file."""
    target = get_data_dir() / path
    target.parent.mkdir(parents=True, exist_ok=True)
    with NamedTemporaryFile("w", delete=False, dir=target.parent, encoding="utf-8") as tmp:
        json.dump(payload, tmp, ensure_ascii=False, indent=2)
        tmp.flush()
        os.fsync(tmp.fileno())
        tmp_path = Path(tmp.name)
    os.replace(tmp_path, target)


def update_json(path: Path, transform: Any) -> Any:
    """Read, transform, and persist ``path`` under a lock."""
    target = get_data_dir() / path
    with with_lock(target):
        data = read_json(path)
        new_data = transform(data)
        write_json(path, new_data)
    return new_data


def load_seed(paths: Iterable[tuple[str, Any]]) -> None:
    """Utility used by the seeding script to overwrite multiple files."""
    for relative, payload in paths:
        write_json(Path(relative), payload)
