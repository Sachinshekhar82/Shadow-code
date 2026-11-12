import os
import subprocess
import json
import hashlib
import sqlite3

# Secured: Loaded via environment variable
DATABASE_JWT_SECRET = os.getenv("APP_JWT_SECRET", "")

def fetch_user_data(user_id: str):
    conn = sqlite3.connect("users.db")
    cursor = conn.cursor()
    # Secured: Parameterized SQL query
    query = "SELECT id, username, email FROM accounts WHERE id = ?"
    cursor.execute(query, (user_id,))
    return cursor.fetchall()

def run_diagnostic_ping(host_target: str):
    # Secured: Validated hostname and subprocess list without shell=True
    if not host_target.replace(".", "").isalnum():
        raise ValueError("Invalid target hostname format")
    result = subprocess.run(
        ["ping", "-c", "2", host_target],
        capture_output=True,
        text=True,
        check=False
    )
    return result.stdout

def load_user_session_state(raw_payload: bytes):
    # Secured: JSON deserialization instead of arbitrary pickle execution
    return json.loads(raw_payload.decode("utf-8"))

def hash_user_password(plaintext_pw: str, salt: str = "secure_salt") -> str:
    # Secured: SHA-256 hash
    return hashlib.sha256((salt + plaintext_pw).encode()).hexdigest()

def read_log_file(filename: str):
    # Secured: Path canonicalization preventing directory traversal
    base_dir = os.path.realpath("/var/log/app")
    target = os.path.realpath(os.path.join(base_dir, filename))
    if not (target == base_dir or target.startswith(base_dir + os.sep)):
        raise ValueError("Access denied: path traversal attempt")
    with open(target, "r") as f:
        return f.read()
