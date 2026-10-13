import ast
import os
import re
from typing import Dict, Any, List
from .base import BaseAgent

NON_CODE_EXTENSIONS = {
    ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".ico", ".svg",
    ".zip", ".tar", ".gz", ".7z", ".rar",
    ".exe", ".dll", ".so", ".bin",
    ".pdf", ".docx", ".pptx", ".xlsx",
    ".log", ".lock"
}

class ParserAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_number=1,
            agent_name="Parser / Receptionist",
            agent_role="Structural Analysis, File Filtering & AST Decomposition"
        )

    def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        self.logs.clear()
        filename = context.get("filename", "submission.py")
        code = context.get("code", "")
        language = context.get("language", "python").lower()

        self.log(f"Received input file: {filename} (Declared language: {language})")
        
        # 1. Non-code filtering check
        ext = os.path.splitext(filename)[1].lower()
        if ext in NON_CODE_EXTENSIONS:
            self.log(f"FILTERED: File extension {ext} detected as non-code asset. Skipping security pipeline.")
            return {
                "status": "FILTERED_NON_CODE",
                "summary": f"File {filename} filtered out (non-code asset).",
                "code_units": [],
                "ast_tree": None,
                "lines_of_code": 0
            }

        lines = code.splitlines()
        loc = len(lines)
        self.log(f"Line count: {loc} lines. Extracting logical units...")

        code_units: List[Dict[str, Any]] = []
        ast_parsed = False
        imports = []

        if language == "python" or ext == ".py":
            try:
                tree = ast.parse(code, filename=filename)
                ast_parsed = True
                self.log("Abstract Syntax Tree (AST) generated successfully using Python AST engine.")

                for node in ast.walk(tree):
                    if isinstance(node, (ast.Import, ast.ImportFrom)):
                        if isinstance(node, ast.Import):
                            for n in node.names:
                                imports.append(n.name)
                        else:
                            imports.append(node.module or "")
                    elif isinstance(node, ast.FunctionDef):
                        code_units.append({
                            "type": "function",
                            "name": node.name,
                            "line_start": node.lineno,
                            "line_end": getattr(node, "end_lineno", node.lineno + 5),
                            "docstring": ast.get_docstring(node)
                        })
                    elif isinstance(node, ast.ClassDef):
                        code_units.append({
                            "type": "class",
                            "name": node.name,
                            "line_start": node.lineno,
                            "line_end": getattr(node, "end_lineno", node.lineno + 10),
                            "docstring": ast.get_docstring(node)
                        })

                self.log(f"Extracted {len(code_units)} logical units (functions/classes) and {len(imports)} imports.")
            except SyntaxError as e:
                self.log(f"Syntax warning in input: {e}. Falling back to regex structural chunking.")
                ast_parsed = False

        if not ast_parsed:
            # Fallback regex chunking for JS/TS/Java/C or unparsed python
            func_pattern = re.compile(r'(?:def|function|class|async\s+def|const\s+\w+\s*=\s*(?:async)?\s*\(?)\s+([A-Za-z0-9_]+)')
            for i, line in enumerate(lines):
                match = func_pattern.search(line)
                if match:
                    code_units.append({
                        "type": "block",
                        "name": match.group(1),
                        "line_start": i + 1,
                        "line_end": min(i + 15, loc),
                        "docstring": None
                    })
            self.log(f"Regex structural chunking identified {len(code_units)} logical blocks.")

        output_summary = f"Parsed {loc} lines into {len(code_units)} code units. AST engine: {'Active (Python AST)' if ast_parsed else 'Regex Structural Lexer'}."
        self.log(output_summary)

        return {
            "status": "COMPLETED",
            "summary": output_summary,
            "filename": filename,
            "language": language,
            "lines_of_code": loc,
            "code_units": code_units,
            "imports": list(set(imports)),
            "ast_available": ast_parsed
        }
