"""Observe, diagnose, then check a real TaskTrail API response (localhost only)."""
import argparse
import json
from contextlib import contextmanager
from http.server import ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from urllib.request import ProxyHandler, build_opener

from demo.server import QAHandler, STORE

# A passing comparison matters: an unexpected result is not automatically a bug.
CASES = (
    ("Pending filter", "status=pending", "pending", {1, 3}),
    ("Completed filter", "status=completed", "completed", {2}),
    ("Completed + search", "status=completed&q=release", "completed", {2}),
)


@contextmanager
def local_api():
    """An isolated process-local demo, fresh fixtures, random loopback port."""
    STORE.reset()
    with ThreadingHTTPServer(("127.0.0.1", 0), QAHandler) as server:
        worker = Thread(target=server.serve_forever, daemon=True)
        worker.start()
        try:
            yield "http://127.0.0.1:" + str(server.server_port)
        finally:
            server.shutdown()
            worker.join()


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--walkthrough", action="store_true", help="reveal the verdicts without prompting")
    parser.add_argument("--report", type=Path, help="write a new Markdown evidence file; never overwrite")
    args = parser.parse_args(argv)
    opener = build_opener(ProxyHandler({}))
    notes = ["# TaskTrail filter investigation", "",
             "Local synthetic fixture: 1 and 3 are pending; only 2 is completed.", ""]
    print(notes[2], "\nWhich filter, if any, violates the contract?")
    correct = 0
    with local_api() as base:
        for name, query, wanted, ids in CASES:
            path = "/api/tasks?" + query
            with opener.open(base + path, timeout=3) as response:
                data = json.load(response)
                status = response.status
            rows = sorted((t["id"], t["status"]) for t in data["tasks"])
            ok = status == 200 and data["count"] == len(rows) == len(ids) and {i for i, _ in rows} == ids and all(s == wanted for _, s in rows)
            verdict = "PASS" if ok else "FAIL"
            observed = ", ".join(f"#{i} {s}" for i, s in rows) or "(empty)"
            expected = ", ".join(f"#{i}" for i in sorted(ids))
            print(f"\n{name}\n  GET {path}\n  Expected: HTTP 200; exactly {expected} ({wanted})\n  Observed: HTTP {status}; count={data['count']}; {observed}")
            if not args.walkthrough:
                while True:
                    answer = input("  Your verdict [pass/fail]: ").strip().upper()
                    if answer in ("PASS", "FAIL"):
                        break
                correct += (answer == verdict)
            print("  Evidence verdict:", verdict)
            notes.extend([f"## {name}: {verdict}", f"- Request: `GET {path}`",
                          f"- Expected: HTTP 200; exactly {expected} ({wanted}).",
                          f"- Observed: HTTP {status}; count={data['count']}; {observed}.", ""])
    takeaway = ("Why did the combined query pass? In this fixture only the completed item contains "
                "'release'. An independent search filter can hide a broken status filter. "
                "Compare each filter alone before declaring their combination correct.")
    print("\n" + takeaway)
    if not args.walkthrough:
        print(f"Your evidence calls: {correct}/{len(CASES)}")
    if args.report:
        try:
            with args.report.open("x", encoding="utf-8") as output:
                output.write("\n".join(notes + [takeaway, ""]))
        except OSError as exc:
            parser.exit(2, f"Could not create report: {exc}\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
