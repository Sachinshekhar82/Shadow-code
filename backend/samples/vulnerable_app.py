"""
SHADOW CODE — VULNERABLE DEMONSTRATION MODULE
Intentionally vulnerable application for college review security auditing demonstration.
Contains:
1. Hardcoded Secret / Credential (CWE-798)
2. Raw SQL String Concatenation / SQL Injection (CWE-89)
3. Insecure Subprocess Execution / Command Injection (CWE-78)
4. Missing Object-Level Authorization in Business Logic (CWE-285 / CWE-639)
5. Weak Cryptographic Hash (MD5) for Passwords (CWE-327)
"""
import sqlite3
import subprocess
import hashlib

# Vulnerability 1: Hardcoded AWS Secret Key and Database Password
DB_ADMIN_KEY = "AKIA_SHADOW_CODE_DEMO_SECRET_KEY_99214A"
DATABASE_URI = "sqlite:///production_customers.db"

def hash_password(password: str) -> str:
    # Vulnerability 5: Broken Cryptography - Insecure MD5 hash without salt
    return hashlib.md5(password.encode()).hexdigest()

def get_user_profile(user_input_id: str):
    # Vulnerability 2: SQL Injection - Unsanitized string formatting
    conn = sqlite3.connect("users.db")
    cursor = conn.cursor()
    query = f"SELECT id, username, email, role, secret_note FROM accounts WHERE id = '{user_input_id}'"
    cursor.execute(query)
    record = cursor.fetchone()
    conn.close()
    return record

def run_system_diagnostic(target_host: str):
    # Vulnerability 3: Command Injection - shell=True with unescaped user input
    command = f"ping -c 2 {target_host}"
    output = subprocess.check_output(command, shell=True, text=True)
    return output

def update_account_balance(actor_user_id: int, target_account_id: int, new_balance: float):
    # Vulnerability 4: Missing Authorization / Broken Object Level Authorization (BOLA)
    # Flaw: No check verifying that actor_user_id has admin privileges or owns target_account_id
    conn = sqlite3.connect("banking.db")
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE accounts SET balance = ? WHERE id = ?",
        (new_balance, target_account_id)
    )
    conn.commit()
    conn.close()
    return {"status": "success", "account_id": target_account_id, "balance": new_balance}
