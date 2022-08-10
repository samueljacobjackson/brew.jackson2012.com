from flask import Flask, render_template, make_response
from flask_session import Session
from flask_cors import CORS

import os
from dotenv import load_dotenv
load_dotenv()

application = Flask(__name__)

GEVENT_SUPPORT = True
cors = CORS(application)

application.secret_key = os.urandom(24)
application.config['SESSION_TYPE'] = 'filesystem'
application.config['SESSION_KEY_PREFIX'] = "brewlog"
application.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024
application.config['GOOGLE_LOGIN_REDIRECT_SCHEME'] = "https"

if os.environ.get('FLASK_DEBUG', 'FALSE') == 'TRUE':
    application.debug = True

application._static_folder = os.path.abspath("./app/templates/static/")

Session(application)

from app import routes

name = '__main__'

if __name__ == name:
    if os.environ.get('FLASK_DEBUG', 'FALSE') == 'TRUE':
        application.run(application, host='0.0.0.0', port=5000, ssl_context=('cert.pem', 'key.pem'))
    else:
        application.run(application, ssl_context='adhoc', host='0.0.0.0', port=5000)