# ScrapeTrack

**Live Demo:**
- Frontend: https://scrapetrack-dashboard.vercel.app/
- Backend API: https://scrapetrack-dashboard.onrender.com

A distributed web scraping platform with React frontend, Express.js backend, Redis caching, and RabbitMQ job queue.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                          │
│                         localhost:80                             │
└───────────────────────────────┬─────────────────────────────────┘
                                │ HTTP
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Server (Express)                        │
│                        localhost:3001                            │
└──────────┬────────────────────┬────────────────────┬────────────┘
           │                    │                    │
           ▼                    ▼                    ▼
    ┌────────────┐      ┌────────────┐       ┌────────────┐
    │  MongoDB   │      │   Redis    │       │  RabbitMQ  │
    │  (Atlas)   │      │ (Upstash)  │       │(CloudAMQP) │
    └────────────┘      └────────────┘       └─────┬──────┘
                                                   │
                                                   ▼
                                           ┌────────────┐
                                           │  Workers   │
                                           │ (Scraper)  │
                                           └────────────┘
```

## Quick Start

### Option 1: Docker Compose (Recommended)

```bash
# Using cloud services (Upstash Redis + CloudAMQP)
docker-compose up -d

# Using local Redis + RabbitMQ
docker-compose -f docker-compose.local.yml up -d
```


**For local development:**
Services will be available at:
- **Frontend**: http://localhost
- **API**: http://localhost:3001
- **RabbitMQ UI** (local only): http://localhost:15672

**For production/hosted deployment, use:**
- **Frontend**: https://scrapetrack-dashboard.vercel.app/
- **API**: https://scrapetrack-dashboard.onrender.com

### Option 2: Manual Setup

```bash
# Terminal 1: Backend API
cd scrapetrack-backend
npm install
npm run dev

# Terminal 2: Worker
cd scrapetrack-backend
npm run worker:dev

# Terminal 3: Frontend
cd scrapetrack-dashboard
npm install
npm run dev
```

## Environment Variables

Create `scrapetrack-backend/.env`:

```env
PORT=3001
MONGODB_URI=mongodb+srv://...
REDIS_URL=rediss://...@upstash.io:6379
RABBITMQ_URL=amqps://...@cloudamqp.com/...
```

## Docker Commands

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Scale workers
docker-compose up -d --scale worker=4

# Rebuild specific service
docker-compose up -d --build api
```

## Project Structure

```
scrapetrack/
├── docker-compose.yml          # Cloud services (Upstash + CloudAMQP)
├── docker-compose.local.yml    # Local Redis + RabbitMQ
├── scrapetrack-backend/
│   ├── Dockerfile
│   ├── src/
│   │   ├── index.js           # API server
│   │   ├── worker.js          # Queue consumer
│   │   ├── routes/jobs.js     # REST endpoints
│   │   ├── services/
│   │   │   ├── scraper.js     # Web scraping logic
│   │   │   ├── redis.js       # Caching & rate limiting
│   │   │   └── queue.js       # RabbitMQ integration
│   │   └── models/Job.js      # MongoDB schema
│   └── package.json
└── scrapetrack-dashboard/
    ├── Dockerfile
    ├── nginx.conf
    ├── src/
    │   ├── pages/Dashboard.jsx
    │   ├── components/
    │   └── services/api.js
    └── package.json
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/jobs` | Create scraping job |
| `GET` | `/api/jobs` | List all jobs |
| `GET` | `/api/jobs/:id` | Get job with results |
| `GET` | `/api/jobs/:id/status` | Fast status (Redis) |
| `DELETE` | `/api/jobs/:id` | Delete job |
| `GET` | `/api/health` | Service health check |

## Features

- **Redis Caching**: Same URL cached for 1 hour
- **Rate Limiting**: 10 requests/minute per domain
- **Job Queue**: Async processing via RabbitMQ
- **Worker Scaling**: Run multiple workers for parallelism
- **Auto-Retry**: Failed jobs requeued once

## License

MIT
