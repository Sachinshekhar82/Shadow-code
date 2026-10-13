# SHADOW CODE: Agentic AI Framework for Autonomous Secure SDLC Auditing

[![Tests](https://img.shields.io/badge/tests-15%2F15%20passed-brightgreen.svg)]()
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%2B%20Python%203.11-009688.svg)]()
[![Vite-React](https://img.shields.io/badge/Frontend-Vite%20%2B%20React%20%2B%20TypeScript-61DAFB.svg)]()
[![License](https://img.shields.io/badge/License-MIT-blue.svg)]()

> **Institution:** Dayananda Sagar Academy of Technology & Management (Autonomous Institute under VTU, Belagavi)  
> **Department:** Department of Computer Science & Engineering — Cyber Security  
> **Milestone:** 7th Semester B.E. — Project Phase 2 First Review  
> **Project Guide:** Mr. Anitha R, Associate Professor  
> **Repository:** [https://github.com/Sachinshekhar82/Shadow-code.git](https://github.com/Sachinshekhar82/Shadow-code.git)  

### Project Team
- **Sachin Shekhar** — 1DT23CY040
- **Abhinav Raj** — 1DT23CY002
- **Ikshit Sinha** — 1DT23CY022
- **Abhishek Anand** — 1DT23CY003

---

## 1. Problem Statement & Motivation

Modern CI/CD pipelines prioritize rapid development and deployment, which increases the likelihood of introducing vulnerabilities into upstream repositories. Traditional Static Application Security Testing (SAST) tools rely predominantly on predefined, rigid syntax patterns. Consequently, they:
1. **Miss Semantic & Logic Flaws:** Blind to complex context-dependent vulnerabilities and business-logic flaws (e.g., Broken Object Level Authorization / BOLA).
2. **Induce Alert Fatigue:** Generate excessive false positives, eroding developer trust and leading to ignored alerts.
3. **Lack Automated Remediation:** Typically stop at vulnerability detection without providing validated, fail-safe remediation or contextual learning.

### The Shadow Code Solution
**Shadow Code** introduces an intelligent security layer between the developer's workstation and the remote repository. It intercepts uncommitted code changes in a temporary quarantine state and orchestrates an autonomous eight-agent pipeline combining deterministic static pre-filtering, contextual semantic reasoning, vulnerability threat intelligence, CVSS v3.1 ranking, fail-safe AST patch synthesis, and human-in-the-loop adaptive memory.

---

## 2. The Eight-Agent Architecture

The architecture follows a sequential and reactive LangGraph-style workflow:

```
[Developer / Git Push]
         │
         ▼
[Shadow Code Gateway] ──(Quarantine State)
         │
         ▼
┌────────────────────────────────────────────────────────┐
│ 1. Agent 1: Parser / Receptionist                      │
│    Abstract Syntax Tree (AST) & File Type Filtering   │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ 2. Agent 2: Pattern Scanner / Filter                   │
│    Deterministic SAST (Bandit/Semgrep) & Pre-Filter    │
│    * Eliminates 80-90% safe code before LLM calls     │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ 3. Agent 3: Semantic Reasoner / Doctor                 │
│    Context & Intent Reasoning (BOLA, Logic Flaws)     │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ 4. Agent 4: CVE Correlator / Historian                 │
│    Threat Intelligence Mapping (NVD / CWE Matrix)      │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ 5. Agent 5: Severity Ranker / Judge                    │
│    Context-Aware CVSS v3.1 Scoring & Rationale         │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ 6. Agent 6: Report Writer / Communicator               │
│    Plain-English Synthesis & SDLC Gate Decision        │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ 7. Agent 7: The Surgeon / Fixer                        │
│    Fail-Safe Patch Synthesis & AST Syntax Validation  │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
          [Developer SOC Dashboard Review]
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ 8. Agent 8: Adaptive Memory / Learner                  │
│    Human-in-the-Loop Feedback & Weight Calibration     │
│    * Safety Guardrail: Critical Risks Never Suppressed│
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
         [Approved Remote Merge to GitHub]
```

### Agent Detailed Breakdown
1. **Agent 1 — Parser / Receptionist:** Ingests source code, generates Abstract Syntax Trees (AST), divides files into logical function/class units, and filters non-code assets (e.g. images, binaries, lock files).
2. **Agent 2 — Pattern Scanner / Filter:** Executes deterministic static scanners (Bandit, AST regex rules). Pre-filters safe units to save ~80% LLM tokens before deep reasoning.
3. **Agent 3 — Semantic Reasoner / Doctor:** Evaluates code context and business logic (e.g., detecting Broken Object Level Authorization where state mutations lack caller role verification). Uses live LLM providers when configured, or a verified deterministic contextual engine.
4. **Agent 4 — CVE Correlator / Historian:** Matches findings against curated NVD/CWE threat intelligence benchmarks with confidence scoring.
5. **Agent 5 — Severity Ranker / Judge:** Assigns CVSS v3.1 base score estimates (0.0 to 10.0) based on attack vectors, privileges, and context. Explains the exact formula and rationale for each rating.
6. **Agent 6 — Report Writer / Communicator:** Generates plain-English executive reports, separates static scanner evidence from AI semantic deductions, and recommends SDLC gate decisions (PASS, REVIEW_REQUIRED, BLOCK_RECOMMENDED).
7. **Agent 7 — The Surgeon / Fixer:** Synthesizes context-aware secure replacements with unified Git diffs. Takes a pre-fix snapshot and runs automated AST syntax checks before allowing application.
8. **Agent 8 — Adaptive Memory / Learner:** Records developer decisions (accept, override, false-positive) to adapt repository-specific severity weights while enforcing hard safety guardrails on critical vulnerabilities.

---

## 3. Technology Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Lucide React icons
- **Backend:** Python 3.11, FastAPI, Pydantic v2, SQLAlchemy, Uvicorn, SQLite
- **Security Scanners:** Bandit 1.9.4, Python `ast` syntax tree parser, regex OWASP engine
- **Testing:** Pytest 9.1, HTTPX, FastAPI TestClient

---

## 4. Project Folder Structure

```
Shadow-code/
├── backend/
│   ├── agents/
│   │   ├── base.py                 # Abstract Base Agent
│   │   ├── parser.py               # Agent 1: Receptionist / Parser
│   │   ├── pattern_scanner.py      # Agent 2: Filter / Pattern Scanner
│   │   ├── semantic_reasoner.py    # Agent 3: Doctor / Semantic Reasoner
│   │   ├── cve_correlator.py       # Agent 4: Historian / CVE Correlator
│   │   ├── severity_ranker.py      # Agent 5: Judge / Severity Ranker
│   │   ├── report_writer.py        # Agent 6: Communicator / Report Writer
│   │   ├── surgeon.py              # Agent 7: Fixer / The Surgeon
│   │   └── adaptive_memory.py      # Agent 8: Learner / Adaptive Memory
│   ├── api/
│   │   ├── routes_scans.py         # /api/scans
│   │   ├── routes_findings.py      # /api/findings
│   │   ├── routes_remediation.py   # /api/remediations
│   │   ├── routes_memory.py        # /api/adaptive-memory
│   │   ├── routes_repos.py         # /api/repositories
│   │   └── routes_system.py        # /api/status, /api/health, /api/samples
│   ├── database/
│   │   ├── session.py              # SQLAlchemy database connection
│   │   └── models.py               # Persistent SQLite tables
│   ├── pipeline/
│   │   └── orchestrator.py         # Sequential & reactive pipeline engine
│   ├── samples/
│   │   ├── vulnerable_app.py       # Demonstrates SQLi, Hardcoded Key, Command Injection, BOLA, MD5
│   │   ├── clean_app.py            # Secure reference counterpart
│   │   └── sample_meta.py          # Rationale and CWE/CVE metadata
│   ├── schemas/                    # Pydantic v2 request/response schemas
│   ├── tests/                      # Automated unit and integration tests
│   ├── venv/                       # Dedicated Python virtual environment
│   └── main.py                     # FastAPI application entrypoint & static mount
├── frontend/
│   ├── src/
│   │   ├── components/             # Navbar, Sidebar, Badges, DiffViewer, FindingModal
│   │   ├── pages/                  # 10 Review-ready pages
│   │   ├── services/api.ts         # Backend API client
│   │   └── types/index.ts          # TypeScript domain interfaces
│   ├── public/diagrams/            # Architecture diagrams from review presentations
│   └── dist/                       # Compiled production web bundle
├── docs/reference/                 # Reference PPTX & PDF review documents
├── scripts/
│   ├── start_backend.bat           # One-click backend startup script
│   ├── start_backend.ps1           # PowerShell backend startup script
│   ├── start_frontend.bat          # One-click frontend startup script
│   ├── start_frontend.ps1          # PowerShell frontend startup script
│   └── pre-push                    # Git local pre-push hook
├── .env.example
├── .gitignore
└── README.md
```

---

## 5. Prerequisites & Quick Start

### Prerequisites
- **Python 3.11+** installed on your system.
- **Node.js (v18+) & npm** (Node.js LTS v24.20.0 installed).
- **Git** version 2.40+.

### Option A: Running Both Backend & Frontend Together (Single Process)
Because the compiled production frontend is mounted directly inside the FastAPI backend, you can start the entire application with a single command:

```powershell
# Open terminal in project root
$env:PYTHONPATH = (Get-Location).Path
& ".\backend\venv\Scripts\python.exe" -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
Then open your web browser at: **[http://127.0.0.1:8000](http://127.0.0.1:8000)**.

### Option B: Running Full Stack with Hot-Reload Development (Two Terminals)

**Terminal 1 — Backend API Server:**
```powershell
# Double click scripts\start_backend.bat or run:
powershell -ExecutionPolicy Bypass -File .\scripts\start_backend.ps1
```
Backend API will start on: **`http://127.0.0.1:8000`** (Swagger docs: **`http://127.0.0.1:8000/docs`**).

**Terminal 2 — Frontend Dev Server:**
```powershell
# Double click scripts\start_frontend.bat or run:
powershell -ExecutionPolicy Bypass -File .\scripts\start_frontend.ps1
```
Frontend dashboard will open on: **`http://127.0.0.1:5173`**.

---

## 6. Demonstration Workflow for College Review

1. **Dashboard:** Open the application. Notice the live metrics, severity breakdown, and pipeline status.
2. **One-Click Demo Scan:** Click the cyan **"Run Demo Scan"** button in the header. The system submits `vulnerable_app.py` through the eight-agent pipeline, persisting results to SQLite.
3. **Inspect Findings:** Navigate to **Findings Explorer**. Filter by Critical / High. Click **"Inspect Evidence"** on the SQL Injection or Broken Object Level Authorization finding to view line numbers, estimated CVSS 3.1 vector, and NVD reference links.
4. **Remediation Workspace:** Navigate to **Remediation Workspace**. View the side-by-side unified Git diff produced by Agent 7 (The Surgeon). Verify the **AST Syntax Validation Passed** badge. Click **"Approve Patch"** and **"Apply Patch"** to mark the finding resolved.
5. **Adaptive Memory Feedback:** In the findings modal, override a finding with a reason (e.g. *"Internal test environment"*). Navigate to **Adaptive Feedback** to observe the real-time weight adjustment recorded by Agent 8.
6. **Download Audit Report:** Navigate to **Audit Reports**. Export the formal scan report as JSON or CSV, or click **"Print Report"**.

---

## 7. Automated Test Execution Results

All 15 automated test cases pass with 100% success:

```powershell
$env:PYTHONPATH = (Get-Location).Path
& ".\backend\venv\Scripts\pytest.exe" backend\tests -v
```

```
backend/tests/test_all_agents.py::test_agent_1_parser PASSED             [  6%]
backend/tests/test_all_agents.py::test_agent_2_pattern_scanner PASSED    [ 13%]
backend/tests/test_all_agents.py::test_agent_3_semantic_reasoner PASSED  [ 20%]
backend/tests/test_all_agents.py::test_agent_4_cve_correlator PASSED     [ 26%]
backend/tests/test_all_agents.py::test_agent_5_severity_ranker PASSED    [ 33%]
backend/tests/test_all_agents.py::test_agent_6_report_writer PASSED      [ 40%]
backend/tests/test_all_agents.py::test_agent_7_surgeon PASSED            [ 46%]
backend/tests/test_all_agents.py::test_agent_8_adaptive_memory PASSED    [ 53%]
backend/tests/test_all_agents.py::test_full_pipeline_orchestration PASSED [ 60%]
backend/tests/test_api.py::test_api_root PASSED                          [ 66%]
backend/tests/test_api.py::test_api_health PASSED                        [ 73%]
backend/tests/test_api.py::test_api_status PASSED                        [ 80%]
backend/tests/test_api.py::test_api_samples PASSED                       [ 86%]
backend/tests/test_api.py::test_api_demo_scan PASSED                     [ 93%]
backend/tests/test_api.py::test_api_feedback_and_memory PASSED           [100%]

======================= 15 passed in 1.75s =======================
```

---

## 8. Dual Git Enforcement Options

- **Strict Mode (Local Pre-Push Hook):**  
  Install the hook to intercept git push commands on developer laptops:
  ```bash
  cp scripts/pre-push .git/hooks/pre-push
  chmod +x .git/hooks/pre-push
  ```
- **Review Mode (GitHub Actions CI/CD):**  
  Deploy `.github/workflows/shadow-code.yml` for pull-request advisory gate evaluations.

---

## 9. Academic Attribution & Literature Foundations

Developed as part of the Cyber Security Capstone Curriculum at **Dayananda Sagar Academy of Technology & Management (DSATM)** under the guidance of **Mr. Anitha R (Associate Professor)**.

**Research Papers Cited in Project Specification:**
1. *Z. Sheng, et al. (2025)* — "LLMs in Software Security: A Survey of Vulnerability Detection Techniques and Insights" (arXiv).
2. *NDSS Symposium (2025)* — "From Large to Mammoth: A Comparative Evaluation of LLMs in Vulnerability Detection".
3. *IEEE DSN (2025)* — "Detecting Code Vulnerabilities using LLMs".
4. *X. Yin, et al. (2024)* — "LLM-Based Multi-Agent Systems for Software Engineering: Literature Review and Vision" (arXiv).
