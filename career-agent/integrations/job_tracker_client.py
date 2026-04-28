import os
from datetime import date

import requests

from parser.models import ParsedApplication


class JobTrackerClient:
    def __init__(self):
        api_url = os.getenv("JOB_TRACKER_API_URL")
        if not api_url:
            raise RuntimeError("JOB_TRACKER_API_URL not set — check your .env file")
        self._base_url = api_url.rstrip("/")

    def create_application(self, application: ParsedApplication) -> dict:
        url = f"{self._base_url}/api/applications"
        payload = {
            "company": application.company,
            "role": application.role,
            "status": "APPLIED",
            "notes": (
                f"Auto-imported via Gmail poller. "
                f"ATS: {application.ats_name or 'Unknown'}. "
                f"Confidence: {application.confidence:.2f}. "
                f"Subject: {application.email_subject}"
            ),
            "appliedDate": application.date_applied or date.today().isoformat(),
        }
        response = requests.post(
            url, json=payload, headers={"Content-Type": "application/json"}
        )
        if response.status_code == 201:
            return response.json()
        if response.status_code == 409:
            return {"status": "duplicate", "skipped": True}
        if response.status_code == 400:
            print(f"Bad request from backend: {response.text}")
            raise RuntimeError(f"POST /api/applications returned 400: {response.text}")
        print(f"Unexpected status from backend: {response.status_code}")
        raise RuntimeError(
            f"POST /api/applications returned {response.status_code}"
        )

    def get_all_applications(self) -> list[dict]:
        try:
            response = requests.get(f"{self._base_url}/api/applications")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error fetching applications from backend: {e}")
            return []

    def application_exists(self, company: str, role: str) -> bool:
        apps = self.get_all_applications()
        company_lower = company.lower()
        role_lower = role.lower()
        return any(
            app.get("company", "").lower() == company_lower
            and app.get("role", "").lower() == role_lower
            for app in apps
        )
