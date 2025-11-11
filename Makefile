PYTHON := $(shell py --version >/dev/null 2>&1 && echo py || (python -V >/dev/null 2>&1 && echo python || echo python3))
DEV_ARGS ?=

.PHONY: dev seed build backend frontend install

backend:
	$(PYTHON) -m backend.app

frontend:
	npm --prefix frontend run dev -- --host

dev:
	$(PYTHON) scripts/dev.py $(DEV_ARGS)

seed:
	$(PYTHON) -m backend.seed

build:
	npm --prefix frontend install && npm --prefix frontend run build
