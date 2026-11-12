import io
import csv
import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from bson import ObjectId

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    KeepTogether,
    HRFlowable
)
from reportlab.pdfgen import canvas

logger = logging.getLogger("shadow_code.services.reports")

# --- Safe Serialization Helpers ---
class SafeJSONEncoder(json.JSONEncoder):
    """Custom JSON encoder handling datetime, ObjectId, and non-standard types."""
    def default(self, o):
        if isinstance(o, datetime):
            return o.isoformat()
        if isinstance(o, ObjectId):
            return str(o)
        if hasattr(o, "model_dump"):
            return o.model_dump()
        if hasattr(o, "__dict__"):
            return o.__dict__
        return super().default(o)

def sanitize_csv_cell(val: Any) -> str:
    """
    Prevents CSV / Spreadsheet formula injection by prepending a single quote
    if a string begins with dangerous characters (=, +, -, @, \\t, \\r).
    """
    if val is None:
        return ""
    text = str(val)
    if text and text[0] in ("=", "+", "-", "@", "\t", "\r"):
        return f"'{text}"
    return text

# --- JSON Report Generator ---
def generate_json_report(
    scan: Dict[str, Any],
    findings: List[Dict[str, Any]],
    repo: Optional[Dict[str, Any]] = None,
    remediations: Optional[List[Dict[str, Any]]] = None,
    pull_requests: Optional[List[Dict[str, Any]]] = None
) -> str:
    """
    Generates a structured, validated JSON compliance audit document.
    Never crashes on MongoDB ObjectIds or datetime instances.
    """
    rems_by_finding = {r.get("finding_id"): r for r in (remediations or []) if r.get("finding_id")}
    prs_by_finding = {p.get("finding_id"): p for p in (pull_requests or []) if p.get("finding_id")}

    enriched_findings = []
    for f in findings:
        f_copy = dict(f)
        f_id = f.get("id")
        if f_id in rems_by_finding:
            f_copy["remediation"] = rems_by_finding[f_id]
        if f_id in prs_by_finding:
            f_copy["pull_request"] = prs_by_finding[f_id]
        enriched_findings.append(f_copy)

    report_payload = {
        "metadata": {
            "report_title": "Shadow-Code Autonomous SDLC Security Assessment",
            "report_version": "1.4.2",
            "generator": "Shadow-Code Agentic DevSecOps Platform",
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "format": "JSON",
            "confidentiality": "STRICTLY CONFIDENTIAL"
        },
        "repository": {
            "id": repo.get("id") if repo else scan.get("repository_id"),
            "name": repo.get("name") if repo else "Monitored Repository",
            "url": repo.get("url") if repo else "",
            "branch": scan.get("branch", "main"),
            "commit_sha": scan.get("commit_sha", "HEAD")
        },
        "scan": {
            "id": scan.get("id"),
            "trigger": scan.get("trigger", "manual"),
            "status": scan.get("status", "completed"),
            "created_at": scan.get("created_at"),
            "completed_at": scan.get("completed_at"),
            "duration_seconds": scan.get("duration_seconds", 0.0),
            "scanners_run": scan.get("scanners_run", ["semgrep", "bandit"]),
            "scanner_errors": scan.get("scanner_errors", [])
        },
        "summary": {
            "total_findings": len(findings),
            "critical_count": scan.get("critical_count", sum(1 for f in findings if f.get("severity") == "CRITICAL")),
            "high_count": scan.get("high_count", sum(1 for f in findings if f.get("severity") == "HIGH")),
            "medium_count": scan.get("medium_count", sum(1 for f in findings if f.get("severity") == "MEDIUM")),
            "low_count": scan.get("low_count", sum(1 for f in findings if f.get("severity") in ["LOW", "INFO"]))
        },
        "findings": enriched_findings
    }

    return json.dumps(report_payload, cls=SafeJSONEncoder, indent=2)

