# Requirements Traceability Matrix

| Requirement | Acceptance criterion | Test cases | Defect | Result |
| --- | --- | --- | --- | --- |
| R-01 | GET tasks lists three seeded tasks | TC-01 | — | Pass |
| R-02 | Task title is required, nonblank, trimmed to 1–80 chars | TC-02, TC-03, TC-04, TC-05 | BUG-001 | **Fail** |
| R-03 | Priority is low, medium or high | Extra: test_13 | — | Pass |
| R-04 | Create returns 201, default status pending | TC-02 | — | Pass |
| R-05 | Status filters include matching tasks only | TC-06, TC-07 | BUG-002 | **Fail** |
| R-06 | Search is case-insensitive | TC-08 | — | Pass |
| R-07 | Status update accepts pending/completed; rejects invalid | TC-09, TC-10 | — | Pass |
| R-08 | Existing DELETE 204, unknown DELETE 404 | TC-11, TC-12 | BUG-003 | **Fail** |
| R-09 | Health/readiness GET returns 200 | Extra: test_01 | — | Pass |

**Meaning:** a requirement marked Fail is not satisfied even if its other cases pass. This portfolio does not claim production release readiness.
