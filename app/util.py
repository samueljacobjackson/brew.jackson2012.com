from boto3 import utils
from bs4 import BeautifulSoup
import json
import decimal
from decimal import Decimal
import os
import re

class Html_Helper:
    def scrub_scripts(self, text):
        soup = BeautifulSoup(text, "html.parser")
        to_extract = soup.findAll('script')
        for item in to_extract:
            item.extract()

        to_extract = soup.findAll()
        for item in to_extract:
            att = item.attrs
            for i in att:
                if re.search('^on', i):
                    item[i] = ""

        return str(soup).strip()

    def remove_html(self, text):
        soup = BeautifulSoup(text, "html.parser")
        to_extract = soup.findAll(re.compile('.*'))
        for item in to_extract:
            item.extract()

        return str(soup).strip()

class Tag_Helper:
    def to_string(self, arr):
        s = ""
        for ele in arr:
            s += str.replace(ele, '.', '-').lower() + ' '
        return s

    def from_string(self, s):
        s = str.replace(s, '-', '.').lower()
        arr = s.split()
        return arr

    def escape_spaces(self, s):
        return str.replace(s, ' ', '.').lower()

class Key_Helper:
    def check_key(self, key):
        if key == None:
            return False
        if re.search('^[abcdef][abcdef0-9]{31}$', key) == None:
            return False
        return True

class Email_Helper:
    def check_email(self, email):
        pattern = r'^(("[\w-\s]+")|([\w-]+(?:\.[\w-]+)*)|("[\w-\s]+")([\w-]+(?:\.[\w-]+)*))(@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$)|(@\[?((25[0-5]\.|2[0-4][0-9]\.|1[0-9]{2}\.|[0-9]{1,2}\.))((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){2}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\]?$)'
        if re.search(pattern, email) == None:
            return False
        return True

class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, decimal.Decimal):
            return float(o)
        return super(DecimalEncoder, self).default(o)

class BrewLog:
    @staticmethod
    def Brew():
        table = 'BrewLog_Brew'
        return table

    @staticmethod
    def User():
        table = 'BrewLog_User'
        return table
    
