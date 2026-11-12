#!/usr/bin/env python3
"""TaskTrail: a local-only, intentionally imperfect task API and web UI for QA practice.

Python standard library only. Never deploy this demonstrator as a production service.
Three controlled defects are deliberately present and documented in docs/BUG-REPORTS.md.
"""
from __future__ import annotations

import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Lock
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parent
SEED = [
    {"id": 1, "title": "Review sprint backlog", "status": "pending", "priority": "high"},
    {"id": 2, "title": "Send release notes", "status": "completed", "priority": "low"},
    {"id": 3, "title": "Verify onboarding flow", "status": "pending", "priority": "medium"},
]


class TaskStore:
    def __init__(self):
        self.lock = Lock()
        self.reset()

    def reset(self):
        with self.lock:
            self.tasks = [dict(task) for task in SEED]
            self.next_id = 4


STORE = TaskStore()


class QAHandler(BaseHTTPRequestHandler):
    """REST resource endpoints + static SPA, intentionally using a shared in-memory store."""

    server_version = "TaskTrailQA/1.0"

    def log_message(self, fmt, *args):
        if os.environ.get("TASKTRAIL_VERBOSE") == "1":
            super().log_message(fmt, *args)

    def send_json(self, status, data, *, headers=None):
        payload = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(payload)))
        for key, value in (headers or {}).items():
            self.send_header(key, value)
        self.end_headers()
        self.wfile.write(payload)

    def send_empty(self, status):
        self.send_response(status)
        self.send_header("Cache-Control", "no-store")
        self.end_headers()

    def read_json(self):
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length <= 0 or length > 8192:
                raise ValueError("Request body must contain JSON (max 8 KB)")
            body = json.loads(self.rfile.read(length))
            if not isinstance(body, dict):
                raise ValueError("A JSON object is required")
            return body
        except (ValueError, UnicodeDecodeError, json.JSONDecodeError) as exc:
            self.send_json(400, {"error": f"Invalid request: {exc}"})
            return None

    @staticmethod
    def task_id(path):
        pieces = path.split("/")
        return int(pieces[3]) if len(pieces) == 4 and pieces[:3] == ["", "api", "tasks"] and pieces[3].isdigit() else None

    def do_GET(self):
        req = urlparse(self.path)
        if req.path == "/api/health":
            return self.send_json(200, {"status": "ok", "service": "tasktrail-qa-demo"})
        if req.path == "/api/tasks":
            query = parse_qs(req.query)
            status = query.get("status", ["all"])[0]
            needle = query.get("q", [""])[0].casefold().strip()
            if status not in ("all", "pending", "completed"):
                return self.send_json(400, {"error": "Invalid status filter"})
            with STORE.lock:
                tasks = [dict(task) for task in STORE.tasks]
            if status == "pending":
                tasks = [task for task in tasks if task["status"] == "pending"]
            # KNOWN DEFECT BUG-002: 'completed' filter is accidentally not applied.
            if needle:
                tasks = [task for task in tasks if needle in task["title"].casefold()]
            return self.send_json(200, {"tasks": tasks, "count": len(tasks)})
        if req.path.startswith("/api/"):
            return self.send_json(404, {"error": "Endpoint not found"})
        assets = {"/": ("index.html", "text/html; charset=utf-8"),
                  "/index.html": ("index.html", "text/html; charset=utf-8"),
                  "/styles.css": ("styles.css", "text/css; charset=utf-8"),
                  "/app.js": ("app.js", "application/javascript; charset=utf-8")}
        asset = assets.get(req.path)
        if asset is None:
            return self.send_json(404, {"error": "File not found"})
        content = (ROOT / asset[0]).read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", asset[1])
        self.send_header("Content-Length", str(len(content)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(content)

    def do_POST(self):
        path = urlparse(self.path).path
        if path == "/api/reset":
            STORE.reset()
            return self.send_json(200, {"reset": True, "count": len(SEED)})
        if path != "/api/tasks":
            return self.send_json(404, {"error": "Endpoint not found"})
        body = self.read_json()
        if body is None:
            return
        title = body.get("title")
        priority = body.get("priority", "medium")
        if not isinstance(title, str) or not title:
            return self.send_json(400, {"error": "Title is required"})
        # KNOWN DEFECT BUG-001: whitespace-only titles pass the non-empty check.
        if len(title.strip()) > 80:
            return self.send_json(400, {"error": "Title must be at most 80 characters"})
        if priority not in ("low", "medium", "high"):
            return self.send_json(400, {"error": "Invalid priority"})
        with STORE.lock:
            task = {"id": STORE.next_id, "title": title.strip() or title,
                    "status": "pending", "priority": priority}
            STORE.tasks.append(task)
            STORE.next_id += 1
        return self.send_json(201, {"task": task}, headers={"Location": f"/api/tasks/{task['id']}"})

    def do_PATCH(self):
        task_id = self.task_id(urlparse(self.path).path)
        if task_id is None:
            return self.send_json(404, {"error": "Endpoint not found"})
        body = self.read_json()
        if body is None:
            return
        if "status" not in body or body["status"] not in ("pending", "completed"):
            return self.send_json(400, {"error": "Status must be pending or completed"})
        with STORE.lock:
            for task in STORE.tasks:
                if task["id"] == task_id:
                    task["status"] = body["status"]
                    return self.send_json(200, {"task": dict(task)})
        return self.send_json(404, {"error": "Task not found"})

    def do_DELETE(self):
        task_id = self.task_id(urlparse(self.path).path)
        if task_id is None:
            return self.send_json(404, {"error": "Endpoint not found"})
        with STORE.lock:
            STORE.tasks = [t for t in STORE.tasks if t["id"] != task_id]
        # KNOWN DEFECT BUG-003: unknown IDs also return 204, violating the API contract.
        return self.send_empty(204)


def serve():
    server = ThreadingHTTPServer(("127.0.0.1", 8765), QAHandler)
    print("TaskTrail QA demo: http://127.0.0.1:8765 (Ctrl+C to stop)", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    serve()
