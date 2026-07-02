# AWS Deployment Runbook

Live application: **https://d1g006dg5dsa7c.cloudfront.net**

AWS Account: `832496385907` · Region: `us-west-2`

This replaces the previous deployment (torn down / old account closed). Architecture matches
the original `aws-deployment-guide.docx`, plus an Application Load Balancer added from the
start (the old deployment hit the "ECS task DNS changes on every restart" issue after the
fact — see `job-tracker-complete-report.docx` for that history).

## 1. Architecture

```
USER BROWSER
     |  HTTPS only
     v
CLOUDFRONT  (d1g006dg5dsa7c.cloudfront.net, distribution E3BQTX74AP7XWI)
     |                                  |
     | /api/*                          | /* (everything else)
     v                                  v
ALB (job-tracker-alb)              S3 (private, OAC only)
     |  HTTP :80 -> target group        job-tracker-frontend-832496385907
     v
ECS FARGATE (job-tracker-cluster / job-tracker-backend-service)
  1 task, 0.5 vCPU / 1GB, image from ECR job-tracker-backend
     |
     v
RDS POSTGRESQL 15 (job-tracker-db), db.t3.micro, private (VPC only)
     |
     v
SSM PARAMETER STORE  /job-tracker/{DB_URL,DB_USERNAME,DB_PASSWORD,ANTHROPIC_API_KEY}

Resume uploads: ECS task role -> S3 job-tracker-resumes-832496385907 (private)
```

Difference from the original guide: CloudFront's `/api/*` behavior points at the **ALB**,
not directly at the ECS task's DNS. The ALB gives a stable origin that survives task
restarts/redeploys — CloudFront never needs reconfiguring when ECS replaces a task.

## 2. Resource inventory

