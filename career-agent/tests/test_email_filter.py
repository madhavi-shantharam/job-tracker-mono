import pytest

from parser.email_filter import EmailFilter


@pytest.fixture
def f():
    return EmailFilter()


def test_subject_match_case_insensitive(f):
    assert f.is_confirmation_email(
        "Application Received for Software Engineer", "hr@somecompany.com"
    )


def test_sender_match_greenhouse(f):
    assert f.is_confirmation_email("Interview Invitation", "no-reply@greenhouse.io")


def test_sender_match_workday(f):
    assert f.is_confirmation_email("Position Update", "recruiting@myworkdayjobs.com")


def test_no_match_returns_false(f):
    assert not f.is_confirmation_email(
        "Your Amazon order has shipped", "ship@amazon.com"
    )


def test_filter_messages_returns_only_matches(f):
    messages = [
        {"id": "1", "subject": "Thank you for applying to Acme", "sender": "hr@acme.com", "threadId": "t1", "date": "", "snippet": ""},
        {"id": "2", "subject": "Your order is on the way", "sender": "noreply@shop.com", "threadId": "t2", "date": "", "snippet": ""},
        {"id": "3", "subject": "Dinner tonight?", "sender": "friend@gmail.com", "threadId": "t3", "date": "", "snippet": ""},
        {"id": "4", "subject": "Application Confirmation", "sender": "jobs@company.com", "threadId": "t4", "date": "", "snippet": ""},
        {"id": "5", "subject": "Weekly newsletter", "sender": "info@news.com", "threadId": "t5", "date": "", "snippet": ""},
    ]
    result = f.filter_messages(messages)
    assert len(result) == 2
    assert result[0]["id"] == "1"
    assert result[1]["id"] == "4"


def test_amazon_jobs_sender_match(f):
    assert f.is_confirmation_email("Job Application", "no-reply@amazon.jobs")
