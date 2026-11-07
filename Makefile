PNPM ?= pnpm
APP ?= admin

.PHONY: install serve dev-app build build-apps lint lint-apps typecheck test test-apps test-e2e clean

install:
	$(PNPM) install --frozen-lockfile

serve:
	$(PNPM) dev

dev-app:
	$(PNPM) --filter @vms/$(APP) dev

build:
	$(PNPM) build

build-apps:
	$(PNPM) build:apps

lint:
	$(PNPM) lint

lint-apps:
	$(PNPM) lint:apps

typecheck:
	$(PNPM) typecheck

test:
	$(PNPM) test

test-apps:
	$(PNPM) test:workspace

test-e2e:
	$(PNPM) test:e2e

clean:
	$(PNPM) exec turbo run clean