# --- CSV Report Generator ---
def generate_csv_report(
    scan: Dict[str, Any],
    findings: List[Dict[str, Any]],
    repo: Optional[Dict[str, Any]] = None,
    pull_requests: Optional[List[Dict[str, Any]]] = None
) -> str:
    """
    Generates an RFC 4180 compliant CSV export with formula injection mitigation.
    """
    prs_by_finding = {p.get("finding_id"): p.get("pr_url", "") for p in (pull_requests or []) if p.get("finding_id")}
    repo_name = repo.get("name", scan.get("repository_id", "repository")) if repo else scan.get("repository_id", "repository")
    commit_sha = scan.get("commit_sha", "HEAD")

    output = io.StringIO()
    writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)

    # Standardized Security Headers
    writer.writerow([
        "Finding ID",
        "Scan ID",
        "Repository",
        "Commit SHA",
        "Severity",
        "Scanner",
        "Rule ID",
        "CWE ID",
        "OWASP Category",
        "File Path",
        "Line Start",
        "Line End",
        "Title",
        "Description",
        "Confidence",
        "AI Analysis Status",
        "Remediation Status",
        "Pull Request URL"
    ])

    for f in findings:
        f_id = f.get("id", "")
        pr_url = prs_by_finding.get(f_id, "")
        writer.writerow([
            sanitize_csv_cell(f_id),
            sanitize_csv_cell(scan.get("id")),
            sanitize_csv_cell(repo_name),
            sanitize_csv_cell(commit_sha),
            sanitize_csv_cell(f.get("severity")),
            sanitize_csv_cell(f.get("scanner")),
            sanitize_csv_cell(f.get("rule_id")),
            sanitize_csv_cell(f.get("cwe_id", "N/A")),
            sanitize_csv_cell(f.get("owasp_category", "N/A")),
            sanitize_csv_cell(f.get("file_path")),
            sanitize_csv_cell(f.get("line_start")),
            sanitize_csv_cell(f.get("line_end")),
            sanitize_csv_cell(f.get("title")),
            sanitize_csv_cell(f.get("description")),
            sanitize_csv_cell(f.get("confidence", "HIGH")),
            sanitize_csv_cell(f.get("ai_analysis_status", "pending")),
            sanitize_csv_cell(f.get("remediation_status", "open")),
            sanitize_csv_cell(pr_url)
        ])

    return output.getvalue()

