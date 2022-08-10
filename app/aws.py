import boto3
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key, Attr

import json

from io import BytesIO
import os

from dotenv import load_dotenv
load_dotenv()

from PIL import Image
import json
import decimal
import random
import uuid
from uuid import UUID
from app.util import BrewLog, DecimalEncoder

class Dynamo(object):
    @staticmethod
    def scan(keys, attributes):
        AWS_DYNAMO_REGION = os.environ.get('AWS_DYNAMO_REGION')
        dynamodb = boto3.resource('dynamodb', region_name=AWS_DYNAMO_REGION)
        table = dynamodb.Table(BrewLog.Game())

        response = table.scan(
            ProjectionExpression='info.#k, info.#n, ' + attributes,
            ExpressionAttributeNames={ '#k': 'key', '#n': 'name' },
            FilterExpression=Attr('info.key').is_in(keys)
        )
        items = {}
        for i in range(len(response['Items'])):
            item = response['Items'][i]['info']
            items[item['key']] = item
        return items

    @staticmethod
    def query(key, key_name, table, ret):
        AWS_DYNAMO_REGION = os.environ.get('AWS_DYNAMO_REGION')
        dynamodb = boto3.resource('dynamodb', region_name=AWS_DYNAMO_REGION)
        table = dynamodb.Table(table)
        response = table.query(
            KeyConditionExpression=Key(key_name).eq(key)
        )
        return response['Items'][0][ret]
        
    @staticmethod
    def update(key, key_name, table, item, update_expression):
        j = json.dumps(item, cls=DecimalEncoder)
        item = json.loads(j, parse_float=decimal.Decimal)

        AWS_DYNAMO_REGION = os.environ.get('AWS_DYNAMO_REGION')
        dynamodb = boto3.resource('dynamodb', region_name=AWS_DYNAMO_REGION)
        table = dynamodb.Table(table)
        table.update_item(
                Key={
                    key_name: key
                },
                UpdateExpression=update_expression,
                ExpressionAttributeValues={
                    ':i' : item
                }
            )
    
    @staticmethod
    def put(key, key_name, table, item, item_name):
        j = json.dumps(item, cls=DecimalEncoder)
        item = json.loads(j, parse_float=decimal.Decimal)

        AWS_DYNAMO_REGION = os.environ.get('AWS_DYNAMO_REGION')
        dynamodb = boto3.resource('dynamodb', region_name=AWS_DYNAMO_REGION)
        table = dynamodb.Table(table)
        table.put_item(
            Item={
                key_name: key,
                item_name: item
            }
        )

    @staticmethod
    def put_item(key, key_name, sort_key, sort_key_name, table, item, item_name):
        j = json.dumps(item, cls=DecimalEncoder)
        item = json.loads(j, parse_float=decimal.Decimal)

        AWS_DYNAMO_REGION = os.environ.get('AWS_DYNAMO_REGION')
        dynamodb = boto3.resource('dynamodb', region_name=AWS_DYNAMO_REGION)
        table = dynamodb.Table(table)
        table.put_item(
           Item={
               key_name: key,
               sort_key_name: sort_key,
               item_name: item
            }
        )
