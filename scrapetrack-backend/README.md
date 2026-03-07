# ScrapeTrack Backend

Express.js + MongoDB backend for the ScrapeTrack web scraping platform.

## Prerequisites

- Node.js 18+
- MongoDB running locally (or update `.env` with your connection string)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment:
   ```bash
   cp .env.example .env
   # Edit .env if needed
   ```

3. Start MongoDB (if not running)

4. Run the server:
   ```bash
   npm run dev   # Development with auto-reload
   npm start     # Production
   ```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/jobs` | Create a new scraping job |
| GET | `/api/jobs` | List all jobs |
| GET | `/api/jobs/:id` | Get job details with results |
| DELETE | `/api/jobs/:id` | Delete a job |

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
```
