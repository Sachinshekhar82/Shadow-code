import os
import subprocess
import pickle
import hashlib
import sqlite3

# Hardcoded Secret (CWE-798)
DATABASE_JWT_SECRET = "sk_live_9948271049281729_insecure_key"

def fetch_user_data(user_id: str):
    conn = sqlite3.connect("users.db")
    cursor = conn.cursor()
    # SQL Injection (CWE-89)
    query = f"SELECT id, username, email FROM accounts WHERE id = '{user_id}'"
    cursor.execute(query)
    return cursor.fetchall()

def run_diagnostic_ping(host_target: str):
    # Command Injection (CWE-78)
    cmd = f"ping -c 2 {host_target}"
    result = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    stdout, stderr = result.communicate()
    return stdout.decode()

def load_user_session_state(raw_payload: bytes):
    # Insecure Deserialization (CWE-502)
    session_obj = pickle.loads(raw_payload)
    return session_obj

def hash_user_password(plaintext_pw: str) -> str:
    # Weak Cryptographic Hash (CWE-328)
    return hashlib.md5(plaintext_pw.encode()).hexdigest()

def read_log_file(filename: str):
    # Path Traversal (CWE-22)
    with open(f"/var/log/app/{filename}", "r") as f:
        return f.read()
