.PHONY: help install build up down logs clean test migrate db-shell redis-shell

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	pnpm install
	python3 -m venv .venv
	.venv/bin/pip install -r requirements.txt

build: ## Build all Docker images
	docker-compose build

up: ## Start all services with Docker Compose
	docker-compose up -d

down: ## Stop all services
	docker-compose down

logs: ## Follow logs from all services
	docker-compose logs -f

logs-gateway: ## Follow gateway service logs
	docker-compose logs -f gateway

logs-portal: ## Follow portal logs
	docker-compose logs -f portal-web

logs-admin: ## Follow admin logs
	docker-compose logs -f admin

ps: ## Show running containers
	docker-compose ps

clean: ## Stop and remove all containers, volumes, and images
	docker-compose down -v --rmi all

clean-volumes: ## Remove all volumes (WARNING: deletes all data)
	docker-compose down -v

restart: down up ## Restart all services

restart-gateway: ## Restart only gateway service
	docker-compose restart gateway

# Database operations
migrate: ## Run database migrations
	docker-compose exec gateway alembic upgrade head

migrate-create: ## Create a new migration (use MESSAGE="your message")
	docker-compose exec gateway alembic revision --autogenerate -m "$(MESSAGE)"

db-shell: ## Open PostgreSQL shell
	docker-compose exec postgres psql -U fxoption -d fxoption

redis-shell: ## Open Redis CLI
	docker-compose exec redis redis-cli

# Testing
test: ## Run Python tests
	.venv/bin/pytest

test-frontend: ## Run frontend tests
	pnpm test

test-coverage: ## Run tests with coverage
	.venv/bin/pytest --cov=services --cov-report=html

# Development
dev: ## Start development environment (no Docker)
	./scripts/run-dev.sh

dev-db: ## Start only database services
	docker-compose up -d postgres redis

seed: ## Seed database with demo data
	python scripts/seed_demo.py

# Linting and formatting
lint: ## Run linters
	pnpm --filter portal-web lint
	pnpm --filter admin lint
	.venv/bin/ruff check services

format: ## Format code
	.venv/bin/black services
	.venv/bin/ruff check --fix services

# Monitoring
grafana: ## Open Grafana dashboard
	@echo "Opening Grafana at http://localhost:3002"
	@echo "Default credentials: admin/admin"

prometheus: ## Open Prometheus
	@echo "Opening Prometheus at http://localhost:9090"

# Production builds
build-prod: ## Build production images
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

deploy-staging: ## Deploy to staging environment
	@echo "Deploying to staging..."
	# Add deployment commands here

deploy-prod: ## Deploy to production environment
	@echo "Deploying to production..."
	# Add deployment commands here
