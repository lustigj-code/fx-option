## Quick Start Guide

Get the FX Option Platform running locally in under 5 minutes.

### Prerequisites

- Docker and Docker Compose installed
- Make (optional, for convenient commands)
- Python 3.10+ (for verification script)

### Step 1: Clone and Setup

```bash
git clone <repository-url>
cd fx-option
cp .env.example .env
```

### Step 2: Start All Services

```bash
# Using Make (recommended)
make up

# Or using docker-compose directly
docker-compose up -d
```

This starts:
- PostgreSQL (database)
- Redis (cache)
- Gateway API (port 8000)
- Portal Web (port 3000)
- Admin Dashboard (port 3001)
- Prometheus (port 9090)
- Grafana (port 3002)

### Step 3: Verify Setup

```bash
# Wait for services to start (30-60 seconds)
sleep 30

# Run verification script
python3 scripts/verify_setup.py
```

Or check manually:
```bash
curl http://localhost:8000/health
```

### Step 4: Run Database Migrations

```bash
make migrate

# Or manually
docker-compose exec gateway alembic upgrade head
```

### Step 5: Access Applications

🌐 **Web Applications:**
- **Client Portal**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3001
- **API Documentation**: http://localhost:8000/docs
- **Grafana**: http://localhost:3002 (admin/admin)
- **Prometheus**: http://localhost:9090

### Step 6: Create a Test User

1. Go to http://localhost:8000/docs
2. Find `POST /api/auth/register`
3. Click "Try it out"
4. Use this payload:

```json
{
  "email": "user@example.com",
  "username": "testuser",
  "password": "testpass123",
  "role": "client"
}
```

5. Click "Execute"
6. Copy the user ID from the response

### Step 7: Login and Test

1. Find `POST /api/auth/login`
2. Login with:

```json
{
  "username": "testuser",
  "password": "testpass123"
}
```

3. Copy the `access_token` from response
4. Click "Authorize" button at top of page
5. Enter: `Bearer <your-access-token>`
6. Now you can test authenticated endpoints!

### Step 8: Generate a Quote

1. Find `POST /api/quotes/binding`
2. Use this payload:

```json
{
  "exposure_id": "exp-001",
  "currency_pair": "USDMXN",
  "notional": 100000,
  "strike": 17.5,
  "tenor_months": 1,
  "spot_rate": 17.25,
  "implied_volatility": 0.15,
  "interest_rate_domestic": 0.05,
  "interest_rate_foreign": 0.11
}
```

3. You should receive a binding quote!

---

## Common Commands

```bash
make help              # Show all available commands
make logs              # View all service logs
make logs-gateway      # View gateway logs only
make ps                # Show running containers
make down              # Stop all services
make restart           # Restart all services
make db-shell          # Open PostgreSQL shell
make redis-shell       # Open Redis CLI
make test              # Run Python tests
```

---

## Troubleshooting

### Services won't start

```bash
# Check what's running
docker-compose ps

# View logs
docker-compose logs gateway
docker-compose logs postgres
```

### Database connection errors

```bash
# Wait for PostgreSQL to fully start
docker-compose logs postgres | grep "ready to accept connections"

# Restart gateway after PostgreSQL is ready
docker-compose restart gateway
```

### Port already in use

```bash
# Find what's using the port
sudo lsof -i :8000
sudo lsof -i :5432

# Kill the process or change port in docker-compose.yml
```

### Reset everything

```bash
# Stop and remove all containers, volumes, and images
make clean

# Start fresh
make up
make migrate
```

---

## Next Steps

- Read the full [README.md](README.md)
- Check [PROGRESS.md](PROGRESS.md) for implementation status
- Explore API docs at http://localhost:8000/docs
- View monitoring dashboards in Grafana
- Review compliance docs in `docs/compliance/`

---

**Need Help?**

- Check logs: `make logs`
- Verify health: `python3 scripts/verify_setup.py`
- Report issues on GitHub
