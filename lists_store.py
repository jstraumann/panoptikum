import json
import os
import secrets
import sqlite3
import time

DB_PATH = os.environ.get('LISTS_DB_PATH', os.path.join('data', 'lists.db'))


def get_db():
    os.makedirs(os.path.dirname(DB_PATH) or '.', exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute('''CREATE TABLE IF NOT EXISTS lists (
        id TEXT PRIMARY KEY,
        edit_token TEXT NOT NULL,
        items TEXT NOT NULL,
        created_at REAL NOT NULL,
        updated_at REAL NOT NULL
    )''')
    return conn


def create_list(items):
    list_id = secrets.token_urlsafe(9)
    edit_token = secrets.token_urlsafe(24)
    now = time.time()
    conn = get_db()
    try:
        conn.execute(
            'INSERT INTO lists (id, edit_token, items, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
            (list_id, edit_token, json.dumps(items), now, now)
        )
        conn.commit()
    finally:
        conn.close()
    return list_id, edit_token


def update_list(list_id, edit_token, items):
    conn = get_db()
    try:
        cur = conn.execute('SELECT edit_token FROM lists WHERE id = ?', (list_id,))
        row = cur.fetchone()
        if row is None or not secrets.compare_digest(row[0], edit_token or ''):
            return False
        conn.execute(
            'UPDATE lists SET items = ?, updated_at = ? WHERE id = ?',
            (json.dumps(items), time.time(), list_id)
        )
        conn.commit()
        return True
    finally:
        conn.close()


def get_list(list_id):
    conn = get_db()
    try:
        cur = conn.execute('SELECT items, updated_at FROM lists WHERE id = ?', (list_id,))
        row = cur.fetchone()
    finally:
        conn.close()
    if row is None:
        return None
    return {'items': json.loads(row[0]), 'updated_at': row[1]}


def delete_list(list_id, edit_token):
    conn = get_db()
    try:
        cur = conn.execute('SELECT edit_token FROM lists WHERE id = ?', (list_id,))
        row = cur.fetchone()
        if row is None or not secrets.compare_digest(row[0], edit_token or ''):
            return False
        conn.execute('DELETE FROM lists WHERE id = ?', (list_id,))
        conn.commit()
        return True
    finally:
        conn.close()
