from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import asyncio
import json
import uuid
import httpx
import time
from typing import Optional, Dict, List, Any
from pydantic import BaseModel
from datetime import datetime
import sqlite3
import os

app = FastAPI(title="HawkEye - Web Pentest Suite", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Database setup ──────────────────────────────────────────────
DB_PATH = "hawkeye.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS http_history (
        id TEXT PRIMARY KEY,
        timestamp TEXT,
        method TEXT,
        url TEXT,
        request_headers TEXT,
        request_body TEXT,
        response_status INTEGER,
        response_headers TEXT,
        response_body TEXT,
        response_time_ms INTEGER,
        flags TEXT,
        notes TEXT
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS scan_results (
        id TEXT PRIMARY KEY,
        timestamp TEXT,
        url TEXT,
        vulnerability_type TEXT,
        severity TEXT,
        description TEXT,
        evidence TEXT,
        request_id TEXT
    )''')
    conn.commit()
    conn.close()

init_db()

# ── WebSocket Manager ──────────────────────────────────────────
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections[:]:
            try:
                await connection.send_json(message)
            except:
                self.active_connections.remove(connection)

manager = ConnectionManager()

# ── Models ─────────────────────────────────────────────────────
class RepeaterRequest(BaseModel):
    method: str
    url: str
    headers: Dict[str, str] = {}
    body: Optional[str] = None
    follow_redirects: bool = False

class FuzzerConfig(BaseModel):
    method: str
    url: str
    headers: Dict[str, str] = {}
    body: Optional[str] = None
    payload_mark: str = "§FUZZ§"
    wordlist: List[str]
    threads: int = 5
    delay_ms: int = 0

class ScanRequest(BaseModel):
    url: str
    scan_types: List[str] = ["passive", "headers", "info_disclosure"]

class HistoryRequest(BaseModel):
    method: str
    url: str
    request_headers: Dict[str, str] = {}
    request_body: Optional[str] = None
    response_status: int = 0
    response_headers: Dict[str, str] = {}
    response_body: Optional[str] = None
    response_time_ms: int = 0

# ── Helpers ────────────────────────────────────────────────────
def save_to_history(req_id, method, url, req_headers, req_body,
                    res_status, res_headers, res_body, res_time):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''INSERT OR REPLACE INTO http_history VALUES (?,?,?,?,?,?,?,?,?,?,?,?)''',
        (req_id, datetime.utcnow().isoformat(), method, url,
         json.dumps(req_headers), req_body or "",
         res_status, json.dumps(res_headers), res_body or "",
         res_time, "[]", ""))
    conn.commit()
    conn.close()

def passive_scan(req_id, url, method, req_headers, res_status, res_headers, res_body):
    findings = []
    h = {k.lower(): v for k, v in res_headers.items()}

    security_headers = {
        "x-frame-options": "Missing X-Frame-Options (Clickjacking risk)",
        "x-content-type-options": "Missing X-Content-Type-Options",
        "strict-transport-security": "Missing HSTS header",
        "content-security-policy": "Missing Content-Security-Policy",
        "x-xss-protection": "Missing X-XSS-Protection",
    }
    for header, desc in security_headers.items():
        if header not in h:
            findings.append({
                "type": "Missing Security Header",
                "severity": "Low",
                "description": desc,
                "evidence": f"Header '{header}' not present"
            })

    if "server" in h:
        findings.append({
            "type": "Server Version Disclosure",
            "severity": "Info",
            "description": f"Server header reveals: {h['server']}",
            "evidence": h['server']
        })

    if "x-powered-by" in h:
        findings.append({
            "type": "Technology Disclosure",
            "severity": "Info",
            "description": f"X-Powered-By reveals: {h['x-powered-by']}",
            "evidence": h['x-powered-by']
        })

    body_lower = (res_body or "").lower()
    error_patterns = [
        ("sql syntax", "SQL Error Disclosure", "High"),
        ("mysql_fetch", "MySQL Error Disclosure", "High"),
        ("ora-", "Oracle Error Disclosure", "High"),
        ("stack trace", "Stack Trace Disclosure", "Medium"),
        ("exception in thread", "Java Exception Disclosure", "Medium"),
        ("warning: mysql", "MySQL Warning Disclosure", "High"),
        ("fatal error", "Fatal Error Disclosure", "Medium"),
    ]
    for pattern, vuln_type, severity in error_patterns:
        if pattern in body_lower:
            findings.append({
                "type": vuln_type,
                "severity": severity,
                "description": f"Response body contains '{pattern}'",
                "evidence": pattern
            })

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    for f in findings:
        c.execute('''INSERT INTO scan_results VALUES (?,?,?,?,?,?,?,?)''',
            (str(uuid.uuid4()), datetime.utcnow().isoformat(), url,
             f["type"], f["severity"], f["description"], f["evidence"], req_id))
    conn.commit()
    conn.close()
    return findings

