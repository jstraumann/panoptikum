from flask import Flask
from flask_api import FlaskAPI
from pandas_datapackage_reader import read_datapackage
from functools import wraps

from flask import (
    url_for, redirect,
    request, flash,
    render_template,
    send_from_directory, Response,
)

try:
    from .util import *
except:
    from util import *

app = FlaskAPI(__name__)


# https://stackoverflow.com/questions/29725217/password-protect-one-webpage-in-flask-app
def check_auth(username, password):
    """This function is called to check if a username /
    password combination is valid.
    """
    return username == 'guest' and password == '12.Capr.21'

def authenticate():
    """Sends a 401 response that enables basic auth"""
    return Response(
    'Could not verify your access level for that URL.\n'
    'You have to login with proper credentials', 401,
    {'WWW-Authenticate': 'Basic realm="Login Required"'})

def requires_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.authorization
        if not auth or not check_auth(auth.username, auth.password):
            return authenticate()
        return f(*args, **kwargs)
    return decorated



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

# Static views

@app.route('/')
@requires_auth
def send_home():
    return render_template('public/index.html')

@app.route('/static/<path:path>')
@requires_auth
def send_static(path):
    return send_from_directory('static', path)

@app.route('/images/<path:path>')
@requires_auth
def send_images(path):
    return send_from_directory('images', path)

if __name__ == '__main__':
    app.run(debug=True)
