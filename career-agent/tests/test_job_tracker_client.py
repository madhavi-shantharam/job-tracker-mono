import os
from datetime import date

import pytest

from integrations.job_tracker_client import JobTrackerClient
from parser.models import ParsedApplication


def _make_app(date_applied=None, ats_name="Greenhouse"):
    return ParsedApplication(
        company="Acme Corp",
        role="Software Engineer",
        confidence=0.95,
        location=None,
        date_applied=date_applied,
        application_url=None,
        ats_name=ats_name,
        email_id="msg1",
        email_subject="Thanks for applying",
        raw_snippet="snippet",
    )


def _client(mocker, api_url="http://localhost:8080"):
    mocker.patch.dict(os.environ, {"JOB_TRACKER_API_URL": api_url})
    return JobTrackerClient()


# ---------------------------------------------------------------------------
# create_application
# ---------------------------------------------------------------------------


def test_create_application_success(mocker):
    client = _client(mocker)
    mock_post = mocker.patch("integrations.job_tracker_client.requests.post")
    mock_post.return_value.status_code = 201
    mock_post.return_value.json.return_value = {"id": 1, "company": "Acme Corp"}

    result = client.create_application(_make_app())

    assert result == {"id": 1, "company": "Acme Corp"}
    body = mock_post.call_args[1]["json"]
    assert mock_post.call_args[0][0] == "http://localhost:8080/api/applications"
    assert body["company"] == "Acme Corp"
    assert body["role"] == "Software Engineer"
    assert body["status"] == "APPLIED"
    assert body["appliedDate"] == date.today().isoformat()


def test_create_application_sets_status_applied(mocker):
    client = _client(mocker)
    mock_post = mocker.patch("integrations.job_tracker_client.requests.post")
    mock_post.return_value.status_code = 201
    mock_post.return_value.json.return_value = {}

    client.create_application(_make_app())

    assert mock_post.call_args[1]["json"]["status"] == "APPLIED"


def test_create_application_409_returns_duplicate_dict(mocker):
    client = _client(mocker)
    mock_post = mocker.patch("integrations.job_tracker_client.requests.post")
    mock_post.return_value.status_code = 409

    result = client.create_application(_make_app())

    assert result == {"status": "duplicate", "skipped": True}


def test_create_application_500_raises_runtime_error(mocker):
    client = _client(mocker)
    mock_post = mocker.patch("integrations.job_tracker_client.requests.post")
    mock_post.return_value.status_code = 500
    mock_post.return_value.text = "Internal Server Error"

    with pytest.raises(RuntimeError):
        client.create_application(_make_app())


# ---------------------------------------------------------------------------
# get_all_applications
# ---------------------------------------------------------------------------


def test_get_all_applications_returns_list(mocker):
    client = _client(mocker)
    mock_get = mocker.patch("integrations.job_tracker_client.requests.get")
    mock_get.return_value.status_code = 200
    mock_get.return_value.json.return_value = [{"id": 1}, {"id": 2}, {"id": 3}]
    mock_get.return_value.raise_for_status.return_value = None

    result = client.get_all_applications()

    assert len(result) == 3


def test_get_all_applications_error_returns_empty_list(mocker):
    client = _client(mocker)
    mocker.patch(
        "integrations.job_tracker_client.requests.get",
        side_effect=ConnectionError("Connection refused"),
    )

    result = client.get_all_applications()

    assert result == []


# ---------------------------------------------------------------------------
# init guard
# ---------------------------------------------------------------------------


def test_missing_api_url_raises_on_init(mocker):
    mocker.patch.dict(os.environ, {"JOB_TRACKER_API_URL": ""})

    with pytest.raises(RuntimeError, match="JOB_TRACKER_API_URL"):
        JobTrackerClient()
