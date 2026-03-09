# ScrapeTrack Backend

Express.js + MongoDB + Redis + RabbitMQ backend for the ScrapeTrack distributed web scraping platform.

## Architecture

```
┌────────────┐     ┌─────────────┐     ┌────────────┐
│ API Server │────▶│  RabbitMQ   │────▶│  Workers   │
│   :3001    │     │   (Queue)   │     │ (Scraper)  │
└────────────┘     └─────────────┘     └────────────┘
       │                                      │
       └──────────────┬───────────────────────┘
                      ▼
              ┌─────────────┐
              │    Redis    │
              │  (Cache)    │
              └─────────────┘
```

## Prerequisites

- Node.js 18+
- MongoDB (Atlas or local)
- Redis (Upstash or local)
- RabbitMQ (CloudAMQP or local)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment:
   ```bash
   # Create .env with:
   PORT=3001
   MONGODB_URI=mongodb+srv://...
   REDIS_URL=rediss://...@upstash.io:6379
   RABBITMQ_URL=amqps://...@cloudamqp.com/...
   ```

3. Start the API server:
   ```bash
   npm run dev   # Development with auto-reload
   npm start     # Production
   ```

4. Start worker(s) in separate terminal(s):
   ```bash
   npm run worker      # Production
   npm run worker:dev  # Development with auto-reload
   ```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/jobs` | Create a new scraping job |
| GET | `/api/jobs` | List all jobs |
| GET | `/api/jobs/:id` | Get job details with results |
| GET | `/api/jobs/:id/status` | Fast status polling (Redis) |
| DELETE | `/api/jobs/:id` | Delete a job |
| GET | `/api/jobs/queue/stats` | Queue statistics |
| GET | `/api/health` | Health check with service status |

## Docker

Build and run with Docker:

```bash
# Build image
docker build -t scrapetrack-api .

# Run API
docker run -p 3001:3001 --env-file .env scrapetrack-api

# Run Worker
docker run --env-file .env scrapetrack-api node src/worker.js
```

See root `docker-compose.yml` for full orchestration.

## Example

```bash
# Create a job
curl -X POST http://localhost:3001/api/jobs \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'

# List jobs
curl http://localhost:3001/api/jobs

# Get job by ID
curl http://localhost:3001/api/jobs/{job_id}

# Check health
curl http://localhost:3001/api/health
```
