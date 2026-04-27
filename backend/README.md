# Job Tracker — AI-Powered Application Manager

A full-stack Spring Boot application that helps job seekers track applications
and uses the Claude AI API to analyze resume-to-job-description fit.

## Tech Stack

- **Backend**: Java 25, Spring Boot 4, Spring Data JPA, Hibernate
- **Database**: PostgreSQL 15 (Docker)
- **AI Integration**: Anthropic Claude API (claude-sonnet-4-5)
- **Build tool**: Maven
- **Infrastructure**: Docker

## Features

- Full CRUD for job applications with status tracking (APPLIED → PHONE_SCREEN → INTERVIEW → OFFER/REJECTED)
- AI-powered resume analysis: match percentage, missing keywords, suggested edits
- Input validation, structured error handling, and graceful degradation on AI failures

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/applications` | Create a new job application |
| GET | `/api/applications` | Get all applications |
| GET | `/api/applications/{id}` | Get application by ID |
| PUT | `/api/applications/{id}` | Update application |
| DELETE | `/api/applications/{id}` | Delete application |
| POST | `/api/analyze` | Analyze resume vs job description using Claude AI |

## Running Locally

### Prerequisites
- Java 17+
- Docker
- Maven
- Anthropic API key

### Setup

1. Clone the repository:
```bash
   git clone https://github.com/madhavi-shantharam/job-tracker.git
   cd job-tracker
```

2. Start PostgreSQL via Docker:
```bash
   docker run --name job-tracker-db \
     -e POSTGRES_USER=jobtracker \
     -e POSTGRES_PASSWORD=jobtracker123 \
     -e POSTGRES_DB=jobtracker \
     -p 5432:5432 \
     -d postgres:15
```

3. Set your Anthropic API key:
```bash
   export ANTHROPIC_API_KEY=your-key-here
```

4. Run the application:
```bash
   ./mvnw spring-boot:run
```

The app starts on `http://localhost:8080`.

### Sample API Request — Resume Analysis

```bash
curl -X POST http://localhost:8080/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "jobDescription": "Looking for a Java SDE II with Spring Boot, AWS, and microservices experience",
    "resumeText": "4 years experience at Amazon with Java, Spring Boot, REST APIs, and AWS ECS"
  }'
```

## Project Structure

```
src/main/java/com/madhavi/job_tracker/
├── controller/    # HTTP layer — request/response handling
├── service/       # Business logic + Claude API integration
├── repository/    # Spring Data JPA — database access
├── model/         # JPA entities — maps to DB tables
├── dto/           # Data Transfer Objects — API contracts
└── exception/     # Custom exceptions + error handling
```

## Related

Frontend repository: https://github.com/madhavi-shantharam/job-tracker-ui