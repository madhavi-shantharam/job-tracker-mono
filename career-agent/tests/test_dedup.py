import pytest

from integrations.dedup import Deduplicator
from parser.models import ParsedApplication


def _make_app(company, role):
    return ParsedApplication(
        company=company,
        role=role,
        confidence=0.95,
        location=None,
        date_applied=None,
        application_url=None,
        ats_name=None,
        email_id="msg1",
        email_subject="Thanks for applying",
        raw_snippet="snippet",
    )


@pytest.fixture
def d():
    return Deduplicator()


# ---------------------------------------------------------------------------
# normalize
# ---------------------------------------------------------------------------


def test_normalize_removes_punctuation(d):
    # "Group" and "Inc" are common suffixes → stripped; leaving only "expedia"
    assert d.normalize("Expedia Group, Inc.") == "expedia"


def test_normalize_lowercases(d):
    # "services" is not a common suffix → preserved
    assert d.normalize("Amazon Web Services") == "amazon web services"


# ---------------------------------------------------------------------------
# is_duplicate
# ---------------------------------------------------------------------------


def test_exact_match_is_duplicate(d):
    app = _make_app("Google", "Software Engineer")
    existing = [{"company": "Google", "role": "Software Engineer"}]
    assert d.is_duplicate(app, existing)


def test_fuzzy_match_is_duplicate(d):
    # "Amazon.com Inc" normalizes to "amazon" (dot splits .com, then "com"+"inc" stripped)
    app = _make_app("Amazon.com Inc", "Software Engineer")
    existing = [{"company": "amazon", "role": "Software Engineer"}]
    assert d.is_duplicate(app, existing)


def test_different_company_not_duplicate(d):
    app = _make_app("Google", "Software Engineer")
    existing = [{"company": "Microsoft", "role": "Software Engineer"}]
    assert not d.is_duplicate(app, existing)


# ---------------------------------------------------------------------------
# similarity_ratio
# ---------------------------------------------------------------------------


def test_similarity_ratio_similar_strings(d):
    ratio = d.similarity_ratio("software engineer", "software engineer ii")
    assert isinstance(ratio, float)
    assert 0.0 <= ratio <= 1.0


def test_similarity_ratio_identical_strings(d):
    assert d.similarity_ratio("google", "google") == 1.0
