import base64

from google.auth.transport.requests import Request
from googleapiclient.discovery import build

from gmail.auth import load_credentials


class GmailClient:
    def get_service(self):
        creds = load_credentials()
        if not creds.valid:
            creds.refresh(Request())
        return build("gmail", "v1", credentials=creds)

    def list_recent_messages(self, max_results: int = 20, query: str = "") -> list[dict]:
        service = self.get_service()
        result = (
            service.users()
            .messages()
            .list(userId="me", maxResults=max_results, q=query)
            .execute()
        )
        raw_messages = result.get("messages", [])
        if not raw_messages:
            return []

        output = []
        for msg in raw_messages:
            detail = (
                service.users()
                .messages()
                .get(
                    userId="me",
                    id=msg["id"],
                    format="metadata",
                    metadataHeaders=["Subject", "From", "Date"],
                )
                .execute()
            )
            headers = {
                h["name"]: h["value"]
                for h in detail.get("payload", {}).get("headers", [])
            }
            output.append(
                {
                    "id": detail["id"],
                    "threadId": detail["threadId"],
                    "subject": headers.get("Subject", ""),
                    "sender": headers.get("From", ""),
                    "date": headers.get("Date", ""),
                    "snippet": detail.get("snippet", ""),
                }
            )
        return output

    def get_message_body(self, message_id: str) -> str:
        try:
            service = self.get_service()
            msg = (
                service.users()
                .messages()
                .get(userId="me", id=message_id, format="full")
                .execute()
            )
            return self._extract_body(msg.get("payload", {}))
        except Exception:
            return ""

    def _extract_body(self, payload: dict) -> str:
        mime_type = payload.get("mimeType", "")
        parts = payload.get("parts", [])

        if mime_type == "text/plain":
            return self._decode_data(payload.get("body", {}).get("data", ""))

        if mime_type == "text/html" and not parts:
            return self._decode_data(payload.get("body", {}).get("data", ""))

        if parts:
            for part in parts:
                if part.get("mimeType") == "text/plain":
                    body = self._extract_body(part)
                    if body:
                        return body
            for part in parts:
                if part.get("mimeType") == "text/html":
                    body = self._extract_body(part)
                    if body:
                        return body
            for part in parts:
                body = self._extract_body(part)
                if body:
                    return body

        return ""

    def _decode_data(self, data: str) -> str:
        if not data:
            return ""
        try:
            return base64.urlsafe_b64decode(data + "==").decode("utf-8", errors="replace")
        except Exception:
            return ""
