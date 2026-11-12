# Functional Test Cases — TaskTrail

**Notation:** PASS = corresponding API behavior verified by executed automated checks; FAIL = real deviation reproduced; **NOT RUN** = manual UI check documented but not actually performed. Each case assumes a fresh seed state unless otherwise noted.

| ID | Type | Scenario & steps | Expected result | Observed / evidence | Status | Defect |
| --- | --- | --- | --- | --- | --- | --- |
| TC-01 | Positive | `GET /api/tasks` after reset | 200; 3 seeded tasks | 200, count 3 (`test_02`) | PASS | — |
| TC-02 | Positive | `POST /api/tasks` with `{"title":"Check receipts"}` | 201; new pending task | 201, pending (`test_03`) | PASS | — |
| TC-03 | Negative | `POST /api/tasks` with `{}` | 400, title required | 400 (`test_04`) | PASS | — |
| TC-04 | Boundary | POST with 80-character title, then 81-character title | 201 at 80; 400 at 81 | 201 / 400 (`test_12`, `test_05`) | PASS | — |
| TC-05 | Negative | POST with only 3 spaces in title | 400, blank title rejected | **201** (`test_15`) | FAIL | BUG-001 |
| TC-06 | Positive | `GET /api/tasks?status=pending` after reset | Only IDs 1 and 3 | 2 pending (`test_06`) | PASS | — |
| TC-07 | Positive | `GET /api/tasks?status=completed` after reset | Only ID 2 | **IDs 1, 2, 3** (`test_16`) | FAIL | BUG-002 |
| TC-08 | Positive | `GET /api/tasks?q=SPRINT` | Case-insensitive search yields ID 1 | ID 1 (`test_07`) | PASS | — |
| TC-09 | Positive | `PATCH /api/tasks/1` with `{"status":"completed"}` | 200 and task status completed | 200, completed (`test_08`) | PASS | — |
| TC-10 | Negative | `PATCH /api/tasks/1` with `{"status":"archived"}` | 400 invalid status | 400 (`test_09`) | PASS | — |
| TC-11 | Positive | `DELETE /api/tasks/1`; GET list | 204; task disappears | 204; count becomes 2 (`test_10`) | PASS | — |
| TC-12 | Negative | `DELETE /api/tasks/9999` | 404 unknown resource | **204** (`test_17`) | FAIL | BUG-003 |

### Extra checks

The executable suite also covers service health, missing PATCH target, invalid priority, and serving the HTML page (17 tests in total). Browser-only keyboard and visual/responsive accessibility acceptance testing has **not** been certified. Test steps above specify HTTP behavior, not a claim that someone performed the equivalent GUI steps manually.
