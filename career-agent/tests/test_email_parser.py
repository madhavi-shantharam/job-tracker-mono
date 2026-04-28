import json

import pytest

from parser.email_parser import EmailParser
from parser.models import ParsedApplication

VALID_RESPONSE = json.dumps(
    {
        "company": "Acme Corp",
        "role": "Software Engineer",
        "location": "Remote",
        "date_applied": "2026-04-27",
        "application_url": None,
        "ats_name": "Greenhouse",
        "confidence": 0.95,
    }
)


def _make_parser(mocker, *, response_text=None, raises=None):
    mocker.patch.dict("os.environ", {"ANTHROPIC_API_KEY": "fake-key"})
    mock_cls = mocker.patch("parser.email_parser.anthropic.Anthropic")
    mock_client = mock_cls.return_value
    if raises:
        mock_client.messages.create.side_effect = raises
    else:
        mock_msg = mocker.MagicMock()
        mock_msg.content = [mocker.MagicMock(text=response_text)]
        mock_client.messages.create.return_value = mock_msg
    return EmailParser()


def test_parse_email_returns_parsed_application(mocker):
    parser = _make_parser(mocker, response_text=VALID_RESPONSE)

    result = parser.parse_email(
        subject="Thank you for applying",
        body="We received your application.",
        email_id="msg123",
        snippet="We received your...",
    )

    assert isinstance(result, ParsedApplication)
    assert result.company == "Acme Corp"
    assert result.role == "Software Engineer"
    assert result.confidence == 0.95


def test_high_confidence_sets_is_confident_true(mocker):
    parser = _make_parser(mocker, response_text=VALID_RESPONSE)

    result = parser.parse_email("Subject", "Body", "id1", "snippet")

    assert result.is_confident is True
    assert result.needs_review is False


def test_low_confidence_sets_needs_review_true(mocker):
    low_conf = json.dumps(
        {
            "company": "Acme Corp",
            "role": "Unknown",
            "location": None,
            "date_applied": None,
            "application_url": None,
            "ats_name": None,
            "confidence": 0.60,
        }
    )
    parser = _make_parser(mocker, response_text=low_conf)

    result = parser.parse_email("Subject", "Body", "id1", "snippet")

    assert result.is_confident is False
    assert result.needs_review is True


def test_claude_api_error_returns_fallback(mocker):
    parser = _make_parser(mocker, raises=Exception("API unavailable"))

    result = parser.parse_email("Subject", "Body", "id1", "snippet")

    assert result.company == "Unknown"
    assert result.needs_review is True


def test_malformed_json_returns_fallback(mocker):
    parser = _make_parser(mocker, response_text="Sorry, I cannot parse this email.")

    result = parser.parse_email("Subject", "Body", "id1", "snippet")

    assert result.company == "Unknown"
    assert result.needs_review is True


def test_markdown_fences_stripped_before_parse(mocker):
    fenced = f"```json\n{VALID_RESPONSE}\n```"
    parser = _make_parser(mocker, response_text=fenced)

    result = parser.parse_email("Subject", "Body", "id1", "snippet")

    assert result.company == "Acme Corp"
    assert result.confidence == 0.95
