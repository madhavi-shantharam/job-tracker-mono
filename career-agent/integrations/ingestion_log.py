import json
import os
from datetime import datetime

INGESTION_LOG_PATH = ".ingestion_log.json"


class IngestionLog:
    def __init__(self, log_path: str = INGESTION_LOG_PATH):
        self._path = log_path
        self._log: dict = {}
        if os.path.exists(log_path):
            try:
                with open(log_path) as f:
                    self._log = json.load(f)
            except (json.JSONDecodeError, OSError):
                self._log = {}

    def is_processed(self, email_id: str) -> bool:
        return email_id in self._log

    def mark_processed(
        self,
        email_id: str,
        status: str,
        company: str = "",
        role: str = "",
    ) -> None:
        self._log[email_id] = {
            "status": status,
            "company": company,
            "role": role,
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }
        self._write_atomically()

    def _write_atomically(self) -> None:
        tmp_path = self._path + ".tmp"
        with open(tmp_path, "w") as f:
            json.dump(self._log, f, indent=2)
        os.replace(tmp_path, self._path)

    def get_stats(self) -> dict:
        counts: dict[str, int] = {"created": 0, "duplicate": 0, "skipped": 0, "error": 0}
        for entry in self._log.values():
            status = entry.get("status", "")
            if status in counts:
                counts[status] += 1
        return {"total_processed": len(self._log), **counts}
