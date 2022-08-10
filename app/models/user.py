import boto3
from boto3.dynamodb.conditions import Key, Attr, And

from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin

import decimal
import json
import os
import time
import random
import traceback
import uuid
from uuid import UUID

from app.util import BrewLog, DecimalEncoder
from app.aws import Dynamo

class User(UserMixin):
    def __init__(self, id_, email, profile_pic, key=None, brews=None, active=None, expire=None):
        self.id = id_
        self.key = key or ''
        self.email = email
        self.profile_pic = profile_pic
        self.brews = brews or []
        self.active = active or False
        self.expire = expire or time.time()

    @staticmethod
    def get(id_):
        u = User._get(id_)
        if not u:
            return None
        user = User(
            id_=u['id'],
            email=u['info']['email'],
            profile_pic=u['info']['profile_pic'],
            key=u['info']['key'],
            brews=u['info']['brews'],
            active=u['info']['active'],
            expire=u['info']['expire'])
        return user

    @staticmethod
    def get_by_email(email):
        u = User._get_by_email(email)
        if not u:
            return None
        user = User(
            id_=u['id'],
            email=u['info']['email'],
            profile_pic=u['info']['profile_pic'],
            key=u['info']['key'],
            brews=u['info']['brews'],
            active=u['info']['active'],
            expire=u['info']['expire'])
        return user

    @staticmethod
    def add_brew(brew_key, id_):
        user = User._get(id_)
        user['info']['brews'].append(brew_key)
        User._save(user['id'], user['email'], user['info'])

    @staticmethod
    def remove_brew(brew_key, id_):
        user = User._get(id_)
        user['info']['brews'].remove(brew_key)
        User._save(user['id'], user['email'], user['info'])

    @staticmethod
    def create(id_, email, name, profile_pic):
        info = {}
        info['key'] = random.choice('abcdef') + str(uuid.uuid4()).replace("-", "")[1:]
        info['email'] = email
        info['profile_pic'] = profile_pic
        info['brews'] = []
        info['active'] = True
        info['expire'] = time.time()
        User._create(id_, email, info)

    @staticmethod
    def _create(id_, email, info):
        table = BrewLog.User()
        Dynamo.put_item(id_, 'id', email, 'email', table, info, 'info')
    
    @staticmethod
    def _get(id_):
        AWS_DYNAMO_REGION = os.environ.get('AWS_DYNAMO_REGION')
        dynamodb = boto3.resource('dynamodb', region_name=AWS_DYNAMO_REGION)
        
        table = dynamodb.Table(BrewLog.User())
        try:
            response = table.query(
                KeyConditionExpression=Key('id').eq(id_)
            )
            return response['Items'][0]
        except Exception as err:
            traceback.print_exc()
            return None
    
    @staticmethod
    def _get_by_email(email_):
        AWS_DYNAMO_REGION = os.environ.get('AWS_DYNAMO_REGION')
        dynamodb = boto3.resource('dynamodb', region_name=AWS_DYNAMO_REGION)
        table = dynamodb.Table(BrewLog.User())

        response = table.scan(
            FilterExpression=Attr('email').eq(email_)
        )
        try:
            user = response['Items'][0]
            return user
        except Exception as err:
            traceback.print_exc()
            return None
        

    @staticmethod
    def _save(id_, email, info):
        AWS_DYNAMO_REGION = os.environ.get('AWS_DYNAMO_REGION')
        dynamodb = boto3.resource('dynamodb', region_name=AWS_DYNAMO_REGION)
        j = json.dumps(info, cls=DecimalEncoder)
        info = json.loads(j, parse_float=decimal.Decimal)

        user_table = BrewLog.User()
        
        table = dynamodb.Table(user_table)
        table.update_item(
            Key={
                'id': id_,
                'email': email
            },
            UpdateExpression='set info = :i',
            ExpressionAttributeValues={
                ':i': info
            }
        )