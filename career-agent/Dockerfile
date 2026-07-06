# Career Agent — Gmail poller
# Long-running process (no exposed port): polls Gmail on a schedule and
# pushes parsed applications to the job-tracker backend's API.
FROM python:3.11-slim

WORKDIR /app

# Ensure print() output reaches CloudWatch immediately instead of
# sitting in Python's stdout buffer since stdout isn't a TTY here
ENV PYTHONUNBUFFERED=1

# Copy dependency descriptor first so Docker caches this layer
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source (credentials.json is written into this directory
# by the CI workflow, from the GMAIL_CREDENTIALS_JSON secret, before build)
COPY . .

# Run as non-root
RUN addgroup --system appgroup \
    && adduser --system --ingroup appgroup appuser \
    && chown -R appuser:appgroup /app
USER appuser

CMD ["python", "scripts/run_poller.py"]
