#!/usr/bin/env python3
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv

load_dotenv()

from scheduler.poller import GmailPoller  # noqa: E402

_BAR = "━" * 37


def main():
    interval = os.getenv("POLL_INTERVAL_MINUTES", "5")
    api_url = os.getenv("JOB_TRACKER_API_URL", "(not set)")
    query = os.getenv("GMAIL_QUERY", "subject:application OR subject:applied")

    print(_BAR)
    print("Gmail Poller — Job Tracker Auto-Import")
    print(f"Interval:    {interval} minutes")
    print(f"Backend:     {api_url}")
    print(f"Gmail query: {query}")
    print("Press Ctrl+C to stop")
    print(_BAR)

    GmailPoller().start()


if __name__ == "__main__":
    main()
