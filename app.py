from flask import Flask
from flask_cors import CORS
from pandas_datapackage_reader import read_datapackage
from functools import wraps

from flask import (
    request,
    render_template,
    send_from_directory,
    jsonify
)

try:
    from .util import *
    from .lists_store import create_list, update_list, get_list, delete_list
except:
    from util import *
    from lists_store import create_list, update_list, get_list, delete_list

MAX_LIST_ITEMS = 500

app = Flask(__name__)
CORS(app)

# Create API endpoints

data = read_datapackage("data")

@app.route('/api/<resource>')
def api_dict(resource):
    return get_paginated(request.args, data[resource])

@app.route('/api/<resource>.random')
def api_random(resource):
    return get_random(data[resource])

@app.route('/api/<resource>.json')
def api_json(resource):
    return get_paginated(request.args, data[resource], True)

@app.route('/api/<resource>/all.json')
def api_all_json(resource):
    return data[resource].to_json(orient='records')

# Shareable lists

def _clean_items(raw_items):
    if not isinstance(raw_items, list) or not raw_items:
        return None
    if len(raw_items) > MAX_LIST_ITEMS:
        raw_items = raw_items[:MAX_LIST_ITEMS]
    try:
        items = [int(i) for i in raw_items]
    except (TypeError, ValueError):
        return None
    valid_ids = set(data['images']['Nummer'].tolist())
    items = [i for i in items if i in valid_ids]
    return items or None

@app.route('/api/lists', methods=['POST'])
def api_create_list():
    body = request.get_json(silent=True) or {}
    items = _clean_items(body.get('items'))
    if items is None:
        return jsonify({'error': 'invalid items'}), 400
    list_id, edit_token = create_list(items)
    return jsonify({'id': list_id, 'edit_token': edit_token})

@app.route('/api/lists/<list_id>', methods=['GET'])
def api_get_list(list_id):
    stored = get_list(list_id)
    if stored is None:
        return jsonify({'error': 'not found'}), 404
    df = data['images']
    items_df = df[df['Nummer'].isin(stored['items'])]
    items_df = items_df.set_index('Nummer').loc[stored['items']].reset_index()
    return items_df.to_json(orient='records')

@app.route('/api/lists/<list_id>', methods=['PUT'])
def api_update_list(list_id):
    edit_token = request.headers.get('X-Edit-Token', '')
    body = request.get_json(silent=True) or {}
    items = _clean_items(body.get('items'))
    if items is None:
        return jsonify({'error': 'invalid items'}), 400
    if not update_list(list_id, edit_token, items):
        return jsonify({'error': 'not found or forbidden'}), 403
    return jsonify({'id': list_id})

@app.route('/api/lists/<list_id>', methods=['DELETE'])
def api_delete_list(list_id):
    edit_token = request.headers.get('X-Edit-Token', '')
    if not delete_list(list_id, edit_token):
        return jsonify({'error': 'not found or forbidden'}), 403
    return '', 204

# Static views

@app.route('/')
#@requires_auth
def send_home():
    return render_template('public/index.html')

@app.route('/liste/<list_id>')
#@requires_auth
def send_shared_list(list_id):
    return render_template('public/index.html')

@app.route('/static/<path:path>')
#@requires_auth
def send_static(path):
    return send_from_directory('static', path)

@app.route('/images/<path:path>')
#@requires_auth
def send_images(path):
    return send_from_directory('images', path)

if __name__ == '__main__':
    app.run(debug=True)