"""
Testing Phase Service
=====================
Two AI-driven agents that operate on functional requirements:

1. TestDataGeneratorAgent  – produces specific, actionable test scenarios + edge-case data
2. CoverageAuditorAgent    – semantic gap analysis between requirements and tests
"""

import json
import logging
import random
import re
import string
import time
from typing import Any, Dict, List, Optional

from config import settings
from repositories.artifact_repository import ArtifactRepository
from repositories.requirement_repository import RequirementRepository
from repositories.ai_run_repository import AiRunRepository
from services.openai_client import call_openai

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# JSON extraction helper
# ---------------------------------------------------------------------------

def _extract_json(text: str) -> Any:
    """Try several strategies to pull valid JSON from LLM output."""
    m = re.search(r"```(?:json)?\s*(\{.*?\}|\[.*?\])\s*```", text, re.DOTALL)
    if m:
        return json.loads(m.group(1))
    m = re.search(r"(\{.*\})", text, re.DOTALL)
    if m:
        return json.loads(m.group(1))
    m = re.search(r"(\[.*\])", text, re.DOTALL)
    if m:
        return json.loads(m.group(1))
    raise ValueError("No valid JSON found in response")


# ---------------------------------------------------------------------------
# 1. Test Data Generator Agent
# ---------------------------------------------------------------------------

TESTDATA_SYSTEM_PROMPT = """You are an expert QA engineer who writes real, specific, executable test cases.

CRITICAL RULES:
- DO NOT write generic tests like "provide valid input" or "verify the expected outcome".
- You MUST read each requirement carefully and create tests that reference the EXACT constraints mentioned.
- For example, if a requirement says "password must be at least 8 characters with a special character", your tests MUST include:
  * A password with exactly 7 characters (should FAIL)
  * A password with exactly 8 characters including a special character (should PASS)
  * A password with 8+ characters but NO special character (should FAIL)
  * A password with only special characters (edge case)
  * An empty password (should FAIL)
  * A password with 100+ characters (boundary)

- For each requirement generate AT LEAST 5 test scenarios covering:
  * 1-2 positive (happy path with valid data)
  * 1-2 negative (invalid data that should be rejected)
  * 1-2 edge cases (boundary values, empty inputs, extremes)
  * 1 boundary test (exact limits: min-1, min, max, max+1)

- test_steps must be SPECIFIC, not generic. Example:
  BAD:  ["Provide valid input", "Submit", "Verify outcome"]
  GOOD: ["Enter password 'Ab1!defg' (8 chars, has letter+number+special)", "Click Register", "Verify account is created and user is redirected to dashboard"]

- test_data must contain CONCRETE values. Example:
  BAD:  {"input": "valid_sample"}
  GOOD: {"password": "Ab1!defg", "expected": "pass", "reason": "8 chars with uppercase, lowercase, digit, and special char"}

- expected_result must state the SPECIFIC system behavior, not "system handles it gracefully".

ALWAYS return valid JSON in this EXACT format (no extra text before or after):
{
  "scenarios": [
    {
      "scenario_id": "TS-001",
      "requirement_id": "<id of the requirement>",
      "requirement_title": "<title>",
      "scenario_type": "positive|negative|edge_case|boundary",
      "title": "Short descriptive title of the test",
      "description": "What this test verifies",
      "preconditions": ["precondition 1"],
      "test_steps": ["specific step 1", "specific step 2", "specific step 3"],
      "expected_result": "Specific expected behavior",
      "test_data": [
        {"field": "concrete_value", "expected": "pass|fail", "reason": "why"}
      ],
      "priority": "high|medium|low"
    }
  ],
  "datasets": [
    {
      "requirement_id": "<id>",
      "requirement_title": "<title>",
      "data_description": "What this dataset tests",
      "columns": ["input", "expected_result", "test_type", "reason"],
      "rows": [
        {"input": "concrete_value", "expected_result": "pass", "test_type": "positive", "reason": "meets all criteria"},
        {"input": "concrete_value", "expected_result": "fail", "test_type": "negative", "reason": "violates X constraint"}
      ],
      "edge_cases": [
        {"input": "extreme_value", "expected_result": "fail|pass", "reason": "Tests specific edge condition"}
      ],
      "notes": "Key observations about this requirement's testability"
    }
  ],
  "summary": {
    "total_scenarios": 10,
    "total_edge_cases": 5,
    "coverage_notes": "Brief note on coverage"
  }
}

Do NOT include commentary outside the JSON block."""


