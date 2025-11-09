import importlib
import sys
from pathlib import Path

import pytest

MODULES = [
    "backend.storage",
    "backend.auth",
    "backend.posts",
    "backend.chat",
    "backend.hazards",
    "backend.news",
    "backend.app",
]


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("RELINK_DATA_DIR", str(tmp_path))
    for name in MODULES:
        if name in sys.modules:
            importlib.reload(sys.modules[name])
        else:
            importlib.import_module(name)
    from backend.app import app

    app.config.update(TESTING=True)
    with app.test_client() as client:
        yield client


@pytest.fixture
def data_dir(tmp_path):
    return Path(tmp_path)
