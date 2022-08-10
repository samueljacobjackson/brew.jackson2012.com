from flask import render_template, redirect, url_for, flash
from flask import request, jsonify, session
from flask_login import LoginManager, current_user, login_user, login_required, logout_user

from oauthlib.oauth2 import WebApplicationClient
import requests

import decimal
import json
import os
import traceback

from dotenv import load_dotenv
load_dotenv()

from app import application as app
from app import dice
from app.aws import S3
from app.util import DecimalEncoder, Email_Helper
from app.models.brew import Brew
from app.models.user import User

login_manager = LoginManager()
login_manager.init_app(app)

GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", None)
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", None)
GOOGLE_DISCOVERY_URL = (
    "https://accounts.google.com/.well-known/openid-configuration"
)
client = WebApplicationClient(GOOGLE_CLIENT_ID)

@app.route('/')
def index():

    dev = False
    open_beta = False
    if os.environ.get('BrewLog', 'PROD') == 'DEV':
        open_beta = False
        dev = True

    if not current_user.is_authenticated:
        return render_template('layouts/noauth.html', logged_in = False, open_beta=open_beta)
    elif not current_user.active:
        return render_template('layouts/noauth.html', logged_in = True, open_beta=open_beta)
    else:        
        brew_key = request.args.get('brew')
        brews = []
        
        g = Brew.get_simple_list()
        
        if not brew_key in g:
            brew_key = None

        for gkey in g:
            brew = {}
            brew['key'] = g[gkey]['key']
            brew['name'] = g[gkey]['name']
            brew['description'] = g[gkey]['description']
            brews.append(brew)

        return render_template('layouts/home.html',
                               name=current_user.name,
                               email=current_user.email,
                               profile_pic=current_user.profile_pic,
                               active=current_user.active,
                               brews=brews,
                               brew_key=brew_key,
                               open_beta=open_beta,
                               dev=dev)


@app.route("/login")
def login():
    # Find out what URL to hit for Google login
    google_provider_cfg = get_google_provider_cfg()
    authorization_endpoint = google_provider_cfg["authorization_endpoint"]

    # Use library to construct the request for Google login and provide
    # scopes that let you retrieve user's profile from Google
    request_uri = client.prepare_request_uri(
        authorization_endpoint,
        redirect_uri=request.base_url + "/callback",
        scope=["openid", "email"],
    )
    return redirect(request_uri)


@app.route("/login/callback")
def callback():
    # Get authorization code Google sent back to you
    code = request.args.get("code")

    google_provider_cfg = get_google_provider_cfg()
    token_endpoint = google_provider_cfg["token_endpoint"]

    token_url, headers, body = client.prepare_token_request(
        token_endpoint,
        authorization_response=request.url,
        redirect_url=request.base_url,
        code=code,
    )
    token_response = requests.post(
        token_url,
        headers=headers,
        data=body,
        auth=(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET),
    )

    client.parse_request_body_response(json.dumps(token_response.json()))

    userinfo_endpoint = google_provider_cfg["userinfo_endpoint"]
    uri, headers, body = client.add_token(userinfo_endpoint)
    userinfo_response = requests.get(uri, headers=headers, data=body)

    if userinfo_response.json().get("email_verified"):
        unique_id = userinfo_response.json()["sub"]
        users_email = userinfo_response.json()["email"]
        picture = userinfo_response.json()["picture"]
    else:
        return "User email not available or not verified by Google.", 400

    user = User(unique_id, users_email, picture)
    # Doesn't exist? Add to database
    if not User.get(unique_id):
        User.create(unique_id, users_email, picture)

    # Begin user session by logging the user in
    login_user(user)

    # Send user back to homepage
    return redirect(url_for("index"))

@app.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("index"))

@app.route('/getbrewlist', methods=['POST'])
def get_brew_list():
    if not current_user.is_authenticated:
        return {'error': True, 'title': "AccessDenied", 'message': 'You are not logged in.'}
    if not current_user.active:
        return {'error': True, 'title': "AccessDenied", 'message': 'You are not authorized.'}

    try:
        brews = []

        g = Brew.get_simple_list(current_user.brews)
        for gkey in g:
            brew = {}
            brew['key'] = g[gkey]['key']
            brew['name'] = g[gkey]['name']
            brew['description'] = g[gkey]['description']
            brews.append(brew)

        j = json.dumps(brews, default=convert)
        return { 'error': False, 'brews': j }

    except Exception as err:
        traceback.print_exc()
        return { 'error': True, 'title': type(err).__name__, 'message': err.args }

@app.route('/createbrew', methods=['POST'])
def create_brew():
    if not current_user.is_authenticated:
        return {'error': True, 'title': "AccessDenied", 'message': 'You are not logged in.'}
    if not current_user.active:
        return {'error': True, 'title': "AccessDenied", 'message': 'You are not authorized.'}

    try:
        data = request.get_json()
        brew = Brew()
        brew.create(data['name'], data['description'], current_user.id)
        User.add_brew(brew.key, current_user.id)
        j = json.dumps(brew, default=convert)
        return { 'error': False, 'is_gm': True, 'brew': j }
    except Exception as err:
        traceback.print_exc()
        return { 'error': True, 'title': type(err).__name__, 'message': err.args }

@app.route('/updatebrew', methods=['POST'])
def edit_brew():
    if not current_user.is_authenticated:
        return {'error': True, 'title': "AccessDenied", 'message': 'You are not logged in.'}
    if not current_user.active:
        return {'error': True, 'title': "AccessDenied", 'message': 'You are not authorized.'}

    try:
        data = request.get_json()
        brew = Brew()
        brew.get(data['brew_key'])
        brew.update(data['name'], data['description'])

        return { 'error': False, 'name': data['name'], 'description': data['description'] }
    except Exception as err:
        traceback.print_exc()
        return { 'error': True, 'title': type(err).__name__, 'message': err.args }

@app.route('/getbrew', methods=['POST'])
def get_brew():
    if not current_user.is_authenticated:
        return {'error': True, 'title': "AccessDenied", 'message': 'You are not logged in.'}
    if not current_user.active:
        return {'error': True, 'title': "AccessDenied", 'message': 'You are not authorized.'}
    
    brew_key = request.get_data().decode('ASCII')
    try:
        brew = Brew()
        brew.get(brew_key)
        j = json.dumps(brew, default=convert)
        return { 'error': False, 'is_gm': is_gm, 'brew': j }
    except Exception as err:
        traceback.print_exc()
        return { 'error': True, 'title': type(err).__name__, 'message': err.args }


@app.route('/tos', methods=['POST', 'GET'])
def tos():
    return render_template('layouts/tos.html')


@app.route('/privacy', methods=['POST', 'GET'])
def privacy():
    return render_template('layouts/privacy.html')


def convert(o):
    if not o.__class__.__name__ == 'Decimal':
        return o.__dict__
    else:
        return float(o)


def get_google_provider_cfg():
    return requests.get(GOOGLE_DISCOVERY_URL).json()


@login_manager.user_loader
def load_user(user_id):
    return User.get(user_id)


@login_manager.unauthorized_handler
def unauthorized():
    return "You must be logged in to access this content.", 403
