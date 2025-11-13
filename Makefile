ifeq ($(OS),Windows_NT)
    py := python
    killport = powershell -Command "Get-Process -Id (Get-NetTCPConnection -LocalPort $(1) | Select-Object -ExpandProperty OwningProcess) | Stop-Process -Force" 2>$nul
else
    py := python3
    killport = lsof -ti :$(1) | xargs -r kill -9 2>/dev/null || true
endif

.PHONY: dev seed build backend frontend install

backend:
	$(py) -m backend.app

frontend:
	npm --prefix frontend run dev -- --host

dev:
	@echo Freeing ports...
	@$(call killport,5050)
	@$(call killport,5173)
	@echo launching...
	@$(py) -m backend.app & \
	npm --prefix frontend run dev -- --host

seed:
	$(py) -m backend.seed

build:
	npm --prefix frontend install && npm --prefix frontend run build