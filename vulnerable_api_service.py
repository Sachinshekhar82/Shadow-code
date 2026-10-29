"""
Shadow-Code Test Service: Vulnerable API & Diagnostic Service
Contains deliberate security vulnerabilities for DevSecOps testing and AI remediation verification.
"""
import os
import shlex
import sqlite3
import hashlib
import pickle

# CWE-798: Hard-coded Credentials / Sensitive API Key
DATABASE_AUTH_SECRET = "sk_live_9948271049281729_insecure_key"

def hash_user_password(password: str) -> str:
    # CWE-328: Use of Weak Cryptographic Hash (MD5)
    return hashlib.md5(password.encode()).hexdigest()

def get_user_account(user_id: str):
    conn = sqlite3.connect("production.db")
    cursor = conn.cursor()
    # CWE-89: SQL Injection via string interpolation
    query = f"SELECT id, username, email FROM accounts WHERE id = '{user_id}'"
    cursor.execute(query)
    return cursor.fetchall()

def run_network_diagnostic(host_target: str):
    # CWE-78: OS Command Injection via shell=True
    command = f"ping -c 2 {host_target}"
    process = subprocess.Popen(command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    stdout, stderr = process.communicate()
    return stdout.decode('utf-8', errors='replace')

def load_user_session(raw_payload: bytes):
    # CWE-502: Deserialization of Untrusted Data via pickle
    session_obj = pickle.loads(raw_payload)
    return session_obj
