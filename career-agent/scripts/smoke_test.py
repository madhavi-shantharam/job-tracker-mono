#!/usr/bin/env python3
import os
import sys

# Add career-agent/ root to path so `gmail` package is importable from scripts/
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv

load_dotenv()

from gmail.client import GmailClient  # noqa: E402


def main():
    try:
        client = GmailClient()
        messages = client.list_recent_messages(max_results=10)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

    for msg in messages:
        print(f"Subject: {msg['subject']}")
        print(f"From:    {msg['sender']}")
        print(f"Date:    {msg['date']}")
        print("---")

    print(f"Smoke test passed — {len(messages)} messages retrieved")


if __name__ == "__main__":
    main()
