import os
from datetime import datetime

from apscheduler.schedulers.blocking import BlockingScheduler

from gmail.client import GmailClient
from integrations.dedup import Deduplicator
from integrations.ingestion_log import IngestionLog
from integrations.job_tracker_client import JobTrackerClient
from parser.email_filter import EmailFilter
from parser.email_parser import EmailParser


class GmailPoller:
    def __init__(self):
        self._gmail_client = GmailClient()
        self._email_filter = EmailFilter()
        self._email_parser = EmailParser()
        self._job_tracker_client = JobTrackerClient()
        self._deduplicator = Deduplicator()
        self._ingestion_log = IngestionLog()
        self._poll_interval = int(os.getenv("POLL_INTERVAL_MINUTES", "5"))
        self._gmail_query = os.getenv(
            "GMAIL_QUERY", "subject:application OR subject:applied"
        )

    def poll_once(self) -> dict:
        messages: list = []
        filtered: list = []
        new_messages: list = []
        created = duplicate = skipped = errors = 0

        try:
            # Step 1 — Fetch
            messages = self._gmail_client.list_recent_messages(
                max_results=50, query=self._gmail_query
            )

            # Step 2 — Filter by subject/sender heuristics
            filtered = self._email_filter.filter_messages(messages)

            # Step 3 — Drop already-processed message IDs
            new_messages = [
                m for m in filtered
                if not self._ingestion_log.is_processed(m["id"])
            ]
            print(
                f"Poll cycle: {len(messages)} fetched, "
                f"{len(filtered)} filtered, {len(new_messages)} new"
            )

            # Step 4 — Parse with Claude
            applications = self._email_parser.parse_batch(
                new_messages, self._gmail_client
            )

            # Step 5 — Process each parsed application
            for application in applications:
                try:
                    if application.needs_review:
                        self._ingestion_log.mark_processed(
                            application.email_id, "skipped",
                            application.company, application.role,
                        )
                        skipped += 1
                        continue

                    existing = self._job_tracker_client.get_all_applications()
                    if self._deduplicator.is_duplicate(application, existing):
                        self._ingestion_log.mark_processed(
                            application.email_id, "duplicate",
                            application.company, application.role,
                        )
                        duplicate += 1
                        print(
                            f"  Duplicate skipped: {application.company} — {application.role}"
                        )
                        continue

                    self._job_tracker_client.create_application(application)
                    self._ingestion_log.mark_processed(
                        application.email_id, "created",
                        application.company, application.role,
                    )
                    created += 1
                    print(f"  Created: {application.company} — {application.role}")

                except Exception as e:
                    self._ingestion_log.mark_processed(
                        application.email_id, "error",
                        application.company, application.role,
                    )
                    errors += 1
                    print(f"  Error processing {application.email_id}: {e}")

        except Exception as e:
            print(f"Poll cycle error: {e}")

        return {
            "fetched": len(messages),
            "filtered": len(filtered),
            "new": len(new_messages),
            "created": created,
            "duplicate": duplicate,
            "skipped": skipped,
            "errors": errors,
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }

    def start(self):
        scheduler = BlockingScheduler()

        # Run one cycle immediately before entering the schedule loop
        summary = self.poll_once()
        self._print_summary(summary)

        scheduler.add_job(
            self._scheduled_poll,
            "interval",
            minutes=self._poll_interval,
        )

        try:
            scheduler.start()
        except KeyboardInterrupt:
            scheduler.shutdown()
            print("Poller stopped")

    def _scheduled_poll(self):
        self._print_summary(self.poll_once())

    def _print_summary(self, summary: dict) -> None:
        ts = summary["timestamp"]
        print(
            f"[{ts}] Created: {summary['created']} | "
            f"Duplicate: {summary['duplicate']} | "
            f"Skipped: {summary['skipped']} | "
            f"Errors: {summary['errors']}"
        )
