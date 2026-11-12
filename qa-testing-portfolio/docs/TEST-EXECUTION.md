# Execution Record — 2026-11-12

**System:** TaskTrail local API (Python standard library), deterministic in-memory fixture. **Method:** `python -m unittest discover -s tests -v` against an ephemeral localhost HTTP server.

## Verified result

- **17 executable tests**: **14 passed**, **3 expected failures** for documented seeded defects.
- Unreported failures / errors: **0**.
- Results are saved verbatim in [`../evidence/api-test-run.txt`](../evidence/api-test-run.txt).
- Source syntax: `python -m py_compile demo/server.py tests/test_api.py` and `node --check demo/app.js`.

### Defect reproduction notes

- BUG-001: whitespace-only title returned **201**, expected **400**.
- BUG-002: completed-only filter returned **3** seeded records, expected **1**.
- BUG-003: unknown delete returned **204**, expected **404**.

## Evidence boundaries

The automated **API** checks were actually run. The Postman collection is prepared for import but was **not independently executed in the Postman client**. End-to-end browser usability, responsive rendering and keyboard accessibility were **not verified** in this environment. `unittest.expectedFailure` does not mean the product meets those three specifications.

## Decision

**Not release-ready** against the stated requirements. Track BUG-001 to BUG-003 and rerun the suite after remediation. For a real project, add a browser/device matrix, exploratory charters, accessibility checks and severity review with the product owner.