# --- Numbered Canvas for PDF ---
class NumberedCanvas(canvas.Canvas):
    """Draws running footer with timestamp and 'Page X of Y' pagination."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count: int):
        self.saveState()
        # Footer
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        self.drawString(54, 30, "CONFIDENTIAL — Shadow-Code Autonomous Security SDLC Audit Report")
        self.drawRightString(612 - 54, 30, f"Page {self._pageNumber} of {page_count}")
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(54, 42, 612 - 54, 42)
        self.restoreState()

# --- PDF Report Generator ---
def generate_pdf_report(
    scan: Dict[str, Any],
    findings: List[Dict[str, Any]],
    repo: Optional[Dict[str, Any]] = None,
    remediations: Optional[List[Dict[str, Any]]] = None,
    pull_requests: Optional[List[Dict[str, Any]]] = None
) -> bytes:
    """
    Generates a professional enterprise PDF security audit report using ReportLab.
    Returns binary PDF bytes (%PDF-).
    """
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Custom Typography Styles
    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#0F172A")
    )
    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#475569")
    )
    section_h1 = ParagraphStyle(
        "SectionH1",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=17,
        textColor=colors.HexColor("#1E293B"),
        spaceBefore=14,
        spaceAfter=6
    )
    body_style = ParagraphStyle(
        "DocBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#334155")
    )
    code_style = ParagraphStyle(
        "DocCode",
        parent=styles["Normal"],
        fontName="Courier",
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor("#0F172A")
    )
    meta_label = ParagraphStyle(
        "MetaLabel",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#475569")
    )
    meta_val = ParagraphStyle(
        "MetaVal",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#0F172A")
    )

    elements = []

    # 1. Header Banner
    elements.append(Paragraph("SHADOW-CODE SECURE SDLC AUDIT REPORT", title_style))
    elements.append(Paragraph("Autonomous Multi-Engine Static Analysis & Validated AI Remediation", subtitle_style))
    elements.append(Spacer(1, 10))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0EA5E9"), spaceAfter=14))

    # 2. Executive Metadata Grid
    repo_name = repo.get("name") if repo else "Monitored Repository"
    repo_url = repo.get("url") if repo else "N/A"
    branch = scan.get("branch", "main")
    commit_sha = scan.get("commit_sha", "HEAD")[:12] if scan.get("commit_sha") else "HEAD"
    scan_id = scan.get("id", "scan-unknown")
    gen_time = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    status = scan.get("status", "completed").upper()

    meta_table_data = [
        [Paragraph("Target Repository:", meta_label), Paragraph(f"{repo_name} ({repo_url})", meta_val),
         Paragraph("Scan Audit ID:", meta_label), Paragraph(scan_id, meta_val)],
        [Paragraph("Target Branch:", meta_label), Paragraph(branch, meta_val),
         Paragraph("Commit SHA:", meta_label), Paragraph(commit_sha, meta_val)],
        [Paragraph("Audit Engine:", meta_label), Paragraph("Semgrep SAST + Bandit AST", meta_val),
         Paragraph("Audit Status:", meta_label), Paragraph(status, meta_val)],
        [Paragraph("Generated At:", meta_label), Paragraph(gen_time, meta_val),
         Paragraph("Execution Duration:", meta_label), Paragraph(f"{scan.get('duration_seconds', 0.0)}s", meta_val)]
    ]

    meta_table = Table(meta_table_data, colWidths=[100, 180, 95, 129])
    meta_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ]))
    elements.append(meta_table)
    elements.append(Spacer(1, 14))

    # 3. Executive Summary Metrics
    elements.append(Paragraph("1. Executive Summary & Risk Posture", section_h1))
    crit = scan.get("critical_count", sum(1 for f in findings if f.get("severity") == "CRITICAL"))
    high = scan.get("high_count", sum(1 for f in findings if f.get("severity") == "HIGH"))
    med = scan.get("medium_count", sum(1 for f in findings if f.get("severity") == "MEDIUM"))
    low = scan.get("low_count", sum(1 for f in findings if f.get("severity") in ["LOW", "INFO"]))
    total = len(findings)

    # Health score calculation
    deduction = (crit * 25) + (high * 10) + (med * 4) + (low * 1)
    health_score = max(0.0, min(100.0, 100.0 - deduction))

    metrics_table_data = [
        [
            Paragraph("<font size=16><b>{}</b></font><br/><font size=8 color='#DC2626'>CRITICAL</font>".format(crit), styles["Normal"]),
            Paragraph("<font size=16><b>{}</b></font><br/><font size=8 color='#EA580C'>HIGH</font>".format(high), styles["Normal"]),
            Paragraph("<font size=16><b>{}</b></font><br/><font size=8 color='#D97706'>MEDIUM</font>".format(med), styles["Normal"]),
            Paragraph("<font size=16><b>{}</b></font><br/><font size=8 color='#2563EB'>LOW / INFO</font>".format(low), styles["Normal"]),
            Paragraph("<font size=16><b>{}</b></font><br/><font size=8 color='#0F172A'>TOTAL FINDINGS</font>".format(total), styles["Normal"]),
            Paragraph("<font size=16><b>{}%</b></font><br/><font size=8 color='#059669'>HEALTH SCORE</font>".format(round(health_score, 1)), styles["Normal"]),
        ]
    ]

    metrics_table = Table(metrics_table_data, colWidths=[84, 84, 84, 84, 84, 84])
    metrics_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F1F5F9")),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#94A3B8")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    elements.append(metrics_table)
    elements.append(Spacer(1, 14))

    # 4. Status Warning if Failed or Clean
    if status == "FAILED":
        fail_p = Paragraph(
            "<b>⚠️ SCAN EXECUTION ALERT:</b> One or more required security scanner engines failed or encountered exceptions during execution. This report reflects partial findings and does not confirm repository safety.",
            ParagraphStyle("FailAlert", parent=body_style, textColor=colors.HexColor("#991B1B"))
        )
        fail_table = Table([[fail_p]], colWidths=[504])
        fail_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FEF2F2")),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#F87171")),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ]))
        elements.append(fail_table)
        elements.append(Spacer(1, 14))

    elif total == 0 and status == "COMPLETED":
        clean_p = Paragraph(
            "<b>✓ CLEAN AUDIT RESULT:</b> No security vulnerabilities or static rule violations were detected during this audit. Both Semgrep SAST and Bandit Python AST checks completed cleanly.",
            ParagraphStyle("CleanAlert", parent=body_style, textColor=colors.HexColor("#065F46"))
        )
        clean_table = Table([[clean_p]], colWidths=[504])
        clean_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#ECFDF5")),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#34D399")),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ]))
        elements.append(clean_table)
        elements.append(Spacer(1, 14))

    # 5. Enumerated Findings Section
    elements.append(Paragraph(f"2. Enumerated Vulnerabilities & Findings ({total})", section_h1))
    
    rems_map = {r.get("finding_id"): r for r in (remediations or []) if r.get("finding_id")}
    prs_map = {p.get("finding_id"): p for p in (pull_requests or []) if p.get("finding_id")}

    sev_colors = {
        "CRITICAL": colors.HexColor("#DC2626"),
        "HIGH": colors.HexColor("#EA580C"),
        "MEDIUM": colors.HexColor("#D97706"),
        "LOW": colors.HexColor("#2563EB"),
        "INFO": colors.HexColor("#64748B")
    }

    if findings:
        for idx, f in enumerate(findings, start=1):
            sev = (f.get("severity") or "MEDIUM").upper()
            color_badge = sev_colors.get(sev, colors.HexColor("#64748B"))
            title_text = f"#{idx} [{sev}] {f.get('title', 'Security Finding')}"
            
            f_id = f.get("id")
            rem = rems_map.get(f_id)
            pr = prs_map.get(f_id)

            finding_header = [
                Paragraph(f"<b>{title_text}</b>", ParagraphStyle("FTitle", parent=styles["Normal"], fontSize=9.5, leading=12, textColor=colors.HexColor("#0F172A"))),
                Paragraph(f"<font color='{color_badge.hexval()}'><b>{f.get('cwe_id') or 'CWE Unclassified'}</b></font>", ParagraphStyle("FCWE", parent=styles["Normal"], fontSize=8.5, leading=11, alignment=2))
            ]

            loc_str = f"File: <b>{f.get('file_path')}</b> (Lines {f.get('line_start')}-{f.get('line_end')}) | Rule: <b>{f.get('rule_id')}</b> | Engine: <b>{f.get('scanner')}</b>"
            desc_str = f.get("description", "No description provided.")
            
            # Evidence block
            evidence_text = f.get("evidence", "").strip() or "# Context not captured"
            if len(evidence_text) > 400:
                evidence_text = evidence_text[:400] + "\n... [truncated]"

            finding_rows = [
                finding_header,
                [Paragraph(loc_str, meta_label), ""],
                [Paragraph(f"<b>Description:</b> {desc_str}", body_style), ""],
                [Paragraph(f"<b>Code Evidence:</b><br/><font face='Courier' size=7.5>{evidence_text}</font>", body_style), ""]
            ]

            # Remediation & PR row
            if rem:
                val_status = rem.get("validation_status", "unvalidated").upper()
                rem_str = f"<b>AI Remediation:</b> {rem.get('explanation', '')[:180]} (Status: <b>{val_status}</b>)"
                finding_rows.append([Paragraph(rem_str, body_style), ""])

            if pr and pr.get("pr_url"):
                pr_str = f"<b>GitHub Pull Request:</b> <font color='#0284C7'>{pr.get('pr_url')}</font> ({pr.get('status', 'open').upper()})"
                finding_rows.append([Paragraph(pr_str, body_style), ""])

            f_table = Table(finding_rows, colWidths=[380, 124])
            f_table.setStyle(TableStyle([
                ("SPAN", (0, 1), (1, 1)),
                ("SPAN", (0, 2), (1, 2)),
                ("SPAN", (0, 3), (1, 3)),
                *([("SPAN", (0, 4), (1, 4))] if len(finding_rows) > 4 else []),
                *([("SPAN", (0, 5), (1, 5))] if len(finding_rows) > 5 else []),
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FFFFFF")),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                ("LINEBEFORE", (0, 0), (0, -1), 3.5, color_badge),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ]))

            elements.append(KeepTogether([f_table, Spacer(1, 8)]))

    # 6. Disclaimer & Audit Scope Notice
    elements.append(Spacer(1, 10))
    elements.append(Paragraph("3. Scope Limitations & Methodology", section_h1))
    disclaimer_text = (
        "This security assessment was generated autonomously by Shadow-Code using Semgrep multi-language rules "
        "and Bandit Python AST security engines. While this report detects high-confidence logical and syntactic vulnerabilities, "
        "automated analysis cannot guarantee the complete absence of zero-day exploits, infrastructure misconfigurations, "
        "or runtime logical flaws. Formal human peer review and defense-in-depth controls remain recommended."
    )
    elements.append(Paragraph(disclaimer_text, ParagraphStyle("Disclaimer", parent=body_style, textColor=colors.HexColor("#64748B"), fontSize=8, leading=11)))

    doc.build(elements, canvasmaker=NumberedCanvas)
    return buf.getvalue()
