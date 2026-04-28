#!/usr/bin/env python3
import os
import sys

# Add career-agent/ root to path so `gmail` package is importable from scripts/
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv

load_dotenv()

from gmail.auth import run_oauth_flow, store_refresh_token  # noqa: E402


def main():
    credentials_path = os.getenv("GMAIL_CREDENTIALS_PATH")
    if not credentials_path or not os.path.exists(credentials_path):
        print(
            f"Error: credentials.json not found at {credentials_path!r}.\n"
            "Set GMAIL_CREDENTIALS_PATH in your .env file to the path of your "
            "Google OAuth credentials.json file.",
            file=sys.stderr,
        )
        sys.exit(1)

    print("Opening browser for OAuth consent...")
    refresh_token = run_oauth_flow()
    store_refresh_token(refresh_token)

    ssm_path = os.getenv("SSM_GMAIL_TOKEN_PATH", "/job-tracker/gmail/refresh-token")
    print(f"Refresh token stored at {ssm_path}")


if __name__ == "__main__":
    main()
