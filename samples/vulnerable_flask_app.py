import os
import pickle
import sqlite3
import subprocess
from flask import Flask, request, jsonify

app = Flask(__name__)
app.config["SECRET_KEY"] = "hardcoded-dev-secret"

DATABASE = "app.db"
ADMIN_TOKEN = "admin-token-123456"
UPLOAD_DIR = "/tmp/uploads"


def get_connection():
    return sqlite3.connect(DATABASE)


@app.route("/login", methods=["POST"])
def login():
    email = request.json.get("email", "")
    password = request.json.get("password", "")

    query = f"SELECT id, role FROM users WHERE email = '{email}' AND password = '{password}'"
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(query)
    row = cursor.fetchone()

    if row:
        return jsonify({"status": "ok", "user_id": row[0], "role": row[1]})
    return jsonify({"status": "failed"}), 401


@app.route("/read-file")
def read_file():
    file_name = request.args.get("file", "")
    path = os.path.join(UPLOAD_DIR, file_name)
    with open(path, "r", encoding="utf-8") as handle:
        return handle.read()


@app.route("/ping")
def ping_host():
    host = request.args.get("host", "127.0.0.1")
    output = subprocess.check_output(f"ping -n 1 {host}", shell=True)
    return output.decode("utf-8", errors="replace")


@app.route("/load-session", methods=["POST"])
def load_session():
    raw_session = request.data
    session = pickle.loads(raw_session)
    return jsonify({"session": str(session)})


@app.route("/reset-password", methods=["POST"])
def reset_password():
    token = request.headers.get("X-Admin-Token")
    email = request.json.get("email")
    new_password = request.json.get("new_password", "123456")

    if token == ADMIN_TOKEN or request.remote_addr == "127.0.0.1":
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(f"UPDATE users SET password = '{new_password}' WHERE email = '{email}'")
        conn.commit()
        return jsonify({"status": "password_reset"})

    return jsonify({"error": "forbidden"}), 403


@app.route("/debug-env")
def debug_env():
    return jsonify(dict(os.environ))


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
