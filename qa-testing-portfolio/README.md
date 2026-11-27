# TaskTrail — Software QA Case Study

**Manual testing • Functional & exploratory QA • Defect reporting • API testing • Postman**

A reproducible portfolio project built around a small task-management web app and its REST API. It demonstrates the complete QA workflow: converting requirements into test cases, identifying boundary and negative cases, reporting defects with reproducible evidence, tracing defects to requirements, and running repeatable API checks.

> **Transparency:** TaskTrail is a **synthetic practice application**, not a client product. Three defects were intentionally seeded to demonstrate the testing and reporting process. This work is not presented as paid QA employment or a production audit.

## Play the three-query detective case

From this directory run `python3 practice.py` (Python 3.9+, no packages). It starts its own local demo, shows the expected and *actual* HTTP result, and lets you call each one a pass or a failure before revealing the verdict. You'll see why a passing combined filter can hide a defect. No account, network service or prior QA experience is needed.

For a narrated answer key and a shareable evidence report, run `python3 practice.py --walkthrough --report my-findings.md`. The report uses the actual responses from your run and won't overwrite an existing file.

## Results at a glance

| Deliverable | Included |
| --- | --- |
| Functional test scenarios | **12** documented in [`docs/TEST-CASES.md`](docs/TEST-CASES.md) |
| Reported defects | **3** with steps, expected/actual, severity and reproduction endpoints |
| Automated API checks | **17** Python standard-library checks: **14 passed, 3 expected failures** (2026-11-12) |
| API requests | Postman collection (happy paths + negative tests + intentionally failing defect reproductions) |
| Traceability | Requirements-to-tests-to-defects mapping |
| UI | Local responsive task board with search, filtering, create, complete, delete and reset |

## Quick start — no package install

Requirements: **Python 3.9+** (standard library only); optional Postman for the collection.

```bash
python demo/server.py
```

Open **http://127.0.0.1:8765/**. The server deliberately binds to localhost, uses in-memory seed data and is **not suitable for production deployment**. Use **Reset demo** to restore the seeded tasks.

Run the API checks in another terminal:

```bash
python -m unittest discover -s tests -v
```

`OK (expected failures=3)` is intentional: three `unittest.expectedFailure` tests preserve visibility of the known defects without pretending that they pass the product specification. When a defect is fixed, remove its decorator and rerun the suite.

## Postman

1. Start `python demo/server.py`.
2. Import [`postman/TaskTrail.postman_collection.json`](postman/TaskTrail.postman_collection.json).
3. Import [`postman/Local.postman_environment.json`](postman/Local.postman_environment.json) and select **TaskTrail Local**.
4. Run **01 — Happy paths** first; **02 — Defect reproductions** contains **three intentionally failing assertions**.

No credentials or external APIs are required. The collection is **authored but has not been run in Postman itself**; the equivalent API behavior is verified with Python. Server state is shared within the local process, so reset before reproducing.

## Documentation

- [Test plan and risk strategy](docs/TEST-PLAN.md)
- [12 test scenarios with expected outcomes](docs/TEST-CASES.md)
- [3 issue reports with clear steps](docs/BUG-REPORTS.md)
- [Requirements traceability](docs/TRACEABILITY.md)
- [Executed test summary and limitations](docs/TEST-EXECUTION.md)
- [Local API run output](evidence/api-test-run.txt)

## Try the same method on Sahar

TaskTrail's bugs were planted. Here is a real question from a different project: after installing [Sahar](https://github.com/MohammadaliMasjedi-source/Sahar) on your own Android phone, can you close it, disconnect, and reopen a lesson from its icon?

1. Use a test profile with invented data. Start from a **trusted HTTPS** copy of the app: plain HTTP on a local Wi-Fi address won't normally allow the service worker to install. Open one lesson online to establish what should happen.
2. Close the app, turn on airplane mode, verify Wi-Fi is also off, and open it again from its icon. Try the same lesson. Write down the first step where the offline result differs, or say what passed.
3. Use the [device checklist](https://github.com/MohammadaliMasjedi-source/Sahar/blob/main/docs/PHONE-TEST.md) to record your device model, OS/browser versions, steps, and expected/actual results. Check [existing Sahar issues](https://github.com/MohammadaliMasjedi-source/Sahar/issues) for the same case before adding a report. No child, learner account, identifying details, or personal screenshot is needed.

An online pass and an offline failure on the same phone are useful evidence. A desktop simulation alone doesn't establish that the phone works offline.

## Skills demonstrated

Requirements interpretation, boundary-value analysis, negative testing, exploratory test design, defect triage, API contract verification, HTTP status semantics, reproducible steps, and honest evidence reporting. Automation is limited to a small, readable verification layer; the focus is **manual and functional QA**.

**Author:** Mohammadali Masjedi — personal QA portfolio exercise, November 2026.
