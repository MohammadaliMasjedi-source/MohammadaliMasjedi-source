# Defect Reports — TaskTrail v1.0

These are **real, reproducible deviations in this intentionally defective demo**, not defects claimed against an external service. Server baseline: start `python demo/server.py`, then reset with `POST http://127.0.0.1:8765/api/reset` (empty `{}` body). Each issue is also covered by an executable `unittest.expectedFailure` check.

## BUG-001 — Whitespace-only task title is accepted

- **State:** Open (seeded) · **Severity:** Medium · **Priority:** P2
- **Requirement:** R-02 — title must contain at least one non-whitespace character and have 1–80 trimmed characters.
- **Steps:** 1. Reset the demo. 2. Send `POST /api/tasks` with JSON `{"title":"   "}`. 3. Inspect status and new task.
- **Expected:** `400 Bad Request` with validation message; no task created.
- **Actual:** `201 Created`; new task with blank-looking title is stored.
- **Impact:** Empty-looking rows can be saved, confusing users and weakening data quality.
- **Evidence:** `tests/test_api.py::test_15_bug_001_reject_whitespace_only_title` — expected failure; `TC-05`.
- **Suspected cause:** check uses truthiness before trimming. **Fix suggestion:** normalize `title.strip()` before validation.

## BUG-002 — Completed filter returns pending tasks

- **State:** Open (seeded) · **Severity:** Medium · **Priority:** P2
- **Requirement:** R-05 — filter by status must include **only** matching tasks.
- **Steps:** 1. Reset. 2. Send `GET /api/tasks?status=completed`. 3. Compare returned statuses.
- **Expected:** HTTP 200; only task ID 2, status `completed`; `count=1`.
- **Actual:** HTTP 200; tasks 1, 2 and 3 are returned; `count=3`.
- **Impact:** A completed-only view gives misleading progress information and makes reviews unreliable.
- **Evidence:** `tests/test_api.py::test_16_bug_002_filter_completed_only` — expected failure; `TC-07`.
- **Suspected cause:** pending case has a filter branch but completed case does not. **Fix suggestion:** apply the selected status for both values.

## BUG-003 — DELETE unknown task returns 204 instead of 404

- **State:** Open (seeded) · **Severity:** Low · **Priority:** P3
- **Requirement:** R-08 — deletion of a non-existent task returns `404 Not Found`.
- **Steps:** 1. Reset. 2. Send `DELETE /api/tasks/9999`.
- **Expected:** `404 Not Found` with an error payload.
- **Actual:** `204 No Content` even though no resource was removed.
- **Impact:** An API client may falsely assume a task was deleted; telemetry and error diagnosis become less reliable.
- **Evidence:** `tests/test_api.py::test_17_bug_003_delete_unknown_is_404` — expected failure; `TC-12`.
- **Suspected cause:** deletion handler returns 204 without checking whether an ID existed. **Fix suggestion:** check for a matching resource before acknowledging deletion.