async def generate_test_data(
    project_id: str,
    requirements: List[Dict[str, Any]],
    include_edge_cases: bool = True,
    include_boundary: bool = True,
    max_rows: int = 10,
    user_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Generate synthetic test data and scenarios from functional requirements."""

    ai_run_repo = AiRunRepository()

    req_lines = []
    for i, req in enumerate(requirements, 1):
        rid = req.get("id") or req.get("requirement_id") or f"REQ-{i:03d}"
        title = req.get("title", "Untitled")
        desc = req.get("description", "")
        priority = req.get("priority", "medium")
        req_lines.append(
            f"- [{rid}] (Priority: {priority}) {title}\n  Description: {desc}"
        )

    requirements_text = "\n".join(req_lines)

    prompt = f"""Analyze these functional requirements and generate SPECIFIC, CONCRETE test scenarios.

READ EACH REQUIREMENT CAREFULLY. Extract the exact rules, constraints, thresholds, and conditions mentioned.
Then create test cases that directly validate those specific rules.

REQUIREMENTS ({len(requirements)} functional requirements):
{requirements_text}

INSTRUCTIONS:
- For EACH requirement, generate at least 5 test scenarios
- Each scenario must have CONCRETE test data with real values (not placeholders)
- Test steps must reference the actual UI elements or API endpoints implied by the requirement
- Include boundary value analysis: if a requirement says "minimum 8 characters", test with 7, 8, and 9
- Include equivalence partitioning: valid class, invalid class, boundary class
- If a requirement mentions multiple conditions (e.g., "letters AND numbers AND special chars"), test each condition independently being missing
- Maximum data rows per requirement: {max_rows}

Generate the test data now."""

    run_entry = await ai_run_repo.create_run(
        project_id=project_id,
        user_id=user_id,
        job_type="testing",
        phase="testing",
        provider="openai",
        model=settings.openai_model,
        prompt=prompt[:500],
        metadata={"agent": "TestDataGenerator", "requirement_count": len(requirements)},
    )

    started_at = time.perf_counter()

    try:
        if not settings.openai_api_key:
            logger.info("No OpenAI key - generating smart placeholder test data")
            result = _smart_placeholder_test_data(requirements)
        else:
            raw = await call_openai(prompt, system=TESTDATA_SYSTEM_PROMPT, max_tokens=4096)
            result = _extract_json(raw)

        duration = int((time.perf_counter() - started_at) * 1000)
        await ai_run_repo.complete_run(
            run_entry.id, status="completed", response=json.dumps(result)[:2000], duration_ms=duration
        )

        # Also store as artifact so coverage audit can find it
        artifact_repo = ArtifactRepository()
        await artifact_repo.upsert_artifact(
            project_id=project_id,
            artifact_type="PHASE_TESTING_DATA",
            title="AI-Generated Test Data",
            content_json=result,
            metadata={"phase": "testing", "agent": "TestDataGenerator"},
        )

        return result

    except Exception as exc:
        duration = int((time.perf_counter() - started_at) * 1000)
        logger.error("Test data generation failed: %s", exc)
        await ai_run_repo.complete_run(
            run_entry.id, status="failed", error_message=str(exc), duration_ms=duration
        )
        return _smart_placeholder_test_data(requirements)


# ---------------------------------------------------------------------------
# 2. Coverage Auditor Agent
# ---------------------------------------------------------------------------

COVERAGE_SYSTEM_PROMPT = """You are an expert QA lead performing a requirement-to-test coverage audit.

For each requirement, determine:
- "covered" - at least 2 test scenarios directly validate the core logic AND edge cases
- "partially_covered" - tests exist but miss important negative/boundary cases
- "orphaned" - NO test scenario addresses this requirement

Be STRICT:
- If only the happy path is tested, mark as "partially_covered" and explain what's missing
- gap_reason must be SPECIFIC: "Missing test for password shorter than 8 characters" not "Missing edge cases"
- Recommendations must reference specific requirement IDs and specific missing test types

ALWAYS return valid JSON in this EXACT format:
{
  "entries": [
    {
      "requirement_id": "<id>",
      "requirement_title": "<title>",
      "requirement_type": "functional|non_functional",
      "priority": "high|medium|low",
      "status": "covered|partially_covered|orphaned",
      "test_scenario_count": 2,
      "matched_scenarios": ["TS-001", "TS-003"],
      "gap_reason": "Specific description of what is not tested"
    }
  ],
  "summary": {
    "total_requirements": 10,
    "covered": 6,
    "partially_covered": 2,
    "orphaned": 2,
    "coverage_percentage": 70.0
  },
  "recommendations": [
    "Specific actionable recommendation referencing requirement ID"
  ]
}

Do NOT include commentary outside the JSON block."""


async def run_coverage_audit(
    project_id: str,
    requirements: List[Dict[str, Any]],
    test_scenarios: List[Dict[str, Any]],
    include_non_functional: bool = False,
    user_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Run semantic coverage audit comparing requirements to test scenarios."""

    ai_run_repo = AiRunRepository()

    req_lines = []
    filtered_reqs = []
    for req in requirements:
        rtype = req.get("type", "functional")
        if not include_non_functional and rtype != "functional":
            continue
        filtered_reqs.append(req)
        rid = req.get("id") or req.get("requirement_id") or "?"
        title = req.get("title", "Untitled")
        desc = req.get("description", "")
        priority = req.get("priority", "medium")
        req_lines.append(f"- [{rid}] ({rtype}, {priority}) {title}: {desc}")

    scenario_lines = []
    for sc in test_scenarios:
        sid = sc.get("scenario_id", "?")
        stitle = sc.get("title", "Untitled")
        stype = sc.get("scenario_type", "positive")
        req_ref = sc.get("requirement_id", "?")
        sdesc = sc.get("description", "")
        scenario_lines.append(f"- [{sid}] ({stype}) for [{req_ref}]: {stitle} - {sdesc}")

    prompt = f"""Perform a requirement-to-test coverage audit.

REQUIREMENTS ({len(req_lines)} items):
{chr(10).join(req_lines)}

EXISTING TEST SCENARIOS ({len(scenario_lines)} items):
{chr(10).join(scenario_lines) if scenario_lines else "No test scenarios generated yet - mark ALL requirements as orphaned."}

For each requirement:
1. Find which test scenarios map to it (by requirement_id AND by semantic similarity)
2. Evaluate whether the tests cover positive, negative, edge, and boundary cases
3. Assign coverage status
4. Write specific gap reasons for anything not fully covered"""

    run_entry = await ai_run_repo.create_run(
        project_id=project_id,
        user_id=user_id,
        job_type="testing",
        phase="testing",
        provider="openai",
        model=settings.openai_model,
        prompt=prompt[:500],
        metadata={"agent": "CoverageAuditor", "requirement_count": len(req_lines), "scenario_count": len(scenario_lines)},
    )

    started_at = time.perf_counter()

    try:
        if not settings.openai_api_key:
            logger.info("No OpenAI key - generating smart placeholder coverage audit")
            result = _smart_placeholder_coverage(filtered_reqs, test_scenarios)
        else:
            raw = await call_openai(prompt, system=COVERAGE_SYSTEM_PROMPT, max_tokens=4096)
            result = _extract_json(raw)

        duration = int((time.perf_counter() - started_at) * 1000)
        await ai_run_repo.complete_run(
            run_entry.id, status="completed", response=json.dumps(result)[:2000], duration_ms=duration
        )
        return result

    except Exception as exc:
        duration = int((time.perf_counter() - started_at) * 1000)
        logger.error("Coverage audit failed: %s", exc)
        await ai_run_repo.complete_run(
            run_entry.id, status="failed", error_message=str(exc), duration_ms=duration
        )
        return _smart_placeholder_coverage(filtered_reqs, test_scenarios)


# ---------------------------------------------------------------------------
# Smart placeholder generators
# ---------------------------------------------------------------------------

def _extract_constraints(description: str) -> Dict[str, Any]:
    """Parse a requirement description to find testable constraints."""
    constraints = {
        "min_length": None,
        "max_length": None,
        "requires_numbers": False,
        "requires_letters": False,
        "requires_special_chars": False,
        "requires_uppercase": False,
        "requires_lowercase": False,
        "age_minimum": None,
        "age_maximum": None,
        "keywords": [],
    }

    desc_lower = description.lower()

    # Length constraints
    for pattern, key in [
        (r'(?:at least|minimum|min)\s*(\d+)\s*(?:characters?|chars?|digits?|letters?)', 'min_length'),
        (r'(\d+)\s*(?:characters?|chars?)\s*(?:or more|minimum|at least)', 'min_length'),
        (r'(?:at most|maximum|max|up to)\s*(\d+)\s*(?:characters?|chars?)', 'max_length'),
        (r'(?:exactly|must be)\s*(\d+)\s*(?:characters?|chars?)', 'min_length'),
        (r'(\d+)\s*characters?', 'min_length'),
    ]:
        m = re.search(pattern, desc_lower)
        if m:
            constraints[key] = int(m.group(1))
            break

    if re.search(r'number|digit|numeric|\d', desc_lower):
        constraints['requires_numbers'] = True
    if re.search(r'letter|alpha', desc_lower):
        constraints['requires_letters'] = True
    if re.search(r'special\s*char|symbol|[!@#$%^&*]', desc_lower):
        constraints['requires_special_chars'] = True
    if re.search(r'upper\s*case|capital', desc_lower):
        constraints['requires_uppercase'] = True
    if re.search(r'lower\s*case', desc_lower):
        constraints['requires_lowercase'] = True

    age_match = re.search(r'(?:over|above|at least|minimum age|older than)\s*(\d+)', desc_lower)
    if age_match:
        constraints['age_minimum'] = int(age_match.group(1))

    for kw in ['login', 'register', 'password', 'email', 'upload', 'search', 'delete', 'create', 'update', 'file', 'payment', 'role', 'permission']:
        if kw in desc_lower:
            constraints['keywords'].append(kw)

    return constraints


def _build_valid_input(min_length: int, constraints: Dict[str, Any]) -> str:
    """Build a valid input string that satisfies all detected constraints."""
    parts = []
    if constraints.get('requires_uppercase') or constraints.get('requires_letters'):
        parts.append("A")
    if constraints.get('requires_lowercase') or constraints.get('requires_letters'):
        parts.append("b")
    if constraints.get('requires_numbers'):
        parts.append("1")
    if constraints.get('requires_special_chars'):
        parts.append("!")
    base = "".join(parts)
    filler = "cdef0234"
    while len(base) < min_length:
        base += filler[len(base) % len(filler)]
    return base[:max(min_length, len(base))]


def _smart_placeholder_test_data(requirements: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Generate requirement-aware test data by parsing the actual descriptions."""
    scenarios = []
    datasets = []
    counter = 1
    total_edge_cases = 0

    for req in requirements:
        rid = req.get("id") or req.get("requirement_id") or f"REQ-{counter:03d}"
        title = req.get("title", "Untitled Requirement")
        desc = req.get("description", "")
        priority = req.get("priority", "medium")
        constraints = _extract_constraints(desc)

        req_scenarios = []
        req_rows = []
        req_edge_cases = []
        columns = []

        # --- Password / input length requirements ---
        if constraints['min_length'] is not None:
            min_len = constraints['min_length']
            field = "password" if "password" in constraints['keywords'] else "input"
            columns = [field, "expected_result", "test_type", "reason"]
            valid = _build_valid_input(min_len, constraints)

            # TC: valid input
            req_scenarios.append(_scenario(counter, rid, title, "positive",
                f"Valid {field} with {min_len} chars meeting all criteria",
                f"Verify a {field} with exactly {min_len} characters and all required types is accepted.",
                [f"Enter {field}: '{valid}'", "Submit the form", f"Verify the system accepts the {field}"],
                f"System accepts the {field} and proceeds successfully.",
                [{field: valid, "expected": "pass", "reason": f"{min_len} chars with all required types"}], "high"))
            req_rows.append({field: valid, "expected_result": "pass", "test_type": "positive", "reason": f"Valid: {min_len} chars, all types"})
            counter += 1

            # TC: one char short
            short = valid[:min_len - 1] if min_len > 1 else ""
            req_scenarios.append(_scenario(counter, rid, title, "negative",
                f"{field.title()} with {min_len - 1} chars (below minimum)",
                f"Verify a {field} with {min_len - 1} characters is rejected.",
                [f"Enter {field}: '{short}' ({min_len - 1} chars)", "Submit the form", "Verify validation error appears"],
                f"System shows error: '{field.title()} must be at least {min_len} characters.'",
                [{field: short, "expected": "fail", "reason": f"Only {min_len - 1} chars, need {min_len}"}], "high"))
            req_rows.append({field: short, "expected_result": "fail", "test_type": "negative", "reason": f"Too short: {min_len - 1} chars"})
            counter += 1

            # TC: empty
            req_scenarios.append(_scenario(counter, rid, title, "negative",
                f"Empty {field} field",
                f"Verify empty {field} is rejected.",
                [f"Leave {field} empty", "Submit the form", "Verify required-field error"],
                f"System shows error: '{field.title()} is required.'",
                [{field: "", "expected": "fail", "reason": "Empty input"}], "high"))
            req_rows.append({field: "", "expected_result": "fail", "test_type": "negative", "reason": "Empty input"})
            counter += 1

            # TC: no special char
            if constraints['requires_special_chars']:
                no_sp = "Abcdef12"[:min_len] if min_len <= 8 else "Abcdef12" + "a" * (min_len - 8)
                req_scenarios.append(_scenario(counter, rid, title, "negative",
                    f"{field.title()} without special character",
                    f"Verify a {field} with no special character is rejected despite meeting length.",
                    [f"Enter {field}: '{no_sp}' (letters+numbers, NO special char)", "Submit", "Verify special-char error"],
                    f"System shows error: 'Must contain at least one special character.'",
                    [{field: no_sp, "expected": "fail", "reason": "No special character"}], "high"))
                req_rows.append({field: no_sp, "expected_result": "fail", "test_type": "negative", "reason": "Missing special char"})
                counter += 1

            # TC: no numbers
            if constraints['requires_numbers']:
                no_num = "Abcdefg!"[:min_len] if min_len <= 8 else "Abcdefg!" + "h" * (min_len - 8)
                req_scenarios.append(_scenario(counter, rid, title, "negative",
                    f"{field.title()} without numbers",
                    f"Verify a {field} with no digits is rejected.",
                    [f"Enter {field}: '{no_num}' (letters+special, NO digits)", "Submit", "Verify number-required error"],
                    f"System shows error: 'Must contain at least one number.'",
                    [{field: no_num, "expected": "fail", "reason": "No digits"}], "medium"))
                req_rows.append({field: no_num, "expected_result": "fail", "test_type": "negative", "reason": "Missing digits"})
                counter += 1

            # TC: no letters
            if constraints['requires_letters']:
                no_let = "12345678!"[:min_len] if min_len <= 9 else "12345678!" + "0" * (min_len - 9)
                req_scenarios.append(_scenario(counter, rid, title, "negative",
                    f"{field.title()} without letters",
                    f"Verify a {field} with no letters is rejected.",
                    [f"Enter {field}: '{no_let}' (numbers+special, NO letters)", "Submit", "Verify letter-required error"],
                    f"System shows error: 'Must contain at least one letter.'",
                    [{field: no_let, "expected": "fail", "reason": "No letters"}], "medium"))
                req_rows.append({field: no_let, "expected_result": "fail", "test_type": "negative", "reason": "Missing letters"})
                counter += 1

            # Edge cases
            req_edge_cases.append({field: valid * 25, "expected_result": "depends", "reason": f"Very long input (200+ chars) - tests max length"})
            req_edge_cases.append({field: "'; DROP TABLE users; --", "expected_result": "fail", "reason": "SQL injection attempt"})
            req_edge_cases.append({field: " " * min_len, "expected_result": "fail", "reason": f"Only whitespace ({min_len} spaces)"})
            req_edge_cases.append({field: "<script>alert(1)</script>", "expected_result": "fail", "reason": "XSS injection attempt"})
            total_edge_cases += len(req_edge_cases)

        # --- Age requirements ---
        elif constraints['age_minimum'] is not None:
            min_age = constraints['age_minimum']
            columns = ["age", "expected_result", "test_type", "reason"]

            req_scenarios.append(_scenario(counter, rid, title, "positive",
                f"User exactly {min_age} years old",
                f"Verify user aged exactly {min_age} is accepted.",
                [f"Enter DOB making user exactly {min_age}", "Submit", "Verify success"],
                f"Registration succeeds - user meets minimum age {min_age}.",
                [{"age": min_age, "expected": "pass", "reason": f"Exactly {min_age}"}], "high"))
            req_rows.append({"age": str(min_age), "expected_result": "pass", "test_type": "positive", "reason": f"Exactly {min_age}"})
            counter += 1

            req_scenarios.append(_scenario(counter, rid, title, "boundary",
                f"User {min_age - 1} years old (below minimum)",
                f"Verify user aged {min_age - 1} is rejected.",
                [f"Enter DOB making user {min_age - 1}", "Submit", "Verify age error"],
                f"System shows error: 'Must be at least {min_age} years old.'",
                [{"age": min_age - 1, "expected": "fail", "reason": f"Only {min_age - 1}"}], "high"))
            req_rows.append({"age": str(min_age - 1), "expected_result": "fail", "test_type": "boundary", "reason": f"Below minimum"})
            counter += 1

            req_scenarios.append(_scenario(counter, rid, title, "edge_case",
                "User with age 0", "Verify age 0 is rejected.",
                ["Enter today as DOB", "Submit", "Verify rejection"],
                f"System rejects - age 0 below minimum {min_age}.",
                [{"age": 0, "expected": "fail", "reason": "Age 0"}], "medium"))
            req_rows.append({"age": "0", "expected_result": "fail", "test_type": "edge_case", "reason": "Age 0"})
            counter += 1

            req_edge_cases = [
                {"age": "150", "expected_result": "fail", "reason": "Unrealistic age"},
                {"age": "-5", "expected_result": "fail", "reason": "Negative age"},
                {"age": "abc", "expected_result": "fail", "reason": "Non-numeric age"},
            ]
            total_edge_cases += len(req_edge_cases)

        # --- Generic requirement ---
        else:
            columns = ["input", "expected_result", "test_type", "reason"]
            samples = _generate_context_inputs(title, desc)

            for sample in samples:
                req_scenarios.append(_scenario(counter, rid, title, sample["type"],
                    sample["title"],
                    sample["description"],
                    sample["steps"],
                    sample["expected_result"],
                    [{sample["input_label"]: sample["input_value"], "expected": sample["pass_fail"], "reason": sample["reason"]}],
                    sample.get("priority", priority)))
                req_rows.append({
                    "input": sample["input_value"],
                    "expected_result": sample["pass_fail"],
                    "test_type": sample["type"],
                    "reason": sample["reason"],
                })
                counter += 1

            # Edge cases based on context
            for ec in _generate_context_edge_cases(title, desc):
                req_edge_cases.append(ec)
            total_edge_cases += len(req_edge_cases)

        if not columns:
            columns = ["input", "expected_result", "test_type", "reason"]

        active_constraints = {k: v for k, v in constraints.items() if v and v != [] and v is not False}
        datasets.append({
            "requirement_id": rid,
            "requirement_title": title,
            "data_description": f"Test data for: {title}",
            "columns": columns,
            "rows": req_rows,
            "edge_cases": req_edge_cases,
            "notes": f"Detected constraints: {json.dumps(active_constraints)}" if active_constraints else "No specific constraints detected - using generic test patterns.",
        })
        scenarios.extend(req_scenarios)

    return {
        "scenarios": scenarios,
        "datasets": datasets,
        "summary": {
            "total_scenarios": len(scenarios),
            "total_edge_cases": total_edge_cases,
            "coverage_notes": f"Generated {len(scenarios)} scenarios for {len(requirements)} requirements. Configure OPENAI_API_KEY for AI-powered generation.",
        },
    }


def _rand_string(length: int, chars: str = string.ascii_letters) -> str:
    return "".join(random.choice(chars) for _ in range(length))

def _rand_email() -> str:
    names = ["john.doe", "sarah.test", "user_42", "admin.demo", "test.account"]
    domains = ["example.com", "testmail.org", "demo.io"]
    return f"{random.choice(names)}@{random.choice(domains)}"

def _rand_name() -> str:
    firsts = ["Ahmed", "Sara", "Omar", "Lina", "Khalid", "Dana", "Hamza", "Noor"]
    lasts = ["Smith", "Johnson", "Ahmad", "Ali", "Brown", "Wilson", "Hassan", "Nasser"]
    return f"{random.choice(firsts)} {random.choice(lasts)}"


def _generate_context_inputs(title: str, desc: str) -> List[Dict[str, Any]]:
    """Generate concrete, context-aware test inputs based on requirement keywords."""
    t = (title + " " + desc).lower()
    samples = []

    # --- Login / Authentication ---
    if any(kw in t for kw in ["login", "sign in", "authenticate", "credential"]):
        samples = [
            {"type": "positive", "title": f"Successful login with valid credentials",
             "description": f"Test login with a registered email and correct password.",
             "steps": [f"Enter email: '@example.com'", "Click Login", "Verify redirect to dashboard"],
             "expected_result": "User is logged in and redirected to the dashboard.",
             "input_label": "email / password", "input_value": "@example.com / Str0ng!Pass", "pass_fail": "pass", "reason": "Valid registered credentials", "priority": "high"},
            {"type": "negative", "title": f"Login with unregistered email",
             "description": f"Test login with an email that does not exist in the system.",
             "steps": ["Enter email: '@nowhere.com'", "Click Login", "Verify error message"],
             "expected_result": "System shows error: 'Invalid email or password.'",
             "input_label": "email", "input_value": "@nowhere.com", "pass_fail": "fail", "reason": "Email not registered in the system", "priority": "high"},
            {"type": "negative", "title": f"Login with wrong password",
             "description": f"Test login with correct email but incorrect password.",
             "steps": ["Enter email: '@example.com'", "Click Login", "Verify error message"],
             "expected_result": "System shows error: 'Invalid email or password.'",
             "input_label": "password", "input_value": "wrongpass", "pass_fail": "fail", "reason": "Correct email but wrong password", "priority": "high"},
            {"type": "negative", "title": f"Login with empty fields",
             "description": f"Test login with both fields empty.",
             "steps": ["Leave email and password empty", "Click Login", "Verify validation errors"],
             "expected_result": "System shows: 'Email is required' and 'Password is required'.",
             "input_label": "email / password", "input_value": "(empty) / (empty)", "pass_fail": "fail", "reason": "Both fields left empty", "priority": "high"},
            {"type": "edge_case", "title": f"Login with SQL injection in email",
             "description": f"Test that the login form sanitizes input against SQL injection.",
             "steps": ["Enter email: \"admin'--\"", "Enter password: 'anything'", "Click Login", "Verify no SQL error, just login failure"],
             "expected_result": "System rejects input safely without exposing database errors.",
             "input_label": "email", "input_value": "admin'--", "pass_fail": "fail", "reason": "SQL injection attempt — must be sanitized", "priority": "high"},
        ]

    # --- Registration / Sign Up ---
    elif any(kw in t for kw in ["register", "sign up", "create account", "new user"]):
        samples = [
            {"type": "positive", "title": f"Successful registration with valid data",
             "description": f"Test registration with all valid fields.",
             "steps": [f"Enter name: '{_rand_name()}'", f"Enter email: '{_rand_email()}'", "Click Register", "Verify account created"],
             "expected_result": "Account is created and user receives confirmation.",
             "input_label": "name / email", "input_value": f"{_rand_name()} / {_rand_email()}", "pass_fail": "pass", "reason": "All fields valid", "priority": "high"},
            {"type": "negative", "title": f"Registration with already-used email",
             "description": f"Test registration with an email that already exists.",
             "steps": ["Enter email: '@example.com'", "Fill other fields normally", "Click Register", "Verify duplicate email error"],
             "expected_result": "System shows error: 'This email is already registered.'",
             "input_label": "email", "input_value": "@example.com", "pass_fail": "fail", "reason": "Email already exists in the system", "priority": "high"},
            {"type": "negative", "title": f"Registration with invalid email format",
             "description": f"Test registration with a malformed email.",
             "steps": ["Enter email: 'not-an-email'", "Fill other fields normally", "Click Register", "Verify email validation error"],
             "expected_result": "System shows error: 'Please enter a valid email address.'",
             "input_label": "email", "input_value": "not-an-email", "pass_fail": "fail", "reason": "Invalid email format (missing @ and domain)", "priority": "high"},
            {"type": "edge_case", "title": f"Registration with very long name (200 chars)",
             "description": f"Test max length handling for name field.",
             "steps": [f"Enter name: '{'A' * 200}'", "Fill other fields normally", "Click Register", "Verify system handles gracefully"],
             "expected_result": "System either truncates or rejects with max length error.",
             "input_label": "name", "input_value": "A" * 200, "pass_fail": "fail", "reason": "Name exceeds reasonable length limit", "priority": "medium"},
        ]

    # --- Email ---
    elif any(kw in t for kw in ["email", "mail", "notification", "send"]):
        samples = [
            {"type": "positive", "title": f"Valid email address accepted",
             "description": f"Test with a properly formatted email.",
             "steps": [f"Enter email: '@company.com'", "Submit", "Verify accepted"],
             "expected_result": "System accepts the email.",
             "input_label": "email", "input_value": "@company.com", "pass_fail": "pass", "reason": "Standard valid email format", "priority": "high"},
            {"type": "negative", "title": f"Email without @ symbol",
             "description": f"Test with email missing the @ symbol.",
             "steps": ["Enter email: 'usernamecompany.com'", "Submit", "Verify error"],
             "expected_result": "System shows: 'Invalid email format.'",
             "input_label": "email", "input_value": "usernamecompany.com", "pass_fail": "fail", "reason": "Missing @ symbol", "priority": "high"},
            {"type": "negative", "title": f"Email with spaces",
             "description": f"Test with email containing spaces.",
             "steps": ["Enter email: '@company.com'", "Submit", "Verify error"],
             "expected_result": "System rejects email with spaces.",
             "input_label": "email", "input_value": "@company.com", "pass_fail": "fail", "reason": "Contains spaces — not valid in email", "priority": "medium"},
            {"type": "edge_case", "title": f"Empty email field",
             "description": f"Test submitting without an email.",
             "steps": ["Leave email empty", "Submit", "Verify required field error"],
             "expected_result": "System shows: 'Email is required.'",
             "input_label": "email", "input_value": "(empty)", "pass_fail": "fail", "reason": "Required field left empty", "priority": "high"},
        ]

    # --- Search ---
    elif any(kw in t for kw in ["search", "find", "filter", "query", "look up"]):
        samples = [
            {"type": "positive", "title": f"Search with existing keyword",
             "description": f"Test search with a term that has results.",
             "steps": ["Enter search: 'meeting room'", "Click Search", "Verify results displayed"],
             "expected_result": "System displays matching results.",
             "input_label": "search_query", "input_value": "meeting room", "pass_fail": "pass", "reason": "Keyword matches existing data", "priority": "high"},
            {"type": "negative", "title": f"Search with non-existent term",
             "description": f"Test search with a keyword that has no matches.",
             "steps": ["Enter search: 'xyznonexistent999'", "Click Search", "Verify empty state message"],
             "expected_result": "System shows: 'No results found.'",
             "input_label": "search_query", "input_value": "xyznonexistent999", "pass_fail": "pass", "reason": "No matches — should show empty state, not error", "priority": "medium"},
            {"type": "edge_case", "title": f"Search with special characters",
             "description": f"Test search handles special chars safely.",
             "steps": ["Enter search: '<script>alert(1)</script>'", "Click Search", "Verify no XSS and safe handling"],
             "expected_result": "System sanitizes input and shows no results or safe error.",
             "input_label": "search_query", "input_value": "<script>alert(1)</script>", "pass_fail": "fail", "reason": "XSS attempt — must be sanitized", "priority": "high"},
        ]

    # --- File upload ---
    elif any(kw in t for kw in ["upload", "file", "attach", "document", "image"]):
        samples = [
            {"type": "positive", "title": f"Upload valid file (PDF, 2MB)",
             "description": f"Test uploading a valid file within size limits.",
             "steps": ["Select file: 'report.pdf' (2 MB)", "Click Upload", "Verify upload success"],
             "expected_result": "File is uploaded and listed in the project.",
             "input_label": "file", "input_value": "report.pdf (2 MB, application/pdf)", "pass_fail": "pass", "reason": "Valid file type and size", "priority": "high"},
            {"type": "negative", "title": f"Upload file exceeding size limit",
             "description": f"Test uploading an oversized file.",
             "steps": ["Select file: 'huge_video.mp4' (500 MB)", "Click Upload", "Verify size error"],
             "expected_result": "System shows: 'File exceeds maximum allowed size.'",
             "input_label": "file", "input_value": "huge_video.mp4 (500 MB)", "pass_fail": "fail", "reason": "Exceeds file size limit", "priority": "high"},
            {"type": "negative", "title": f"Upload unsupported file type",
             "description": f"Test uploading a disallowed file format.",
             "steps": ["Select file: 'malware.exe'", "Click Upload", "Verify rejection"],
             "expected_result": "System shows: 'File type not supported.'",
             "input_label": "file", "input_value": "malware.exe (1 MB, application/exe)", "pass_fail": "fail", "reason": "Executable files should be blocked", "priority": "high"},
            {"type": "edge_case", "title": f"Upload with no file selected",
             "description": f"Test clicking upload without selecting a file.",
             "steps": ["Click Upload without selecting a file", "Verify prompt"],
             "expected_result": "System shows: 'Please select a file to upload.'",
             "input_label": "file", "input_value": "(none selected)", "pass_fail": "fail", "reason": "No file selected", "priority": "medium"},
        ]

    # --- Booking / Reservation ---
    elif any(kw in t for kw in ["book", "reserve", "schedule", "appointment", "room"]):
        samples = [
            {"type": "positive", "title": f"Book available room for valid time slot",
             "description": f"Test booking an available room during valid hours.",
             "steps": ["Select room: 'Conference Room A'", "Select date: '2026-05-15'", "Select time: '10:00 - 11:00'", "Click Book", "Verify confirmation"],
             "expected_result": "Booking confirmed. Room shows as reserved for the selected slot.",
             "input_label": "room / date / time", "input_value": "Room A / 2026-05-15 / 10:00-11:00", "pass_fail": "pass", "reason": "Room is available at the requested time", "priority": "high"},
            {"type": "negative", "title": f"Book already-reserved room",
             "description": f"Test booking a room that is already taken.",
             "steps": ["Select room: 'Conference Room A'", "Select same time as existing booking", "Click Book", "Verify conflict error"],
             "expected_result": "System shows: 'This room is already booked for the selected time.'",
             "input_label": "room / time", "input_value": "Room A / 10:00-11:00 (already booked)", "pass_fail": "fail", "reason": "Time slot conflict with existing reservation", "priority": "high"},
            {"type": "negative", "title": f"Book room for past date",
             "description": f"Test booking a room for a date that has already passed.",
             "steps": ["Select date: '2020-01-01'", "Click Book", "Verify error"],
             "expected_result": "System shows: 'Cannot book for a past date.'",
             "input_label": "date", "input_value": "2020-01-01", "pass_fail": "fail", "reason": "Date is in the past", "priority": "high"},
            {"type": "edge_case", "title": f"Book room for today in 5 minutes",
             "description": f"Test booking with very short lead time.",
             "steps": ["Select today's date", "Select time starting in 5 minutes", "Click Book", "Verify handling"],
             "expected_result": "System either accepts or shows minimum lead time warning.",
             "input_label": "date / time", "input_value": "Today / starts in 5 min", "pass_fail": "pass", "reason": "Very short lead time — edge case", "priority": "medium"},
        ]

    # --- Delete / Remove ---
    elif any(kw in t for kw in ["delete", "remove", "cancel", "revoke"]):
        samples = [
            {"type": "positive", "title": f"Delete existing item successfully",
             "description": f"Test deleting an item that exists and user has permission.",
             "steps": ["Select item ID: 'item-12345'", "Click Delete", "Confirm deletion", "Verify item removed"],
             "expected_result": "Item is removed. List no longer shows the item.",
             "input_label": "item_id", "input_value": "item-12345", "pass_fail": "pass", "reason": "Valid item ID, user has permission", "priority": "high"},
            {"type": "negative", "title": f"Delete non-existent item",
             "description": f"Test deleting an item that doesn't exist.",
             "steps": ["Attempt to delete item ID: 'item-99999'", "Verify error"],
             "expected_result": "System shows: 'Item not found.'",
             "input_label": "item_id", "input_value": "item-99999", "pass_fail": "fail", "reason": "Item does not exist in the system", "priority": "medium"},
            {"type": "negative", "title": f"Delete without permission",
             "description": f"Test deleting an item as a user without delete privileges.",
             "steps": ["Log in as read-only user", "Attempt to delete item", "Verify permission denied"],
             "expected_result": "System shows: 'You do not have permission to delete this item.'",
             "input_label": "user_role", "input_value": "viewer (read-only)", "pass_fail": "fail", "reason": "User lacks delete permission", "priority": "high"},
        ]

    # --- Fallback: truly generic but with concrete examples ---
    else:
        samples = [
            {"type": "positive", "title": f"Execute '{title}' with standard valid data",
             "description": f"Test the primary function of '{title}' with typical inputs.",
             "steps": [f"Navigate to the feature for: {title}", f"Enter sample data: name='{_rand_name()}', value='100'", "Submit", "Verify the system accepts and processes the request"],
             "expected_result": f"System successfully completes '{title}' and shows confirmation.",
             "input_label": "sample_data", "input_value": f"name={_rand_name()}, value=100", "pass_fail": "pass", "reason": "Standard valid inputs within expected range", "priority": priority},
            {"type": "negative", "title": f"'{title}' with missing required fields",
             "description": f"Test '{title}' when required fields are left empty.",
             "steps": [f"Navigate to the feature for: {title}", "Leave all fields empty", "Click Submit", "Verify validation errors displayed"],
             "expected_result": "System shows validation errors for each required field.",
             "input_label": "all_fields", "input_value": "(all empty)", "pass_fail": "fail", "reason": "Required fields missing", "priority": "high"},
            {"type": "negative", "title": f"'{title}' without authentication",
             "description": f"Test '{title}' when the user is not logged in.",
             "steps": ["Clear session / log out", f"Attempt to access the feature for: {title}", "Verify redirect to login"],
             "expected_result": "System redirects to login page with 401 status.",
             "input_label": "auth_state", "input_value": "not authenticated", "pass_fail": "fail", "reason": "User session expired or not logged in", "priority": "high"},
            {"type": "edge_case", "title": f"'{title}' with special characters in input",
             "description": f"Test '{title}' handles special characters safely.",
             "steps": [f"Enter input: '<script>alert(\"XSS\")</script>'", "Submit", "Verify sanitization"],
             "expected_result": "System sanitizes input — no script execution, data saved safely.",
             "input_label": "input_text", "input_value": "<script>alert('XSS')</script>", "pass_fail": "fail", "reason": "XSS injection attempt — must be sanitized", "priority": "high"},
        ]

    return samples


def _generate_context_edge_cases(title: str, desc: str) -> List[Dict[str, Any]]:
    """Generate edge case entries based on requirement context."""
    t = (title + " " + desc).lower()
    cases = []

    if any(kw in t for kw in ["login", "password", "register", "sign"]):
        cases = [
            {"input": "'; DROP TABLE users; --", "expected_result": "fail", "reason": "SQL injection in login field"},
            {"input": " " * 50, "expected_result": "fail", "reason": "50 whitespace characters — should be trimmed/rejected"},
            {"input": "a@b.c", "expected_result": "fail", "reason": "Minimal email format — may not meet validation"},
        ]
    elif any(kw in t for kw in ["search", "query", "find"]):
        cases = [
            {"input": "a" * 1000, "expected_result": "fail", "reason": "1000-char search query — tests max length"},
            {"input": "%00nullbyte", "expected_result": "fail", "reason": "Null byte injection attempt"},
        ]
    elif any(kw in t for kw in ["book", "reserve", "room", "schedule"]):
        cases = [
            {"input": "date=9999-12-31", "expected_result": "fail", "reason": "Far future date — year 9999"},
            {"input": "duration=0 minutes", "expected_result": "fail", "reason": "Zero-duration booking"},
            {"input": "room=(nonexistent)", "expected_result": "fail", "reason": "Booking non-existent room"},
        ]
    elif any(kw in t for kw in ["upload", "file", "attach"]):
        cases = [
            {"input": "file=.htaccess", "expected_result": "fail", "reason": "Server config file upload attempt"},
            {"input": "file=0bytes.pdf", "expected_result": "fail", "reason": "Empty file (0 bytes)"},
        ]
    else:
        cases = [
            {"input": "<script>alert(1)</script>", "expected_result": "fail", "reason": "XSS injection attempt"},
            {"input": "'; DROP TABLE data; --", "expected_result": "fail", "reason": "SQL injection attempt"},
            {"input": "(empty string)", "expected_result": "fail", "reason": "Empty input submission"},
        ]

    return cases



    return {
        "scenario_id": f"TS-{counter:03d}",
        "requirement_id": rid,
        "requirement_title": title,
        "scenario_type": stype,
        "title": sc_title,
        "description": desc,
        "preconditions": ["User is on the relevant page", "System is operational"],
        "test_steps": steps,
        "expected_result": expected,
        "test_data": data,
        "priority": priority,
    }


def _scenario(counter, rid, title, stype, sc_title, desc, steps, expected, data, priority):
    """Helper to build a scenario dict."""
    return {
        "scenario_id": f"TS-{counter:03d}",
        "requirement_id": rid,
        "requirement_title": title,
        "scenario_type": stype,
        "title": sc_title,
        "description": desc,
        "preconditions": ["User is on the relevant page", "System is operational"],
        "test_steps": steps,
        "expected_result": expected,
        "test_data": data,
        "priority": priority,
    }


def _smart_placeholder_coverage(
    requirements: List[Dict[str, Any]],
    test_scenarios: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """Generate requirement-aware coverage audit."""
    scenario_map: Dict[str, List[str]] = {}
    scenario_details: Dict[str, List[Dict]] = {}
    for sc in test_scenarios:
        req_id = sc.get("requirement_id", "")
        sid = sc.get("scenario_id", "")
        if req_id:
            scenario_map.setdefault(req_id, []).append(sid)
            scenario_details.setdefault(req_id, []).append(sc)

    entries = []
    covered = 0
    partially = 0
    orphaned = 0

    for req in requirements:
        rid = req.get("id") or req.get("requirement_id") or "?"
        title = req.get("title", "Untitled")
        rtype = req.get("type", "functional")
        priority = req.get("priority", "medium")

        matched = scenario_map.get(rid, [])
        details = scenario_details.get(rid, [])

        if not matched:
            status = "orphaned"
            orphaned += 1
            gap = f"No test scenarios exist for '{title}'. Need positive, negative, and edge-case tests."
        else:
            types_covered = set(s.get("scenario_type", "") for s in details)
            has_positive = "positive" in types_covered
            has_negative = "negative" in types_covered
            has_edge = "edge_case" in types_covered or "boundary" in types_covered

            if has_positive and has_negative and has_edge and len(matched) >= 3:
                status = "covered"
                covered += 1
                gap = ""
            else:
                status = "partially_covered"
                partially += 1
                missing = []
                if not has_positive:
                    missing.append("positive/happy-path test")
                if not has_negative:
                    missing.append("negative/invalid-input test")
                if not has_edge:
                    missing.append("edge-case/boundary test")
                gap = f"Missing: {', '.join(missing)} for '{title}'"

        entries.append({
            "requirement_id": rid,
            "requirement_title": title,
            "requirement_type": rtype,
            "priority": priority,
            "status": status,
            "test_scenario_count": len(matched),
            "matched_scenarios": matched,
            "gap_reason": gap,
        })

    total = covered + partially + orphaned
    pct = round((covered / total) * 100, 1) if total > 0 else 0.0

    recommendations = []
    for e in entries:
        if e["status"] == "orphaned":
            recommendations.append(f"[CRITICAL] Create test scenarios for [{e['requirement_id']}] {e['requirement_title']} - currently has 0 tests")
        elif e["status"] == "partially_covered":
            recommendations.append(f"[HIGH] {e['gap_reason']}")

    return {
        "entries": entries,
        "summary": {
            "total_requirements": total,
            "covered": covered,
            "partially_covered": partially,
            "orphaned": orphaned,
            "coverage_percentage": pct,
        },
        "recommendations": recommendations[:15],
    }
