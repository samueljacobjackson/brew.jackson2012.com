import os
if os.environ.get('BREWLOG', 'PROD') != 'DEV':
    import eventlet
    eventlet.monkey_patch()

from flask import Flask, render_template, make_response
from flask_session import Session
from flask_cors import CORS

#import os

application = Flask(__name__)

GEVENT_SUPPORT = True
cors = CORS(application)

application.secret_key = os.urandom(24)
application.config['SESSION_TYPE'] = 'filesystem'
application.config['SESSION_KEY_PREFIX'] = "brewlog"
application.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024
application.config['GOOGLE_LOGIN_REDIRECT_SCHEME'] = "https"

if os.environ.get('BREWLOG', 'PROD') == 'DEV':
    application.debug = True

application._static_folder = os.path.abspath("./app/templates/static/")

Session(application)

from app import routes
import app.sock as sock

name = '__main__'
if os.environ.get('BREWLOG', 'PROD') == 'DEV':
        name = 'app'

if __name__ == name:
    if os.environ.get('BREWLOG', 'PROD') == 'DEV':
        sock.socketio.run(application, host='0.0.0.0', port=5000, keyfile='key.pem', certfile='cert.pem')
    else:
        sock.socketio.run(application, host='0.0.0.0', port=5000)