"""Tests for the central plan-limit enforcement helpers."""

from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from fastapi import HTTPException

from services.plan_limits import (
    PLAN_LIMITS,
    enforce_ai_run_quota,
    enforce_export_format,
    enforce_team_size,
    get_limits,
    get_user_tier,
)


def _user(tier: str | None = "free", uid: str = "u1"):
    return SimpleNamespace(id=uid, subscription_tier=tier)


# ── Export format gating ──────────────────────────────────────────────────


def test_free_user_blocked_from_pdf_export():
    with pytest.raises(HTTPException) as exc:
        enforce_export_format(_user("free"), "pdf")
    assert exc.value.status_code == 402
    assert "Pro" in exc.value.detail


def test_free_user_blocked_from_docx_export():
    with pytest.raises(HTTPException) as exc:
        enforce_export_format(_user("free"), "docx")
    assert exc.value.status_code == 402


def test_pro_user_can_pdf_export():
    enforce_export_format(_user("pro"), "pdf")  # no exception


def test_markdown_export_always_allowed():
    enforce_export_format(_user("free"), "md")
    enforce_export_format(_user(None), "markdown")


# ── Team size gating ──────────────────────────────────────────────────────


def test_free_team_size_limit():
    enforce_team_size(_user("free"), 2)  # below limit
    with pytest.raises(HTTPException) as exc:
        enforce_team_size(_user("free"), 3)
    assert exc.value.status_code == 402
    assert "team members" in exc.value.detail.lower()


def test_enterprise_team_size_unlimited():
    enforce_team_size(_user("enterprise"), 9999)


# ── AI run quota gating ───────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_free_ai_run_quota_blocks_when_exceeded():
    repo = SimpleNamespace(
        count_user_runs_since=AsyncMock(return_value=PLAN_LIMITS["free"]["max_ai_runs_per_month"])
    )
    with pytest.raises(HTTPException) as exc:
        await enforce_ai_run_quota(_user("free"), repo)
    assert exc.value.status_code == 402
    assert "AI runs" in exc.value.detail


@pytest.mark.asyncio
async def test_free_ai_run_quota_allows_when_under_limit():
    repo = SimpleNamespace(count_user_runs_since=AsyncMock(return_value=0))
    await enforce_ai_run_quota(_user("free"), repo)
    repo.count_user_runs_since.assert_awaited_once()


@pytest.mark.asyncio
async def test_pro_ai_run_quota_skips_db_check():
    repo = SimpleNamespace(count_user_runs_since=AsyncMock(return_value=10**9))
    await enforce_ai_run_quota(_user("pro"), repo)
    repo.count_user_runs_since.assert_not_awaited()


# ── Tier normalization ────────────────────────────────────────────────────


def test_unknown_tier_falls_back_to_free():
    assert get_user_tier(SimpleNamespace(subscription_tier="bogus")) == "free"
    assert get_user_tier(None) == "free"
    assert get_limits("bogus")["max_projects"] == PLAN_LIMITS["free"]["max_projects"]


# ── Integration-style test: enforce_and_record_ai_run end-to-end ──────────


class _FakeAiRunRepo:
    """In-memory stand-in for AiRunRepository that records each create_run call."""

    def __init__(self) -> None:
        self.runs: list[dict] = []

    async def create_run(self, **kwargs):
        self.runs.append(kwargs)
        return SimpleNamespace(id=f"run_{len(self.runs)}")

    async def count_user_runs_since(self, user_id: str, since):
        return sum(1 for r in self.runs if r.get("user_id") == user_id)


@pytest.mark.asyncio
async def test_free_user_blocked_after_quota_exhausted_via_record():
    """A free user can record up to max_ai_runs_per_month; the next one is rejected."""
    from services.plan_limits import enforce_and_record_ai_run

    repo = _FakeAiRunRepo()
    user = _user("free", uid="alice")
    limit = PLAN_LIMITS["free"]["max_ai_runs_per_month"]

    for i in range(limit):
        run_id = await enforce_and_record_ai_run(
            user, repo, project_id=f"p{i}", job_type="ai_chat"
        )
        assert run_id is not None

    assert len(repo.runs) == limit

    # The (limit+1)-th call must be rejected with 402 and must NOT create a row.
    with pytest.raises(HTTPException) as exc:
        await enforce_and_record_ai_run(
            user, repo, project_id="px", job_type="ai_chat"
        )
    assert exc.value.status_code == 402
    assert len(repo.runs) == limit


@pytest.mark.asyncio
async def test_pro_user_unlimited_via_record():
    from services.plan_limits import enforce_and_record_ai_run

    repo = _FakeAiRunRepo()
    user = _user("pro", uid="bob")
    for i in range(PLAN_LIMITS["free"]["max_ai_runs_per_month"] + 5):
        await enforce_and_record_ai_run(
            user, repo, project_id="p", job_type="ai_chat"
        )
    assert len(repo.runs) == PLAN_LIMITS["free"]["max_ai_runs_per_month"] + 5
