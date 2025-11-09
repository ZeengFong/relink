PYTHON := python3

.PHONY: dev seed build backend frontend install

backend:
	$(PYTHON) -m backend.app

frontend:
	npm --prefix frontend run dev -- --host

dev:
	@echo "Launching backend + frontend..."
	@python3 -m backend.app & \
	npm --prefix frontend run dev -- --host

seed:
	$(PYTHON) -m backend.seed

build:
	npm --prefix frontend install && npm --prefix frontend run build
