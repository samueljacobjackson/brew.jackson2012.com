import json
import random
import uuid

from app.aws import Dynamo
from app.util import BrewLog, Key_Helper, BrewLog, JSON, Html_Helper, Tag_Helper

class Brew(object):       
    key = None
    name = None
    description = None
    
    def __init__(self):
       self.key = None
       self.name = None
       self.description = None
    
    def create(self, name, description, userid):
        self.key = random.choice('abcdef') + str(uuid.uuid4()).replace("-", "")[1:]
        self.name = name
        self.description = description
        self.userid = user
        self.save()

    def dump_brew(self):
        f = open("brew_dump.json", "w")
        f.write(json.dumps(self, default=JSON().convert))
    
    
    def get(self, brew_key):
        table = BrewLog.brew()
        brew = Dynamo.query(brew_key,'key', table, 'info')
        self.load(brew)
        
    @staticmethod
    def get_simple_list(brew_keys=[]):
        if len(brew_keys) == 0:
            return []
        attributes='info.description'
        items = Dynamo.scan(brew_keys, attributes)
        brews = {}
        for key in items:
            brews[key] = items[key]
        return brews

    def load(self, brew):
        self.key = brew['key']
        self.name = brew['name']
        self.description = brew['description']

    def unload(self):
        brew = {}
        brew['key'] = self.key
        brew['name'] = self.name
        brew['description'] = self.description
        return brew

    def scrub(self):
        html_helper = Html_Helper()
        key_helper = Key_Helper()

        if not key_helper.check_key(self.key):
            raise KeyError('Item Key')

        if not self.name or self.name == '':
            raise ValueError('brew Name')
        self.name = html_helper.remove_html(self.name).strip()

        if not self.name.encode('ascii', 'ignore').decode('ascii', 'ignore') == self.name:
            raise ValueError('brew Name')

        self.description = html_helper.remove_html(self.description).strip()
        if self.description == '':
            self.description = self.name
        if not self.description.encode('ascii', 'ignore').decode('ascii', 'ignore') == self.description:
            raise ValueError('brew Description')
