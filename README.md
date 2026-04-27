# Job Tracker — Monorepo

AI-powered job application tracker with three services:

| Service | Stack | Description |
|---|---|---|
| `backend/` | Java 21, Spring Boot, PostgreSQL | REST API, AWS ECS Fargate |
| `frontend/` | React, TypeScript, Vite | SPA, AWS CloudFront + S3 |
| `career-agent/` | Python, FastAPI, Claude API | Gmail polling, AI parsing |

## Local development
See README in each service directory for setup instructions.
