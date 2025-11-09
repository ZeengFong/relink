PYTHON := python3

.PHONY: dev seed build backend frontend install

backend:
	$(PYTHON) -m backend.app

frontend:
	npm --prefix frontend run dev -- --host

dev:
	@echo "Killing any processes on ports 5050 and 5173..."
	@lsof -ti :5050 | xargs -r kill -9 2>/dev/null || true
	@lsof -ti :5173 | xargs -r kill -9 2>/dev/null || true
	@echo "Launching backend + frontend..."
	@python3 -m backend.app & \
	npm --prefix frontend run dev -- --host

seed:
	$(PYTHON) -m backend.seed

build:
	npm --prefix frontend install && npm --prefix frontend run build
