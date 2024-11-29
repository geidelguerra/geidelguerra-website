import click
from pdf import PDFGenerator
from utils import get_data
import pathlib
import hashlib
import json

static_folder = pathlib.Path(__name__).parent.joinpath('static').absolute()

@click.group()
def cli():
  pass

@cli.command()
def gen_pdf():
  filepath = static_folder.joinpath('files').joinpath('geidelguerra_cv_en.pdf').__str__()

  generator = PDFGenerator()

  click.echo(f"Generating PDF in `{filepath}`")
  generator.generate_pdf(filepath, get_data())

@cli.command()
def generate_manifest():
    manifest = [
        { 'path': 'css/style.css', 'hash': ''},
        { 'path': 'js/app.js', 'hash': ''},
        { 'path': 'js/howler.min.js', 'hash': ''},
        { 'path': 'js/games/complexity-invaders.js', 'hash': ''},
    ]

    for item in manifest:
        with open(static_folder.joinpath(item['path']), 'rb') as file:
            hash = hashlib.md5(file.read()).digest().hex()
            item['hash'] = item['path'] + '?v=' + hash

    with open(static_folder.joinpath('manifest.json'), 'w') as f:
        f.write(json.dumps(manifest))

if __name__ == '__main__':
  cli()
