from flask import Flask, json, render_template, url_for
from asgiref.wsgi import WsgiToAsgi
from web.extensions.markdown import MarkdownExtension
from utils import get_data
import pathlib

static_folder = pathlib.Path(__name__).parent.parent.joinpath('static').absolute()

def asset_func(path: str):
    manifest_path = static_folder.joinpath('manifest.json')
    if manifest_path.exists():
        manifest = None
        with open(manifest_path, 'r') as f:
            manifest = json.loads(f.read())
        for item in manifest:
            if item['path'] == path:
                return '/static/' + item['hash']

    return '/static/' + path

nav_menu = [
    {'text': 'Home', 'url': '/'},
    {'text': 'Games', 'url': '/games'},
]

games_list = [
    {
        'name': 'Complexity Invaders',
        'slug': 'complexity-invaders',
        'script': asset_func('js/games/complexity-invaders.js')
    },
]

app = Flask('website', root_path='src', static_folder=static_folder)
app.jinja_env.add_extension(MarkdownExtension)
app.jinja_env.globals.update(asset=asset_func)

@app.context_processor
def inject_shared_data():
  data = get_data()

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
    'nav_menu': nav_menu,
  }

@app.get('/')
def home_page():
    data = get_data()
    return render_template('home.html', data=data)

@app.get('/games')
def games_page():
    return render_template('games.html', games=games_list)

@app.get('/games/<slug>')
def game_page(slug: str):
    game = None
    for g in games_list:
        if g['slug'] == slug:
            game = g
            break

    if game is None:
        return "Game not found", 404

    return render_template('game.html', game=game)

app = WsgiToAsgi(app)
