# Stratus

[![CI/CD](https://github.com/riya-varda/stratus/actions/workflows/ci.yml/badge.svg)](https://github.com/riya-varda/stratus/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Stratus** is a cloud infrastructure and deployment management platform - think Vercel meets Railway. Teams can manage projects, trigger deployments, and monitor their infrastructure from a single dashboard.

---

## Features

- **JWT + API Key Authentication** - access tokens, refresh tokens, bcrypt-hashed passwords, role-based access control (admin / developer / viewer)
- **Project Management** - create, search, filter, and paginate projects with slug-based routing
- **Deployment Pipeline** - trigger deployments per environment (dev / staging / prod), view logs, cancel in-flight jobs
- **Analytics Dashboard** - 14-day deployment trends, success rate, recent activity feed
- **Background Tasks** - Celery + Redis for email notifications, cleanup jobs, async processing
- **Caching** - Redis cache with graceful fallback when unavailable
- **Observability** - `/health`, `/ready`, `/live` endpoints, Prometheus metrics, and Grafana dashboards with full service coverage (API, Postgres, Redis)
- **Dark Mode** - first-class dark/light theme with Tailwind CSS
- **Responsive UI** - sidebar nav, skeleton loaders, empty states, toast notifications, smooth Framer Motion animations

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | FastAPI, SQLAlchemy 2.0 (async), Alembic, Pydantic v2 |
| **Auth** | JWT (python-jose), bcrypt (passlib), API keys |
| **Database** | PostgreSQL 16 |
| **Cache / Queue** | Redis 7, Celery |
| **Frontend** | React 18, TypeScript, Tailwind CSS, Framer Motion |
| **State / Data** | Zustand, TanStack React Query, Recharts |
| **Infrastructure** | Docker Compose, Kubernetes, Terraform (AWS) |
| **CI/CD** | GitHub Actions - lint, type-check, test, migration validation, build, Docker publish |
| **Monitoring** | Prometheus, Grafana, postgres_exporter, redis_exporter |

---

## Project Structure

```
stratus/
â”œâ”€â”€ backend/
â”‚   â”œâ”€â”€ app/
â”‚   â”‚   â”œâ”€â”€ api/v1/endpoints/    # Route handlers
â”‚   â”‚   â”œâ”€â”€ core/                # Config, security, dependencies
â”‚   â”‚   â”œâ”€â”€ db/                  # Session, Redis cache
â”‚   â”‚   â”œâ”€â”€ middleware/          # Logging
â”‚   â”‚   â”œâ”€â”€ models/               # SQLAlchemy ORM models
â”‚   â”‚   â”œâ”€â”€ schemas/              # Pydantic request/response schemas
â”‚   â”‚   â”œâ”€â”€ services/             # Business logic layer
â”‚   â”‚   â”œâ”€â”€ tasks/                # Celery tasks
â”‚   â”‚   â””â”€â”€ main.py               # FastAPI application
â”‚   â”œâ”€â”€ alembic/                  # Database migrations
â”‚   â”œâ”€â”€ tests/                    # Pytest tests + Locust load tests
â”‚   â”œâ”€â”€ Dockerfile
â”‚   â””â”€â”€ requirements.txt
â”œâ”€â”€ frontend/
â”‚   â”œâ”€â”€ src/
â”‚   â”‚   â”œâ”€â”€ components/           # Reusable UI components + layout
â”‚   â”‚   â”œâ”€â”€ hooks/                # React Query hooks, toast
â”‚   â”‚   â”œâ”€â”€ lib/                  # Axios client, utils
â”‚   â”‚   â”œâ”€â”€ pages/                # Route pages (auth, dashboard, etc.)
â”‚   â”‚   â”œâ”€â”€ store/                # Zustand stores (auth, UI)
â”‚   â”‚   â”œâ”€â”€ types/                # TypeScript types
â”‚   â”‚   â””â”€â”€ App.tsx               # Router + providers
â”‚   â”œâ”€â”€ Dockerfile
â”‚   â””â”€â”€ package.json
â”œâ”€â”€ infrastructure/
â”‚   â”œâ”€â”€ kubernetes/               # K8s manifests + HPA
â”‚   â”œâ”€â”€ terraform/                # AWS (VPC, RDS, ElastiCache, S3, ECS)
â”‚   â”œâ”€â”€ prometheus/               # Scrape config
â”‚   â””â”€â”€ grafana/                  # Dashboards + datasources
â”œâ”€â”€ .github/workflows/            # GitHub Actions CI/CD
â”œâ”€â”€ docker-compose.yml
â””â”€â”€ README.md
```

---

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node 20+ (for local frontend dev)
- Python 3.12+ (for local backend dev)

### 1. Clone & configure

```bash
git clone https://github.com/riya-varda/stratus.git
cd stratus

cp backend/.env.example backend/.env
# Edit backend/.env - set SECRET_KEY at minimum
```

### 2. Start with Docker Compose

```bash
docker compose up -d
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |
| Grafana | http://localhost:3001 (admin/admin) |
| Prometheus | http://localhost:9090 |

### 3. Create your first account

Open http://localhost:3000/register and sign up.

---

## Local Development

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Start PostgreSQL and Redis (Docker)
docker compose up postgres redis -d

# Copy env
cp .env.example .env

# Run migrations
alembic upgrade head

# Start API
uvicorn app.main:app --reload

# Start Celery worker (separate terminal)
celery -A app.tasks.celery_app worker --loglevel=info
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Testing

```bash
# Backend unit + integration tests
cd backend
pytest tests/ -v --cov=app

# Load test with Locust
locust -f tests/locustfile.py --host=http://localhost:8000

# Frontend type check
cd frontend
npm run type-check
```

---

## API Overview

All endpoints are prefixed with `/api/v1`.

| Method | Path | Description |
|---|---|---|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Login (returns JWT) |
| POST | `/auth/refresh` | Refresh access token |
| GET | `/auth/me` | Get current user |
| GET | `/projects/` | List projects (paginated) |
| POST | `/projects/` | Create project |
| PATCH | `/projects/{id}` | Update project |
| DELETE | `/projects/{id}` | Delete project |
| GET | `/projects/{id}/deployments` | List deployments |
| POST | `/projects/{id}/deployments` | Trigger deployment |
| POST | `/projects/{id}/deployments/{did}/cancel` | Cancel deployment |
| GET | `/analytics/overview` | Dashboard analytics |
| GET | `/health` | Health check |
| GET | `/ready` | Readiness probe |
| GET | `/live` | Liveness probe |
| GET | `/metrics` | Prometheus metrics |

**Authentication:** Pass `Authorization: Bearer <token>` or `Authorization: Bearer sk_<api_key>`.

---

## Docker

```bash
# Development (hot reload)
docker compose up

# Production build
docker compose -f docker-compose.yml build

# Backend only
docker build -t stratus-api --target production ./backend

# Frontend only
docker build -t stratus-frontend --target production ./frontend
```

---

## Kubernetes

```bash
kubectl apply -f infrastructure/kubernetes/manifests.yaml
kubectl get pods -n stratus
kubectl logs -n stratus -l app=stratus-api
```

---

## Terraform (AWS)

```bash
cd infrastructure/terraform
terraform init
terraform plan -var="db_password=yourpassword"
terraform apply
```

Provisions: VPC with private/public subnets, RDS PostgreSQL, ElastiCache Redis, S3, ECS cluster, CloudWatch log groups.

---

## Monitoring

- **Prometheus** scrapes the API's `/metrics` endpoint every 15s, along with dedicated `postgres_exporter` and `redis_exporter` containers for database and cache metrics
- **Grafana** dashboards at http://localhost:3001 (admin/admin), connected to Prometheus as a data source
- **Structured logs** in JSON format via Python's logging module

---

## CI/CD

Every push to `main` runs a 6-stage GitHub Actions pipeline:

1. **Backend Lint & Type Check** - Ruff, Black, MyPy
2. **Backend Tests** - pytest against real PostgreSQL + Redis service containers
3. **Validate Migrations** - confirms Alembic migrations match the current models
4. **Frontend Lint & Type Check** - TypeScript strict mode
5. **Frontend Build** - production Vite build
6. **Build & Push Docker Images** - publishes versioned images to Docker Hub on successful merge to `main`

---

## Contributing

This started as a personal learning project to get hands-on with production backend patterns - async APIs, background job queues, observability, and CI/CD. Issues and pull requests are welcome if you'd like to extend it.

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes and ensure `ruff check .`, `black --check .`, `mypy app/`, and `pytest` all pass
4. Open a pull request

---

## License

This project is licensed under the [MIT License](LICENSE).


