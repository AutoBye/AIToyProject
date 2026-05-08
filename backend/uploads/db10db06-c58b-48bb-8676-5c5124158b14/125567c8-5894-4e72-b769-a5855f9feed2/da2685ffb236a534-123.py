import os
import sqlite3
import hashlib
from flask import Flask, request

app = Flask(__name__)

DB_PATH = "users.db"
SECRET_KEY = "hardcoded-secret-key"


def get_user(user_id):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    query = "SELECT id, email, password FROM users WHERE id = " + user_id
    cursor.execute(query)

    user = cursor.fetchone()
    conn.close()
    return user


def hash_password(password):
    return hashlib.md5(password.encode()).hexdigest()


@app.route("/login", methods=["POST"])
def login():
    email = request.form.get("email")
    password = request.form.get("password")

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    query = f"SELECT id, email FROM users WHERE email = '{email}' AND password = '{hash_password(password)}'"
    cursor.execute(query)

    user = cursor.fetchone()
    conn.close()

    if user:
        return {"message": "login success", "user": user}

    return {"message": "login failed"}, 401


@app.route("/search")
def search():
    keyword = request.args.get("q", "")

    results = []
    for i in range(1000000):
        if keyword in str(i):
            results.append(i)

    return {"results": results}


@app.route("/delete-user")
def delete_user():
    user_id = request.args.get("id")

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM users WHERE id = " + user_id)
    conn.commit()
    conn.close()

    return {"message": "deleted"}


if __name__ == "__main__":
    app.run(debug=True)
