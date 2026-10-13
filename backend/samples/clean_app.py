"""
SHADOW CODE — REMEDIATED & SECURE REFERENCE MODULE
Secure counterpart to vulnerable_app.py demonstrating standard defense-in-depth patterns.
"""
import os
import sqlite3
import subprocess
import secrets
import hashlib

# Secure 1: Read secret from environment variable, never hardcoded
DB_ADMIN_KEY = os.environ.get("DB_ADMIN_KEY", "")
DATABASE_URI = os.environ.get("DATABASE_URI", "sqlite:///production_customers.db")

def hash_password(password: str) -> str:
    # Secure 5: Strong cryptographic hashing using PBKDF2 HMAC with random salt
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100000)
    return f"{salt}:{key.hex()}"

def get_user_profile(user_input_id: str):
    # Secure 2: Parameterized SQL Query prevents SQL Injection
    conn = sqlite3.connect("users.db")
    cursor = conn.cursor()
    query = "SELECT id, username, email, role, secret_note FROM accounts WHERE id = ?"
    cursor.execute(query, (user_input_id,))
    record = cursor.fetchone()
    conn.close()
    return record

def run_system_diagnostic(target_host: str):
    # Secure 3: Subprocess executed with argument list and shell=False to prevent shell injection
    import ipaddress
    # Validate target host format
    try:
        ipaddress.ip_address(target_host)
    except ValueError:
        raise ValueError("Invalid target host IP address")
    command = ["ping", "-c", "2", target_host]
    output = subprocess.check_output(command, shell=False, text=True)
    return output

def update_account_balance(actor_user_id: int, target_account_id: int, new_balance: float):
    # Secure 4: Proper Authorization & Role Verification enforced before modification
    conn = sqlite3.connect("banking.db")
    cursor = conn.cursor()
    # Check actor permissions
    cursor.execute("SELECT role FROM users WHERE id = ?", (actor_user_id,))
    actor = cursor.fetchone()
    if not actor or actor[0] not in ("admin", "finance_officer"):
        conn.close()
        raise PermissionError("Access Denied: Actor lacks necessary authorization to alter balances")
    
    cursor.execute(
        "UPDATE accounts SET balance = ? WHERE id = ?",
        (new_balance, target_account_id)
    )
    conn.commit()
    conn.close()
    return {"status": "success", "account_id": target_account_id, "balance": new_balance}