| Resource | Name / ID |
|---|---|
| VPC (default) | `vpc-00ffe1a30ee0ed9a0` |
| Security group — ALB | `sg-0a46de0b000f478ae` (80/443 from internet) |
| Security group — ECS | `sg-09d4cc89c1d12e792` (8080 from ALB SG only) |
| Security group — RDS | `sg-06256799eef59f3cb` (5432 from ECS SG only) |
| RDS instance | `job-tracker-db` (PostgreSQL 15.14, db.t3.micro, 20GB, 1-day backup retention — free-tier cap) |
| ECR repo | `832496385907.dkr.ecr.us-west-2.amazonaws.com/job-tracker-backend` |
| ECS cluster | `job-tracker-cluster` |
| ECS service | `job-tracker-backend-service` |
| ECS task family | `job-tracker-backend` |
| ALB | `job-tracker-alb` — `job-tracker-alb-1050013539.us-west-2.elb.amazonaws.com` |
| Target group | `job-tracker-tg` (HTTP :8080, health check `/actuator/health`) |
| S3 — frontend | `job-tracker-frontend-832496385907` (private, CloudFront OAC only) |
| S3 — resumes | `job-tracker-resumes-832496385907` (private, ECS task role only) |
| CloudFront | `E3BQTX74AP7XWI` — `d1g006dg5dsa7c.cloudfront.net` |
| CloudFront OAC | `E3C9TU2VL9YTTS` |
| IAM — ECS execution role | `job-tracker-execution-role` (pulls image, reads SSM, writes CloudWatch logs) |
| IAM — ECS task role | `job-tracker-task-role` (app runtime: S3 access to resume bucket) |
| IAM — GitHub Actions role | `job-tracker-github-actions-role` (OIDC, scoped to this repo's `main` branch) |
| SSM parameters | `/job-tracker/DB_URL`, `/job-tracker/DB_USERNAME`, `/job-tracker/DB_PASSWORD`, `/job-tracker/ANTHROPIC_API_KEY` (all SecureString) |
| CloudWatch log group | `/ecs/job-tracker-backend` |

## 3. CI/CD

Two GitHub Actions workflows, path-filtered for the monorepo:

- **`.github/workflows/deploy-backend.yml`** — triggers on push to `main` touching `backend/**`.
  Runs `mvn test`, builds a `linux/amd64` Docker image via buildx, pushes to ECR tagged with
  the commit SHA and `latest`, pulls the live ECS task definition, swaps in the new image,
  registers a new revision, and deploys with `wait-for-service-stability: true`.
- **`.github/workflows/deploy-frontend.yml`** — triggers on push to `main` touching `frontend/**`.
  Runs `npm ci && npm run build`, syncs `dist/` to S3 (long cache on hashed assets, no-cache on
  `index.html`), invalidates the CloudFront distribution.

**Auth: GitHub OIDC, no stored AWS keys.** Both workflows assume
`job-tracker-github-actions-role` via `aws-actions/configure-aws-credentials`. The role's trust
policy only allows `sts:AssumeRoleWithWebIdentity` from
`repo:madhavi-shantharam/job-tracker-mono:ref:refs/heads/main` — no other repo or branch can
assume it, and there's no long-lived secret to leak or rotate. The role's permissions policy
is scoped to exactly what deploys need (push to the one ECR repo, update the one ECS service,
write to the one S3 bucket, invalidate the one CloudFront distribution) — not the broad
`*FullAccess` policies attached to the human `job-tracker-user`.

`career-agent/` has a workflow stub (`deploy-career-agent.yml`) that runs its Python tests but
does not deploy — that service isn't provisioned in this environment.

## 4. Manual deployment (if you ever need to bypass CI/CD)

```bash
export AWS_PROFILE=job-tracker-user

# Backend
cd backend
docker buildx build --platform linux/amd64 \
  --tag 832496385907.dkr.ecr.us-west-2.amazonaws.com/job-tracker-backend:latest --push .
aws ecs update-service --cluster job-tracker-cluster \
  --service job-tracker-backend-service --force-new-deployment --region us-west-2
aws ecs wait services-stable --cluster job-tracker-cluster \
  --services job-tracker-backend-service --region us-west-2

# Frontend
cd frontend
npm run build
aws s3 sync dist/ s3://job-tracker-frontend-832496385907/ --delete
aws cloudfront create-invalidation --distribution-id E3BQTX74AP7XWI --paths '/*'
```

## 5. Health checks

```bash
# Frontend
curl -s -o /dev/null -w '%{http_code}\n' https://d1g006dg5dsa7c.cloudfront.net/

# API (through CloudFront)
curl -s https://d1g006dg5dsa7c.cloudfront.net/api/applications | python3 -m json.tool

# Backend health (direct to ALB — /actuator/health is not behind the /api/* CloudFront behavior)
curl -s http://job-tracker-alb-1050013539.us-west-2.elb.amazonaws.com/actuator/health

# ECS service status
aws ecs describe-services --cluster job-tracker-cluster \
  --services job-tracker-backend-service \
  --query 'services[0].{Running:runningCount,Desired:desiredCount}'

# Target group health
aws elbv2 describe-target-health \
  --target-group-arn arn:aws:elasticloadbalancing:us-west-2:832496385907:targetgroup/job-tracker-tg/9f0fc6f602f6c02a

# Latest backend logs
LOG=$(aws logs describe-log-streams --log-group-name /ecs/job-tracker-backend \
  --order-by LastEventTime --descending --query 'logStreams[0].logStreamName' --output text)
aws logs get-log-events --log-group-name /ecs/job-tracker-backend \
  --log-stream-name "$LOG" --limit 50 --query 'events[*].message' --output text
```

## 6. Cost-saving stop/restart

Same idea as the original guide — scale down when not job-searching, without deleting anything:

```bash
# Stop (saves ~$14/month on Fargate; RDS free tier covers 750 hrs/month so leaving it running is fine)
aws ecs update-service --cluster job-tracker-cluster \
  --service job-tracker-backend-service --desired-count 0 --region us-west-2
aws rds stop-db-instance --db-instance-identifier job-tracker-db --region us-west-2

# Restart
aws rds start-db-instance --db-instance-identifier job-tracker-db --region us-west-2
aws ecs update-service --cluster job-tracker-cluster \
  --service job-tracker-backend-service --desired-count 1 --region us-west-2
```

Note: RDS auto-resumes after ~7 days if left stopped — AWS restarts it automatically.

**Full teardown** (what most likely happened to the last AWS account — avoid unless you mean
it): delete the CloudFront distribution, S3 buckets, ECS service + cluster, ALB + target
group, RDS instance, ECR repo, SSM parameters, and the IAM roles/OIDC provider. There is no
scripted teardown yet; each of those needs sequential `aws ... delete-*` calls.

## 7. Known gaps / things to revisit

- **RDS backup retention is 1 day, not 7** — the new AWS account is free-tier-restricted; the
  original guide's 7-day retention wasn't accepted at creation time.
- **`S3_RESUME_BUCKET` / resume upload feature** was added to the codebase after the original
  deployment guide was written. It's wired up (bucket + task-role permissions), but the
  bucket has no lifecycle or encryption-at-rest policy beyond default private access — revisit
  before storing real resumes there.
- **No authentication** on the API — anyone with the URL can read/write all data. Same gap
  called out in the original docs.
- **Single ECS task, single-AZ RDS** — no redundancy. Acceptable for a portfolio/demo
  deployment, not for anything real.
- **`career-agent` (Gmail poller) is not deployed** — it only runs locally today.
