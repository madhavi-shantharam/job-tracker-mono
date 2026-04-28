import base64
import json
import os

import pytest
from botocore.exceptions import ClientError

from gmail.auth import load_credentials, store_refresh_token
from gmail.client import GmailClient


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

FAKE_CREDS_JSON = json.dumps(
    {
        "installed": {
            "client_id": "fake-client-id",
            "client_secret": "fake-client-secret",
            "token_uri": "https://oauth2.googleapis.com/token",
        }
    }
)

_PARAM_NOT_FOUND = ClientError(
    {"Error": {"Code": "ParameterNotFound", "Message": "Parameter not found"}},
    "GetParameter",
)


def _mock_ssm(mocker, *, get_return=None, get_raises=None):
    mock_ssm = mocker.MagicMock()
    if get_raises:
        mock_ssm.get_parameter.side_effect = get_raises
    elif get_return is not None:
        mock_ssm.get_parameter.return_value = {"Parameter": {"Value": get_return}}
    mocker.patch("gmail.auth.boto3.Session").return_value.client.return_value = mock_ssm
    return mock_ssm


# ---------------------------------------------------------------------------
# store_refresh_token
# ---------------------------------------------------------------------------


def test_store_token_uses_correct_ssm_path(mocker):
    mock_ssm = _mock_ssm(mocker)
    mocker.patch.dict(
        os.environ, {"SSM_GMAIL_TOKEN_PATH": "/job-tracker/gmail/refresh-token"}
    )

    store_refresh_token("fake-token")

    mock_ssm.put_parameter.assert_called_once_with(
        Name="/job-tracker/gmail/refresh-token",
        Value="fake-token",
        Type="SecureString",
        Overwrite=True,
    )


# ---------------------------------------------------------------------------
# load_credentials — happy path
# ---------------------------------------------------------------------------


def test_load_token_from_ssm(mocker):
    fake_token = "fake-refresh-token"
    _mock_ssm(mocker, get_return=fake_token)
    mocker.patch("os.path.exists", return_value=True)
    mocker.patch.dict(os.environ, {"GMAIL_CREDENTIALS_PATH": "/fake/credentials.json"})
    mocker.patch("builtins.open", mocker.mock_open(read_data=FAKE_CREDS_JSON))

    creds = load_credentials()

    assert creds.refresh_token == fake_token


# ---------------------------------------------------------------------------
# load_credentials — SSM token missing
# ---------------------------------------------------------------------------


def test_missing_ssm_token_raises_runtime_error(mocker):
    _mock_ssm(mocker, get_raises=_PARAM_NOT_FOUND)
    mocker.patch("os.path.exists", return_value=True)
    mocker.patch.dict(os.environ, {"GMAIL_CREDENTIALS_PATH": "/fake/credentials.json"})

    with pytest.raises(RuntimeError, match="authorize_gmail.py"):
        load_credentials()


# ---------------------------------------------------------------------------
# list_recent_messages
# ---------------------------------------------------------------------------


def _make_mock_service(mocker, *, messages=None, message_detail=None):
    service = mocker.MagicMock()
    msgs_res = service.users.return_value.messages.return_value
    msgs_res.list.return_value.execute.return_value = {"messages": messages or []}
    if message_detail is not None:
        msgs_res.get.return_value.execute.return_value = message_detail
    return service


def test_list_recent_messages_returns_correct_shape(mocker):
    detail = {
        "id": "msg1",
        "threadId": "thread1",
        "snippet": "Test snippet",
        "payload": {
            "headers": [
                {"name": "Subject", "value": "Test Subject"},
                {"name": "From", "value": "sender@example.com"},
                {"name": "Date", "value": "Mon, 1 Jan 2024 00:00:00 +0000"},
            ]
        },
    }
    service = _make_mock_service(
        mocker,
        messages=[{"id": "msg1", "threadId": "thread1"}],
        message_detail=detail,
    )
    client = GmailClient()
    mocker.patch.object(client, "get_service", return_value=service)

    result = client.list_recent_messages(max_results=5)

    assert isinstance(result, list)
    assert len(result) == 1
    msg = result[0]
    assert set(msg.keys()) == {"id", "threadId", "subject", "sender", "date", "snippet"}
    assert msg["id"] == "msg1"
    assert msg["subject"] == "Test Subject"
    assert msg["sender"] == "sender@example.com"
    assert msg["date"] == "Mon, 1 Jan 2024 00:00:00 +0000"
    assert msg["snippet"] == "Test snippet"


def test_list_recent_messages_empty_inbox(mocker):
    service = _make_mock_service(mocker, messages=[])
    client = GmailClient()
    mocker.patch.object(client, "get_service", return_value=service)

    result = client.list_recent_messages()

    assert result == []


# ---------------------------------------------------------------------------
# get_message_body
# ---------------------------------------------------------------------------


def test_get_message_body_decodes_base64url(mocker):
    original_text = "Hello, this is a test email body."
    encoded = base64.urlsafe_b64encode(original_text.encode()).decode().rstrip("=")

    service = mocker.MagicMock()
    service.users.return_value.messages.return_value.get.return_value.execute.return_value = {
        "id": "msg1",
        "payload": {
            "mimeType": "text/plain",
            "body": {"data": encoded},
        },
    }
    client = GmailClient()
    mocker.patch.object(client, "get_service", return_value=service)

    result = client.get_message_body("msg1")

    assert result == original_text


def test_get_message_body_returns_empty_string_on_missing_body(mocker):
    service = mocker.MagicMock()
    service.users.return_value.messages.return_value.get.return_value.execute.return_value = {
        "id": "msg1",
        "payload": {
            "mimeType": "text/plain",
            "body": {},
        },
    }
    client = GmailClient()
    mocker.patch.object(client, "get_service", return_value=service)

    result = client.get_message_body("msg1")

    assert result == ""
