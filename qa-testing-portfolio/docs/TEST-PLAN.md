# Test Plan — TaskTrail v1.0

**Project type:** controlled practice / demonstrator. **Testing role:** independent assessment of local app requirements, with known deliberately seeded defects. **Date:** 2026-11-12.

## Objective and scope

Assess basic task lifecycle and the consistency of user-visible behavior with the REST API contract. Areas: initial display, valid task creation, required input, length boundaries, priority validation, status changes, filtering, search, deletion, and API error semantics.

**Out of scope:** authentication, persistence, multitenancy, production security, performance/load, full screen-reader evaluation, cross-browser certification. No real customer data is used.

## Environment

Local-only HTTP server (`127.0.0.1:8765`), Python 3.9+ standard library, in-memory fixture with three tasks. Automated verification executes in-process over HTTP on an ephemeral localhost port. Postman examples target port 8765.

## Risks and priorities

| Risk | Impact | Test method |
| --- | --- | --- |
| Invalid tasks enter the system | Medium | Empty/whitespace and 80/81-character boundary tests |
| User sees wrong filtered data | Medium | Pending/completed status partition verification |
| Client misinterprets HTTP statuses | Low–medium | 201/204/400/404 API contract checks |
| Lifecycle changes are not reflected | High | Create → update → delete sequence |
| Search misses valid matches | Medium | Case-insensitive search |

## Test approach

1. Define explicit contract requirements R-01…R-09.
2. Design functional cases using equivalence partitioning, boundary-value and negative testing.
3. Execute reproducible HTTP checks against reset fixtures.
4. Document each deviation with request, expected result, actual result, impact, and reproducible steps.
5. Keep `expectedFailure` markers for known seeded issues: they are not falsely labeled as passing requirements.

## Entry / exit criteria

Entry: demo server starts; seeded state is available; endpoints respond. Exit for this portfolio iteration: planned scenarios documented; 17 automated checks executed; three known failures reported; no unreported failure in the automated checks. **This is not an approval for production release.**

## Test data

Seeded IDs 1 pending/high, 2 completed/low, 3 pending/medium. Generated tasks use safe synthetic text; reset restores deterministic state.