class Scrubber:
        
    @staticmethod
    def scrub(item, type):
        html_helper = Html_Helper()
        key_helper = Key_Helper()
        tag_helper = Tag_Helper()

        if not key_helper.check_key(item['key']):
            raise KeyError('Item Key')

        if not item['name'] or item['name'] == '':
            raise ValueError('Item Name')
        item['name'] = html_helper.remove_html(item['name']).strip()

        if not item['name'].encode('ascii', 'ignore').decode('ascii', 'ignore') == item['name']:
            raise ValueError('Name')

        if type in ('game', 'board', 'scene', 'tile'):
            if item['description'] != None:
                item['description'] = html_helper.remove_html(item['description']).strip()
                if item['description'] == '':
                    item['description'] = item['name']
                if not item['description'].encode('ascii', 'ignore').decode('ascii', 'ignore') == item['description']:
                    raise ValueError('Item Description')

        if type in ('game'):
            if item['gm'] != None:
                if not key_helper.check_key(item['gm']):
                    raise KeyError('GM Key')
        
        if type in ('player'):
            if item['logs'] != None:
                for key in item['logs']:
                    item['logs'][key] = Scrubber.scrub_logs_item(item['logs'][key])

        if type in ('scene'):
            if ['fog_of_war'] != None:
                for key in item['fog_of_war']:
                    item['fog_of_war'][key]['name'] = html_helper.remove_html(item['fog_of_war'][key]['name']).strip()
                    if not key_helper.check_key(key):
                        raise KeyError('Fog of War Key')
                    if item['fog_of_war'][key]['name'] == "":
                        item['fog_of_war'][key]['name'] = 'Unknown Fog'
        
            if item['board_key'] != None:
                if not key_helper.check_key(item['board_key']):
                    raise KeyError('Board Key')
        
            if item['stage'] != None:
                if item['stage'] == '':
                    raise ValueError('Scene Stage')

        if type in ('tile'):
            if item['details'] != None:
                item['details'] = html_helper.scrub_scripts(item['details']).strip()

            if item['tooltip'] != None:
                item['tooltip'] = html_helper.remove_html(item['tooltip']).strip()

            if item['id'] != None:
                if not key_helper.check_key(item['id']):
                    raise KeyError('Tile Id')
                    
        if type in ('tile', 'board'):
            if item['filename'] != None:
                item['filename'] = html_helper.remove_html(item['filename']).strip()
                if item['filename'] == '':
                    item['filename'] = 'tl0000000000.jpg'

            if item['owner'] != None:
                item['owner'] = html_helper.remove_html(item['owner']).strip()
        
            if item['tags'] != None:
                for i in range(len(item['tags'])):
                    tag = html_helper.remove_html(item['tags'][i]).strip()
                    if len(item['tags'][i]) == 0:
                        tag = 'invalid.tag'
                    item['tags'][i] = tag_helper.escape_spaces(tag)
        
        return item
        
    @staticmethod
    def scrub_logs_item(logs_item):
        html_helper = Html_Helper()
        key_helper = Key_Helper()

        logs_item['message'] = html_helper.scrub_scripts(logs_item['message']).strip()
        logs_item['title'] = html_helper.scrub_scripts(logs_item['title']).strip()
        logs_item['icon'] = html_helper.remove_html(logs_item['icon']).strip()
        logs_item['link'] = html_helper.scrub_scripts(logs_item['link']).strip()
        if not key_helper.check_key(logs_item['key']):
            raise KeyError('Log Key')
        if logs_item['message'] == '':
            raise ValueError('Log Message')
        if logs_item['title'] == '':
            raise ValueError('Log Title')
        if logs_item['icon'] == '':
            logs_item['icon'] == 'fa-square'
        if logs_item['link'] == '':
            logs_item['link'] == None
        
        text = html_helper.remove_html(logs_item['message'])
        if not text.encode('ascii').decode('ascii', 'ignore') == text:
            raise ValueError('Log Message')

        if not logs_item['title'].encode('ascii').decode('ascii', 'ignore') == logs_item['title']:
            raise ValueError('Log Title')
        if not logs_item['icon'].encode('ascii').decode('ascii', 'ignore') == logs_item['icon']:
            raise ValueError('Log Icon')
        if not logs_item['link'].encode('ascii').decode('ascii', 'ignore') == logs_item['link']:
            raise ValueError('Log Link')
        return logs_item

    @staticmethod
    def roll_log_item(log_item):
        html_helper = Html_Helper()
        key_helper = Key_Helper()

        log_item['message'] = html_helper.scrub_scripts(log_item['message']).strip()
        log_item['title'] = html_helper.scrub_scripts(log_item['title']).strip()
        log_item['icon'] = html_helper.remove_html(log_item['icon']).strip()
        log_item['link'] = html_helper.scrub_scripts(log_item['link']).strip()
        if not key_helper.check_key(log_item['key']):
            raise KeyError('Log Key')
        if log_item['message'] == '':
            raise ValueError('Log Message')
        if log_item['title'] == '':
            raise ValueError('Log Title')
        if log_item['icon'] == '':
            log_item['icon'] == 'fa-square'
        if log_item['link'] == '':
            log_item['link'] == None
        if not log_item['message'].encode('ascii').decode('ascii', 'ignore') == log_item['message']:
            raise ValueError('Log Message')
        if not log_item['title'].encode('ascii').decode('ascii', 'ignore') == log_item['title']:
            raise ValueError('Log Title')
        if not log_item['icon'].encode('ascii').decode('ascii', 'ignore') == log_item['icon']:
            raise ValueError('Log Icon')
        if not log_item['link'].encode('ascii').decode('ascii', 'ignore') == log_item['link']:
            raise ValueError('Log Link')
        return log_item

class JSON:
    @staticmethod
    def convert(o):
        if not o.__class__.__name__ == 'Decimal':
            return o.__dict__
        else:
            return float(o)