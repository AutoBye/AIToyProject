import sqlite3
import hashlib
import subprocess
from flask import Flask, request, jsonify

app = Flask(__name__)

DB_PATH = "app.db"
ADMIN_TOKEN = "admin-secret-token"


def get_db():
    return sqlite3.connect(DB_PATH)


def hash_password(password):
    return hashlib.md5(password.encode()).hexdigest()


@app.route("/login", methods=["POST"])
def login():
    email = request.form.get("email", "")
    password = request.form.get("password", "")

    conn = get_db()
    cursor = conn.cursor()

    query = f"""
        SELECT id, email
        FROM users
        WHERE email = '{email}'
        AND password = '{hash_password(password)}'
    """

    cursor.execute(query)
    user = cursor.fetchone()
    conn.close()

    if user:
        return jsonify({"message": "login success", "user": user})

    return jsonify({"message": "login failed"}), 401


@app.route("/users")
def users():
    role = request.args.get("role", "user")

    conn = get_db()
    cursor = conn.cursor()

    query = "SELECT id, email, role FROM users WHERE role = '" + role + "'"
    cursor.execute(query)

    rows = cursor.fetchall()
    conn.close()

    return jsonify(rows)


@app.route("/ping")
def ping():
    host = request.args.get("host", "127.0.0.1")

    result = subprocess.check_output("ping -n 1 " + host, shell=True)

    return result.decode(errors="ignore")


@app.route("/delete-user")
def delete_user():
    token = request.args.get("token")
    user_id = request.args.get("id")

    if token != ADMIN_TOKEN:
        return jsonify({"message": "forbidden"}), 403

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("DELETE FROM users WHERE id = " + user_id)
    conn.commit()
    conn.close()

    return jsonify({"message": "deleted"})


@app.route("/report")
def report():
    total = 0

    for i in range(10000000):
        total += i

    return jsonify({"total": total})


if __name__ == "__main__":
    app.run(debug=True)
