# ☁️ Stratus

**Stratus** is a production-grade cloud infrastructure and deployment management platform. Think Vercel meets Railway — teams use it to manage projects, trigger deployments, and monitor their entire infrastructure from a single, beautiful interface.

---

## 🚀 Features

- **JWT + API Key Authentication** — access tokens, refresh tokens, bcrypt passwords, RBAC (admin / developer / viewer)
- **Project Management** — create, search, filter, paginate projects with slug-based routing
- **Deployment Pipeline** — trigger deployments per environment (dev / staging / prod), view logs, cancel in-flight jobs
- **Analytics Dashboard** — 14-day deployment trends, success rate, recent activity feed
- **Background Tasks** — Celery + Redis for email notifications, cleanup jobs, async processing
- **Caching** — Redis cache with graceful fallback when unavailable
- **Observability** — `/health`, `/ready`, `/live` endpoints; Prometheus metrics; Grafana dashboards
- **Dark Mode** — first-class dark/light theme with Tailwind CSS
- **Responsive UI** — sidebar nav, skeleton loaders, empty states, toast notifications, smooth Framer Motion animations

---

## 🏗 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | FastAPI, SQLAlchemy 2.0 (async), Alembic, Pydantic v2 |
| **Auth** | JWT (python-jose), bcrypt (passlib), API keys |
| **Database** | PostgreSQL 16 |
| **Cache / Queue** | Redis 7, Celery |
| **Frontend** | React 18, TypeScript, Tailwind CSS, Framer Motion |
| **State / Data** | Zustand, TanStack React Query, Recharts |
| **Infrastructure** | Docker Compose, Kubernetes, Terraform (AWS) |
| **CI/CD** | GitHub Actions |
| **Monitoring** | Prometheus, Grafana |

---

## 📁 Project Structure

```
stratus/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/    # Route handlers
│   │   ├── core/                # Config, security, dependencies
│   │   ├── db/                  # Session, Redis cache
│   │   ├── middleware/          # Logging
│   │   ├── models/              # SQLAlchemy ORM models
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   ├── services/            # Business logic layer
│   │   ├── tasks/               # Celery tasks
│   │   └── main.py              # FastAPI application
│   ├── alembic/                 # Database migrations
│   ├── tests/                   # Pytest tests + Locust load tests
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable UI components + layout
│   │   ├── hooks/               # React Query hooks, toast
│   │   ├── lib/                 # Axios client, utils
│   │   ├── pages/               # Route pages (auth, dashboard, etc.)
│   │   ├── store/               # Zustand stores (auth, UI)
│   │   ├── types/               # TypeScript types
│   │   └── App.tsx              # Router + providers
│   ├── Dockerfile
│   └── package.json
├── infrastructure/
│   ├── kubernetes/              # K8s manifests + HPA
│   ├── terraform/               # AWS (VPC, RDS, ElastiCache, S3, ECS)
│   ├── prometheus/              # Scrape config
│   └── grafana/                 # Dashboards + datasources
├── .github/workflows/           # GitHub Actions CI/CD
├── docker-compose.yml
└── README.md
```

---

## ⚡ Quick Start

### Prerequisites
- Docker & Docker Compose
- Node 20+ (for local frontend dev)
- Python 3.12+ (for local backend dev)

### 1. Clone & configure

```bash
git clone https://github.com/yourorg/stratus.git
cd stratus

cp backend/.env.example backend/.env
# Edit backend/.env — set SECRET_KEY at minimum
```

### 2. Start with Docker Compose

```bash
docker compose up -d
```

Services:
| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |
| Grafana | http://localhost:3001 (admin/admin) |
| Prometheus | http://localhost:9090 |

### 3. Create your first account

Open http://localhost:3000/register and sign up.

---

## 🔧 Local Development

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

## 🧪 Testing

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

## 🔑 API Overview

All endpoints are prefixed with `/api/v1`.

| Method | Path | Description |
|--------|------|-------------|
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

**Authentication:** Pass `Authorization: Bearer <token>` or `Authorization: Bearer sk_<api_key>`.

---

## 🐳 Docker

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

## ☸️ Kubernetes

```bash
kubectl apply -f infrastructure/kubernetes/manifests.yaml
kubectl get pods -n stratus
kubectl logs -n stratus -l app=stratus-api
```

---

## 🏗 Terraform (AWS)

```bash
cd infrastructure/terraform
terraform init
terraform plan -var="db_password=yourpassword"
terraform apply
```

Provisions: VPC with private/public subnets, RDS PostgreSQL, ElastiCache Redis, S3, ECS cluster, CloudWatch log groups.

---

## 📊 Monitoring

- **Prometheus** scrapes `/metrics` from the API every 15s
- **Grafana** dashboards at http://localhost:3001 (admin/admin)
- **Structured logs** in JSON format via Python's logging module

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit: `git commit -m 'feat: add my feature'`
4. Push: `git push origin feat/my-feature`
5. Open a Pull Request

---

## 📄 License

MIT — see [LICENSE](LICENSE).

---

Built with ❤️ as a portfolio-quality SaaS platform demonstrating modern full-stack engineering.
