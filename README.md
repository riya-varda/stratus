<div align="center">

# Stratus

**A cloud infrastructure and deployment management platform**

*Think Vercel meets Railway — manage projects, trigger deployments, and monitor your infrastructure from a single dashboard.*

[![CI/CD](https://github.com/riya-varda/stratus/actions/workflows/ci.yml/badge.svg)](https://github.com/riya-varda/stratus/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.12-blue.svg)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688.svg)](https://fastapi.tiangolo.com/)

</div>

---

## Overview

Stratus is a full-stack platform for managing cloud projects and deployments. It includes authentication with role-based access control, a deployment pipeline with environment-based triggers, background job processing, and a complete observability stack — all containerized and shipped through an automated CI/CD pipeline.

## Features

| Category | Details |
|---|---|
| **Authentication** | JWT access + refresh tokens, bcrypt password hashing, API keys, RBAC (admin / developer / viewer) |
| **Project Management** | Create, search, filter, and paginate projects with slug-based routing |
| **Deployments** | Trigger deployments per environment (dev / staging / prod), view logs, cancel in-flight jobs |
| **Analytics** | 14-day deployment trends, success rate tracking, recent activity feed |
| **Background Jobs** | Celery + Redis for email notifications, cleanup tasks, async processing |
| **Caching** | Redis cache with graceful fallback when unavailable |
| **Observability** | Health/readiness/liveness probes, Prometheus metrics, Grafana dashboards with full service coverage |
| **UI/UX** | Dark mode, responsive layout, skeleton loaders, toast notifications, Framer Motion animations |

## Tech Stack

<table>
<tr>
<td valign="top" width="50%">

**Backend**
- FastAPI (async)
- SQLAlchemy 2.0
- Alembic
- Pydantic v2
- PostgreSQL 16
- Redis 7 + Celery

</td>
<td valign="top" width="50%">

**Frontend**
- React 18 + TypeScript
- Tailwind CSS
- Framer Motion
- Zustand
- TanStack React Query
- Recharts

</td>
</tr>
<tr>
<td valign="top">

**Infrastructure**
- Docker Compose (verified, runs full stack)
- Kubernetes manifests (included, not yet deployed)
- Terraform / AWS (included, not yet provisioned)

</td>
<td valign="top">

**CI/CD & Monitoring**
- GitHub Actions (6-stage pipeline, fully green)
- Prometheus + Grafana
- postgres_exporter / redis_exporter

</td>
</tr>
</table>

## Quick Start

**Prerequisites:** Docker & Docker Compose, Node 20+, Python 3.12+

```bash
git clone https://github.com/riya-varda/stratus.git
cd stratus

cp backend/.env.example backend/.env
# Edit backend/.env — set SECRET_KEY at minimum

docker compose up -d
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |
| Grafana | http://localhost:3001 (admin/admin) |
| Prometheus | http://localhost:9090 |

Then open http://localhost:3000/register to create your first account.

<details>
<summary><strong>Local development (without Docker)</strong></summary>

**Backend**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

docker compose up postgres redis -d
cp .env.example .env
alembic upgrade head

uvicorn app.main:app --reload
celery -A app.tasks.celery_app worker --loglevel=info   # separate terminal
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

</details>

<details>
<summary><strong>Running tests</strong></summary>

```bash
# Backend
cd backend
pytest tests/ -v --cov=app

# Load testing
locust -f tests/locustfile.py --host=http://localhost:8000

# Frontend type check
cd frontend
npm run type-check
```

</details>

## API Overview

All endpoints are prefixed with `/api/v1`. Full interactive docs available at `/docs`.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Create account |
| `POST` | `/auth/login` | Login, returns JWT |
| `POST` | `/auth/refresh` | Refresh access token |
| `GET` | `/auth/me` | Current user |
| `GET` | `/projects/` | List projects (paginated) |
| `POST` | `/projects/` | Create project |
| `PATCH` | `/projects/{id}` | Update project |
| `DELETE` | `/projects/{id}` | Delete project |
| `GET` | `/projects/{id}/deployments` | List deployments |
| `POST` | `/projects/{id}/deployments` | Trigger deployment |
| `POST` | `/projects/{id}/deployments/{did}/cancel` | Cancel deployment |
| `GET` | `/analytics/overview` | Dashboard analytics |
| `GET` | `/health` `/ready` `/live` | Health probes |
| `GET` | `/metrics` | Prometheus metrics |

Authenticate with `Authorization: Bearer <jwt>` or `Authorization: Bearer sk_<api_key>`.

## CI/CD Pipeline

Every push to `main` runs a 6-stage GitHub Actions workflow:

1. **Backend Lint & Type Check** — Ruff, Black, MyPy
2. **Backend Tests** — pytest against real PostgreSQL + Redis service containers
3. **Validate Migrations** — confirms Alembic migrations match current models
4. **Frontend Lint & Type Check** — TypeScript strict mode
5. **Frontend Build** — production Vite build
6. **Build & Push Docker Images** — publishes to Docker Hub on merge to `main`

## Deployment

The application runs locally via Docker Compose (see Quick Start above). Infrastructure-as-code for cloud deployment is included in the repo but has not yet been provisioned against a live cloud environment:

<details>
<summary><strong>Docker (verified)</strong></summary>

```bash
docker compose up                                                # dev, hot reload
docker build -t stratus-api --target production ./backend        # backend only
docker build -t stratus-frontend --target production ./frontend  # frontend only
```

</details>

<details>
<summary><strong>Kubernetes (manifests included, not yet deployed)</strong></summary>

Manifests for a Kubernetes deployment are included at `infrastructure/kubernetes/manifests.yaml`, covering the API, frontend, and supporting services with horizontal pod autoscaling.

```bash
kubectl apply -f infrastructure/kubernetes/manifests.yaml
kubectl get pods -n stratus
```

</details>

<details>
<summary><strong>Terraform / AWS (IaC included, not yet provisioned)</strong></summary>

Terraform configuration at `infrastructure/terraform/main.tf` defines a VPC, RDS PostgreSQL, ElastiCache Redis, S3, an ECS cluster, and CloudWatch log groups for a production AWS deployment. Provisioning this creates billable AWS resources, so it has intentionally not been applied yet.

```bash
cd infrastructure/terraform
terraform init
terraform plan -var="db_password=yourpassword"
```

</details>

## Monitoring

Prometheus scrapes the API's `/metrics` endpoint every 15s, alongside dedicated `postgres_exporter` and `redis_exporter` containers for database and cache metrics. Grafana dashboards are available at `localhost:3001`, pre-connected to Prometheus as a data source. All application logs are structured JSON via Python's logging module.

## Contributing

This started as a hands-on project to work with production backend patterns — async APIs, background job queues, observability, and CI/CD. Issues and pull requests are welcome.

```bash
git checkout -b feature/your-feature
# make your changes
ruff check . && black --check . && mypy app/ && pytest   # must all pass
```

## License

[MIT](LICENSE)
