#!/usr/bin/env python3
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv

load_dotenv()

from integrations.ingestion_log import IngestionLog  # noqa: E402
from scheduler.poller import GmailPoller  # noqa: E402


def main():
    try:
        poller = GmailPoller()
        summary = poller.poll_once()

        print("\nPoll summary:")
        for key, value in summary.items():
            print(f"  {key}: {value}")

        stats = IngestionLog().get_stats()
        print("\nIngestion log stats:")
        for key, value in stats.items():
            print(f"  {key}: {value}")

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
