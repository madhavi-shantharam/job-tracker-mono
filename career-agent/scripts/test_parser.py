#!/usr/bin/env python3
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv

load_dotenv()

from gmail.client import GmailClient  # noqa: E402
from parser.email_filter import EmailFilter  # noqa: E402
from parser.email_parser import EmailParser  # noqa: E402

_BAR = "━" * 40


def main():
    client = GmailClient()

    print("Fetching emails...")
    messages = client.list_recent_messages(max_results=50, query="application")
    total_fetched = len(messages)
    print(f"Total emails fetched:   {total_fetched}\n")

    email_filter = EmailFilter()
    filtered = email_filter.filter_messages(messages)
    print(f"Passed filter:          {len(filtered)}\n")

    if not filtered:
        print("No confirmation emails found. Adjust the query or filter rules.")
        sys.exit(0)

    parser = EmailParser()
    results = parser.parse_batch(filtered, client)

    print()
    for app in results:
        confident_mark = "✓ (auto-create)" if app.is_confident else "✗ (needs review)"
        print(_BAR)
        print(f"Company:     {app.company}")
        print(f"Role:        {app.role}")
        print(f"Location:    {app.location or '—'}")
        print(f"Date:        {app.date_applied or '—'}")
        print(f"ATS:         {app.ats_name or '—'}")
        print(f"Confidence:  {app.confidence:.2f} {confident_mark}")
        print(f"Review:      {'Yes' if app.needs_review else 'No'}")
        print(f"Subject:     {app.email_subject}")
    print(_BAR)

    high_conf = sum(1 for a in results if a.is_confident)
    needs_review = sum(1 for a in results if a.needs_review)
    print(f"\nTotal emails fetched:    {total_fetched}")
    print(f"Passed filter:           {len(filtered)}")
    print(f"High confidence (≥0.75): {high_conf}")
    print(f"Needs review (<0.75):    {needs_review}")


if __name__ == "__main__":
    main()
