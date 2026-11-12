"""
Shadow-Code Demonstration Vulnerability Module
Contains common real-world insecure code patterns for SAST scanning,
AI remediation generation, and automated Pull Request creation.
"""
import os
import subprocess
import pickle
import hashlib
import sqlite3

# 1. Hardcoded Secret (CWE-798 / Bandit B105)
DATABASE_JWT_SECRET = "sk_live_9948271049281729_insecure_key"

# 2. SQL Injection (CWE-89 / Bandit B608)
def fetch_user_data(user_id: str):
    conn = sqlite3.connect("users.db")
    cursor = conn.cursor()
    query = f"SELECT id, username, email FROM accounts WHERE id = '{user_id}'"
    cursor.execute(query)
    return cursor.fetchall()

# 3. Command Injection (CWE-78 / Bandit B602)
def run_diagnostic_ping(host_target: str):
    cmd = f"ping -c 2 {host_target}"
    result = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    stdout, stderr = result.communicate()
    return stdout.decode()

# 4. Insecure Deserialization (CWE-502 / Bandit B301)
def load_user_session_state(raw_payload: bytes):
    session_obj = pickle.loads(raw_payload)
    return session_obj

# 5. Weak Cryptographic Hashing (CWE-328 / Bandit B324)
def hash_user_password(plaintext_pw: str) -> str:
    return hashlib.md5(plaintext_pw.encode()).hexdigest()
