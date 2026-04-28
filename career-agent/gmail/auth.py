import json
import os

import boto3
from botocore.exceptions import ClientError
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]


def _ssm_token_path() -> str:
    return os.getenv("SSM_GMAIL_TOKEN_PATH", "/job-tracker/gmail/refresh-token")


def _ssm_client():
    session = boto3.Session(
        profile_name=os.getenv("AWS_PROFILE"),
        region_name=os.getenv("AWS_REGION"),
    )
    return session.client("ssm")


def store_refresh_token(refresh_token: str) -> None:
    ssm = _ssm_client()
    ssm.put_parameter(
        Name=_ssm_token_path(),
        Value=refresh_token,
        Type="SecureString",
        Overwrite=True,
    )


def _load_refresh_token_from_ssm() -> str:
    ssm = _ssm_client()
    try:
        response = ssm.get_parameter(Name=_ssm_token_path(), WithDecryption=True)
        return response["Parameter"]["Value"]
    except ClientError as e:
        error_code = e.response["Error"]["Code"]
        if error_code == "ParameterNotFound":
            raise RuntimeError(
                f"SSM parameter '{_ssm_token_path()}' not found. "
                "Run scripts/authorize_gmail.py to complete OAuth consent and store the token."
            ) from None
        raise RuntimeError(
            f"Failed to load token from SSM (code: {error_code}). "
            "Run scripts/authorize_gmail.py to re-authorize."
        ) from e


def load_credentials() -> Credentials:
    credentials_path = os.getenv("GMAIL_CREDENTIALS_PATH")
    if not credentials_path or not os.path.exists(credentials_path):
        raise RuntimeError(
            f"credentials.json not found at {credentials_path!r}. "
            "Set GMAIL_CREDENTIALS_PATH to a valid path."
        )

    refresh_token = _load_refresh_token_from_ssm()

    with open(credentials_path) as f:
        client_config = json.load(f)

    client_data = client_config.get("installed") or client_config.get("web")
    if not client_data:
        raise RuntimeError(
            "credentials.json has unrecognized structure — expected 'installed' or 'web' key."
        )

    return Credentials(
        token=None,
        refresh_token=refresh_token,
        token_uri=client_data["token_uri"],
        client_id=client_data["client_id"],
        client_secret=client_data["client_secret"],
        scopes=SCOPES,
    )


def run_oauth_flow() -> str:
    credentials_path = os.getenv("GMAIL_CREDENTIALS_PATH")
    if not credentials_path or not os.path.exists(credentials_path):
        raise RuntimeError(
            f"credentials.json not found at {credentials_path!r}. "
            "Set GMAIL_CREDENTIALS_PATH to a valid path and re-run this script."
        )
    flow = InstalledAppFlow.from_client_secrets_file(credentials_path, SCOPES)
    creds = flow.run_local_server(port=0)
    return creds.refresh_token