# ── Routes ─────────────────────────────────────────────────────
@app.get("/api/status")
async def root():
    return {"status": "HawkEye running", "version": "1.0.0"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.post("/api/history/add")
async def add_to_history(req: HistoryRequest):
    req_id = str(uuid.uuid4())
    save_to_history(req_id, req.method, req.url,
                    req.request_headers, req.request_body,
                    req.response_status, req.response_headers,
                    req.response_body, req.response_time_ms)
    findings = passive_scan(req_id, req.url, req.method,
                            req.request_headers, req.response_status,
                            req.response_headers, req.response_body)
    entry = {
        "id": req_id, "method": req.method, "url": req.url,
        "status": req.response_status, "time": req.response_time_ms,
        "timestamp": datetime.utcnow().isoformat(), "findings": len(findings)
    }
    await manager.broadcast({"type": "new_request", "data": entry})
    if findings:
        await manager.broadcast({"type": "new_findings", "data": findings, "url": req.url})
    return {"id": req_id, "findings": findings}

@app.get("/api/history")
async def get_history(limit: int = 100, offset: int = 0, search: str = ""):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    if search:
        c.execute('''SELECT id,timestamp,method,url,response_status,response_time_ms,flags,notes
                     FROM http_history WHERE url LIKE ? ORDER BY timestamp DESC LIMIT ? OFFSET ?''',
                  (f"%{search}%", limit, offset))
    else:
        c.execute('''SELECT id,timestamp,method,url,response_status,response_time_ms,flags,notes
                     FROM http_history ORDER BY timestamp DESC LIMIT ? OFFSET ?''', (limit, offset))
    rows = c.fetchall()
    conn.close()
    return [{"id": r[0], "timestamp": r[1], "method": r[2], "url": r[3],
             "status": r[4], "time": r[5], "flags": json.loads(r[6] or "[]"), "notes": r[7]}
            for r in rows]

@app.get("/api/history/{req_id}")
async def get_request_detail(req_id: str):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('SELECT * FROM http_history WHERE id=?', (req_id,))
    row = c.fetchone()
    conn.close()
    if not row:
        raise HTTPException(404, "Request not found")
    return {
        "id": row[0], "timestamp": row[1], "method": row[2], "url": row[3],
        "request_headers": json.loads(row[4] or "{}"),
        "request_body": row[5],
        "response_status": row[6],
        "response_headers": json.loads(row[7] or "{}"),
        "response_body": row[8],
        "response_time_ms": row[9],
        "flags": json.loads(row[10] or "[]"),
        "notes": row[11]
    }

@app.delete("/api/history/{req_id}")
async def delete_request(req_id: str):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('DELETE FROM http_history WHERE id=?', (req_id,))
    conn.commit()
    conn.close()
    return {"deleted": req_id}

@app.delete("/api/history")
async def clear_history():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('DELETE FROM http_history')
    conn.commit()
    conn.close()
    return {"cleared": True}

@app.post("/api/repeater/send")
async def repeater_send(req: RepeaterRequest):
    req_id = str(uuid.uuid4())
    start = time.time()
    try:
        async with httpx.AsyncClient(verify=False, follow_redirects=req.follow_redirects, timeout=30) as client:
            response = await client.request(
                method=req.method.upper(),
                url=req.url,
                headers=req.headers,
                content=req.body.encode() if req.body else None
            )
        elapsed = int((time.time() - start) * 1000)
        res_body = response.text
        res_headers = dict(response.headers)
        save_to_history(req_id, req.method, req.url, req.headers, req.body,
                        response.status_code, res_headers, res_body, elapsed)
        findings = passive_scan(req_id, req.url, req.method, req.headers,
                                response.status_code, res_headers, res_body)
        entry = {"id": req_id, "method": req.method, "url": req.url,
                 "status": response.status_code, "time": elapsed,
                 "timestamp": datetime.utcnow().isoformat(), "findings": len(findings)}
        await manager.broadcast({"type": "new_request", "data": entry})
        return {
            "id": req_id,
            "status": response.status_code,
            "headers": res_headers,
            "body": res_body,
            "time_ms": elapsed,
            "findings": findings
        }
    except Exception as e:
        raise HTTPException(400, str(e))

@app.post("/api/fuzzer/run")
async def fuzzer_run(config: FuzzerConfig, background_tasks: BackgroundTasks):
    task_id = str(uuid.uuid4())
    background_tasks.add_task(run_fuzzer, task_id, config)
    return {"task_id": task_id, "status": "started", "total": len(config.wordlist)}

async def run_fuzzer(task_id: str, config: FuzzerConfig):
    results = []
    semaphore = asyncio.Semaphore(config.threads)
    total = len(config.wordlist)

    async def fuzz_one(idx, payload):
        async with semaphore:
            url = config.url.replace(config.payload_mark, payload)
            headers = {k: v.replace(config.payload_mark, payload) for k, v in config.headers.items()}
            body = (config.body or "").replace(config.payload_mark, payload)
            if config.delay_ms > 0:
                await asyncio.sleep(config.delay_ms / 1000)
            start = time.time()
            try:
                async with httpx.AsyncClient(verify=False, timeout=15) as client:
                    resp = await client.request(
                        method=config.method.upper(),
                        url=url, headers=headers,
                        content=body.encode() if body else None
                    )
                elapsed = int((time.time() - start) * 1000)
                result = {
                    "idx": idx, "payload": payload, "status": resp.status_code,
                    "length": len(resp.content), "time_ms": elapsed, "url": url
                }
                results.append(result)
                await manager.broadcast({
                    "type": "fuzzer_result",
                    "task_id": task_id,
                    "data": result,
                    "progress": {"done": idx + 1, "total": total}
                })
            except Exception as e:
                await manager.broadcast({
                    "type": "fuzzer_result",
                    "task_id": task_id,
                    "data": {"idx": idx, "payload": payload, "error": str(e)},
                    "progress": {"done": idx + 1, "total": total}
                })

    tasks = [fuzz_one(i, p) for i, p in enumerate(config.wordlist)]
    await asyncio.gather(*tasks)
    await manager.broadcast({"type": "fuzzer_done", "task_id": task_id, "total_results": len(results)})

@app.get("/api/scan/results")
async def get_scan_results(url: str = "", severity: str = ""):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    query = 'SELECT * FROM scan_results WHERE 1=1'
    params = []
    if url:
        query += ' AND url LIKE ?'
        params.append(f"%{url}%")
    if severity:
        query += ' AND severity=?'
        params.append(severity)
    query += ' ORDER BY timestamp DESC'
    c.execute(query, params)
    rows = c.fetchall()
    conn.close()
    return [{"id": r[0], "timestamp": r[1], "url": r[2], "type": r[3],
             "severity": r[4], "description": r[5], "evidence": r[6], "request_id": r[7]}
            for r in rows]

@app.get("/api/decoder/encode")
async def encode(text: str, type: str = "base64"):
    import base64, urllib.parse, html
    encoders = {
        "base64": lambda t: base64.b64encode(t.encode()).decode(),
        "url": lambda t: urllib.parse.quote(t),
        "html": lambda t: html.escape(t),
        "hex": lambda t: t.encode().hex(),
        "base64url": lambda t: base64.urlsafe_b64encode(t.encode()).decode().rstrip("="),
    }
    if type not in encoders:
        raise HTTPException(400, f"Unknown type. Options: {list(encoders.keys())}")
    return {"result": encoders[type](text), "type": type}

@app.get("/api/decoder/decode")
async def decode(text: str, type: str = "base64"):
    import base64, urllib.parse, html
    try:
        decoders = {
            "base64": lambda t: base64.b64decode(t + "==").decode(),
            "url": lambda t: urllib.parse.unquote(t),
            "html": lambda t: html.unescape(t),
            "hex": lambda t: bytes.fromhex(t).decode(),
            "base64url": lambda t: base64.urlsafe_b64decode(t + "==").decode(),
        }
        if type not in decoders:
            raise HTTPException(400, f"Unknown type. Options: {list(decoders.keys())}")
        return {"result": decoders[type](text), "type": type}
    except Exception as e:
        raise HTTPException(400, f"Decode error: {str(e)}")

@app.get("/api/stats")
async def get_stats():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('SELECT COUNT(*) FROM http_history')
    total_requests = c.fetchone()[0]
    c.execute('SELECT COUNT(*) FROM scan_results')
    total_findings = c.fetchone()[0]
    c.execute('SELECT severity, COUNT(*) FROM scan_results GROUP BY severity')
    by_severity = dict(c.fetchall())
    c.execute('SELECT method, COUNT(*) FROM http_history GROUP BY method')
    by_method = dict(c.fetchall())
    conn.close()
    return {
        "total_requests": total_requests,
        "total_findings": total_findings,
        "by_severity": by_severity,
        "by_method": by_method
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

# ── Serve React Frontend ───────────────────────────────────────
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

BUILD_DIR = os.path.join(os.path.dirname(__file__), "build")
if os.path.exists(BUILD_DIR):
    STATIC_DIR = os.path.join(BUILD_DIR, "static")
    if os.path.exists(STATIC_DIR):
        app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

    @app.get("/")
    async def serve_index():
        return FileResponse(os.path.join(BUILD_DIR, "index.html"))

    @app.get("/{full_path:path}")
    async def serve_react(full_path: str):
        file_path = os.path.join(BUILD_DIR, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(BUILD_DIR, "index.html"))
