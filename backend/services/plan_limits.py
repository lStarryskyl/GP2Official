"""Central catalog of per-tier subscription limits and enforcement helpers.

A single source of truth for what each subscription tier (Free / Pro / Enterprise)
gets. The pricing page advertises Pro-only features such as advanced AI, PDF /
DOCX export, larger team sizes, and priority support — these limits make those
promises real instead of cosmetic.

Limits use ``None`` to mean "unlimited".
"""

import logging
from datetime import datetime, timedelta
from typing import Any, Dict, Optional

from fastapi import HTTPException, status

from models.user import User

logger = logging.getLogger(__name__)


PLAN_LIMITS: Dict[str, Dict[str, Any]] = {
    "free": {
        "max_projects": 3,
        "max_team_members": 3,
        "max_ai_runs_per_month": 50,
        "advanced_ai": False,
        "exports_pdf_docx": False,
        "priority_support": False,
    },
    "pro": {
        "max_projects": None,
        "max_team_members": 10,
        "max_ai_runs_per_month": None,
        "advanced_ai": True,
        "exports_pdf_docx": True,
        "priority_support": True,
    },
    "enterprise": {
        "max_projects": None,
        "max_team_members": None,
        "max_ai_runs_per_month": None,
        "advanced_ai": True,
        "exports_pdf_docx": True,
        "priority_support": True,
    },
}


def normalize_tier(tier: Optional[str]) -> str:
    key = (tier or "free").lower()
    return key if key in PLAN_LIMITS else "free"


def get_limits(tier: Optional[str]) -> Dict[str, Any]:
    return PLAN_LIMITS[normalize_tier(tier)]


def get_user_tier(user: Optional[User]) -> str:
    if user is None:
        return "free"
    return normalize_tier(getattr(user, "subscription_tier", None))


def _upgrade_message(tier: str, what: str) -> str:
    if tier == "free":
        return f"{what} Upgrade to Pro to unlock this feature."
    return f"{what} Upgrade to Enterprise for expanded limits."


def enforce_export_format(user: User, fmt: str) -> None:
    """Block premium export formats (PDF/DOCX) for tiers that don't include them."""
    fmt_key = fmt.lower()
    if fmt_key not in {"pdf", "docx"}:
        return
    tier = get_user_tier(user)
    if not get_limits(tier).get("exports_pdf_docx"):
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=_upgrade_message(
                tier,
                f"{fmt.upper()} export is a Pro feature on the {tier.title()} plan.",
            ),
        )


def enforce_team_size(user: User, current_member_count: int) -> None:
    """Reject adding another team member when the tier limit is exhausted."""
    tier = get_user_tier(user)
    limit = get_limits(tier).get("max_team_members")
    if limit is not None and current_member_count >= limit:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=_upgrade_message(
                tier,
                f"The {tier.title()} plan allows up to {limit} team members per project.",
            ),
        )


async def enforce_ai_run_quota(user: Optional[User], ai_run_repo) -> None:
    """Reject AI runs once the per-month quota for the user's tier is exhausted."""
    if user is None:
        return
    tier = get_user_tier(user)
    limit = get_limits(tier).get("max_ai_runs_per_month")
    if limit is None:
        return
    used = await ai_run_repo.count_user_runs_since(user.id, _start_of_current_month())
    if used >= limit:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=_upgrade_message(
                tier,
                f"You've used all {limit} AI runs included with the {tier.title()} plan this month.",
            ),
        )


async def record_ai_run(
    ai_run_repo,
    *,
    user: Optional[User],
    project_id: Optional[str],
    job_type: str,
    provider: Optional[str] = None,
    model: Optional[str] = None,
    phase: Optional[str] = None,
) -> Optional[str]:
    """Persist a minimal AI-run audit row so it counts against the user's quota.

    Failures are swallowed: AI run accounting must never block the actual call.
    Returns the run id when successfully created.
    """
    try:
        run = await ai_run_repo.create_run(
            project_id=project_id or "_global",
            user_id=getattr(user, "id", None) if user else None,
            job_type=job_type,
            phase=phase,
            provider=provider,
            model=model,
            prompt=None,
            metadata=None,
        )
        return getattr(run, "id", None)
    except Exception as e:
        # Log loudly so silent quota bypass is observable in production logs.
        # Quota check has already passed at this point; we do not fail-closed
        # because that would deny service on transient DB hiccups, but we make
        # the failure visible.
        logger.error(
            "AI run accounting failed (job_type=%s, user=%s, project=%s): %s",
            job_type,
            getattr(user, "id", None) if user else None,
            project_id,
            e,
        )
        return None


async def enforce_and_record_ai_run(
    user: Optional[User],
    ai_run_repo,
    *,
    project_id: Optional[str],
    job_type: str,
    provider: Optional[str] = None,
    model: Optional[str] = None,
    phase: Optional[str] = None,
) -> Optional[str]:
    """Check quota then record an audit row in one call."""
    await enforce_ai_run_quota(user, ai_run_repo)
    return await record_ai_run(
        ai_run_repo,
        user=user,
        project_id=project_id,
        job_type=job_type,
        provider=provider,
        model=model,
        phase=phase,
    )


def _start_of_current_month() -> datetime:
    now = datetime.utcnow()
    return datetime(now.year, now.month, 1)


async def build_usage_snapshot(
    user: User,
    *,
    active_project_count: int,
    ai_run_repo,
) -> Dict[str, Any]:
    """Return a structured snapshot of the user's usage vs. their plan limits."""
    tier = get_user_tier(user)
    limits = get_limits(tier)

    ai_used = await ai_run_repo.count_user_runs_since(user.id, _start_of_current_month())

    def _entry(used: int, limit: Optional[int]) -> Dict[str, Any]:
        return {
            "used": used,
            "limit": limit,
            "unlimited": limit is None,
            "remaining": None if limit is None else max(limit - used, 0),
        }

    return {
        "tier": tier,
        "limits": limits,
        "projects": _entry(active_project_count, limits.get("max_projects")),
        "team_members_per_project": _entry(0, limits.get("max_team_members")),
        "ai_runs_this_month": _entry(ai_used, limits.get("max_ai_runs_per_month")),
        "features": {
            "advanced_ai": bool(limits.get("advanced_ai")),
            "exports_pdf_docx": bool(limits.get("exports_pdf_docx")),
            "priority_support": bool(limits.get("priority_support")),
        },
    }
