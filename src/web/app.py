from flask import Flask, render_template, url_for
from asgiref.wsgi import WsgiToAsgi
from web.extensions.markdown import MarkdownExtension
from utils import get_data
from pdf import PDFGenerator
import pathlib
import random

static_folder = pathlib.Path(__name__).parent.parent.joinpath('static').absolute()

app = Flask('website', root_path='src', static_folder=static_folder)
app.jinja_env.add_extension(MarkdownExtension)

@app.context_processor
def inject_shared_data():
  data = get_data()
  easter_entries = [
    {
      'image_url': url_for('static', filename='easter/fry_02.png'),
      'text': 'There is something odd with this bug.',
      'offset_top': 70,
    },
    {
      'image_url': url_for('static', filename='easter/zoidberg_02.png'),
      'text': 'Do you wanna see my shell script?',
      'offset_top': 70,
    },
    {
      'image_url': url_for('static', filename='easter/bender_01.png'),
      'text': 'Do you need a bot? I have one right here!',
      'offset_top': 70,
    },
    {
      'image_url': url_for('static', filename='easter/zap_01.png'),
      'text': 'I marble at my own magnificent coding skills.',
      'offset_top': 80,
    },
    {
      'image_url': url_for('static', filename='easter/professor_01.png'),
      'text': 'Good news! I fixed the bug.',
      'offset_top': 70,
    },
  ]

  return {
    'header_data': {
      'title': 'Geidel Guerra',
      'meta': [
        {'name': 'description', 'content': data['about'].split('\n')[0]},
        {'name': 'keywords', 'content': ','.join([skill['label'].lower() for skill in data['skills']])},
        # OpenGraph
        {'property': 'og:title', 'content': 'Geidel Guerra'},
        {'property': 'og:type', 'content': 'website'},
        {'property': 'og:url', 'content': 'https://geidelguerra.com'},
        {'property': 'og:image', 'content': f"https://geidelguerra.com{url_for('static', filename='images/geidel_profile.jpg')}"},
        {'property': 'og:description', 'content': data['about'].split('\n')[0]},
        # Twitter
        {'name': 'twitter:title', 'content': 'Geidel Guerra'},
        {'name': 'twitter:card', 'content': 'summary'},
        {'name': 'twitter:site', 'content': '@geidelguerra'},
        {'name': 'twitter:image', 'content': f"https://geidelguerra.com{url_for('static', filename='images/geidel_profile.jpg')}"},
        {'name': 'twitter:description', 'content': data['about'].split('\n')[0]},
      ],
      'icons': [
        {
          'rel': 'icon',
          'type': 'image/x-icon',
          'href': '/static/icons/favicon.ico',
        },
        {
          'rel': 'shortcut icon',
          'type': '',
          'href': '/static/icons/favicon.ico',
        },
        {
          'rel': 'icon',
          'type': 'image/png',
          'href': '/static/icons/favicon-16x16.png',
          'sizes': '16x16'
        },
        {
          'rel': 'icon',
          'type': 'image/png',
          'href': '/static/icons/favicon-32x32.png',
          'sizes': '32x32'
        },
        {
          'rel': 'apple-touch-icon',
          'type': 'image/png',
          'href': '/static/icons/apple-touch-icon.png',
          'sizes': '180x180'
        }
      ]
    },
    'footer_data': {
      'networks': data['networks']
    },
    'easter_entry': random.choice(easter_entries)
  }

@app.get('/')
def home_page():
  data = get_data()
  return render_template('home.html', data=data)

@app.get('/genpdf')
def genpdf():
  data = get_data()
  pdf_generator = PDFGenerator()
  pdf_generator.generate_pdf('geidelguerra_cv.pdf', data)
  return ''

app = WsgiToAsgi(app)