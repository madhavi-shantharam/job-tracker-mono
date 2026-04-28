import os

import pytest

from integrations.ingestion_log import IngestionLog


# ---------------------------------------------------------------------------
# is_processed
# ---------------------------------------------------------------------------


def test_new_email_not_processed(tmp_path):
    log = IngestionLog(str(tmp_path / "log.json"))
    assert log.is_processed("abc123") is False


def test_mark_and_check_processed(tmp_path):
    log = IngestionLog(str(tmp_path / "log.json"))
    log.mark_processed("abc123", "created", "Google", "SWE")
    assert log.is_processed("abc123") is True


# ---------------------------------------------------------------------------
# get_stats
# ---------------------------------------------------------------------------


def test_get_stats_empty_log(tmp_path):
    log = IngestionLog(str(tmp_path / "log.json"))
    stats = log.get_stats()
    assert stats["total_processed"] == 0
    assert stats["created"] == 0
    assert stats["duplicate"] == 0
    assert stats["error"] == 0
    assert stats["skipped"] == 0


def test_get_stats_correct_counts(tmp_path):
    log = IngestionLog(str(tmp_path / "log.json"))
    log.mark_processed("id1", "created", "A", "r")
    log.mark_processed("id2", "created", "B", "r")
    log.mark_processed("id3", "created", "C", "r")
    log.mark_processed("id4", "duplicate", "D", "r")
    log.mark_processed("id5", "error", "E", "r")

    stats = log.get_stats()
    assert stats["total_processed"] == 5
    assert stats["created"] == 3
    assert stats["duplicate"] == 1
    assert stats["error"] == 1
    assert stats["skipped"] == 0


# ---------------------------------------------------------------------------
# persistence
# ---------------------------------------------------------------------------


def test_log_persists_across_instances(tmp_path):
    path = str(tmp_path / "log.json")
    log_a = IngestionLog(path)
    log_a.mark_processed("abc123", "created", "Google", "SWE")

    log_b = IngestionLog(path)
    assert log_b.is_processed("abc123") is True


def test_atomic_write_creates_file(tmp_path):
    path = str(tmp_path / "log.json")
    log = IngestionLog(path)
    log.mark_processed("abc123", "created", "Google", "SWE")
    assert os.path.exists(path)
