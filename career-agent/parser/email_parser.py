import json
import os
import sys

import anthropic

from gmail.client import GmailClient
from parser.models import ParsedApplication


class EmailParser:
    SYSTEM_PROMPT = """
    You are an expert at parsing job application confirmation emails.
    Extract structured information from the email and return ONLY valid JSON.
    Do not include any explanation, markdown, or text outside the JSON object.
    """

    USER_PROMPT_TEMPLATE = """
    Extract job application details from this confirmation email.

    Email subject: {subject}
    Email body:
    {body}

    Return a JSON object with exactly these fields:
    {{
      "company": "company name that posted the job",
      "role": "exact job title as written in the email",
      "location": "job location or null if not mentioned",
      "date_applied": "application date in YYYY-MM-DD format or null",
      "application_url": "direct URL to application status page or null",
      "ats_name": "name of ATS system (Workday/Greenhouse/Lever/iCIMS/Taleo/SmartRecruiters/Other) or null",
      "confidence": 0.95
    }}

    confidence scoring rules:
    - 0.9-1.0: clear confirmation email with company name and role both present
    - 0.7-0.89: confirmation email but missing company OR role
    - 0.5-0.69: looks like a confirmation but content is vague or ambiguous
    - 0.0-0.49: not sure this is a real application confirmation
    """

    def __init__(self):
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise RuntimeError("ANTHROPIC_API_KEY not set in environment")
        self._client = anthropic.Anthropic(api_key=api_key)

    def parse_email(
        self,
        subject: str,
        body: str,
        email_id: str,
        snippet: str,
    ) -> ParsedApplication:
        def _fallback() -> ParsedApplication:
            return ParsedApplication(
                company="Unknown",
                role="Unknown",
                confidence=0.0,
                location=None,
                date_applied=None,
                application_url=None,
                ats_name=None,
                email_id=email_id,
                email_subject=subject,
                raw_snippet=snippet,
            )

        try:
            prompt = self.USER_PROMPT_TEMPLATE.format(subject=subject, body=body)
            message = self._client.messages.create(
                model="claude-sonnet-4-5",
                max_tokens=500,
                system=self.SYSTEM_PROMPT,
                messages=[{"role": "user", "content": prompt}],
            )
            raw = message.content[0].text.strip()

            # Strip markdown fences if Claude wraps the JSON
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            raw = raw.strip()

            data = json.loads(raw)
            return ParsedApplication(
                company=data.get("company", "Unknown"),
                role=data.get("role", "Unknown"),
                confidence=float(data.get("confidence", 0.0)),
                location=data.get("location"),
                date_applied=data.get("date_applied"),
                application_url=data.get("application_url"),
                ats_name=data.get("ats_name"),
                email_id=email_id,
                email_subject=subject,
                raw_snippet=snippet,
            )
        except Exception:
            return _fallback()

    def parse_batch(
        self,
        messages: list[dict],
        client: GmailClient,
    ) -> list[ParsedApplication]:
        results = []
        total = len(messages)
        for i, msg in enumerate(messages, 1):
            subject = msg.get("subject", "")
            print(f"Parsing [{i}/{total}]: {subject}")
            try:
                body = client.get_message_body(msg["id"])
                result = self.parse_email(
                    subject=subject,
                    body=body,
                    email_id=msg["id"],
                    snippet=msg.get("snippet", ""),
                )
            except Exception as e:
                print(f"  Warning: failed to process {msg.get('id', '?')}: {type(e).__name__}", file=sys.stderr)
                result = ParsedApplication(
                    company="Unknown",
                    role="Unknown",
                    confidence=0.0,
                    location=None,
                    date_applied=None,
                    application_url=None,
                    ats_name=None,
                    email_id=msg.get("id", ""),
                    email_subject=subject,
                    raw_snippet=msg.get("snippet", ""),
                )
            results.append(result)
        return results
