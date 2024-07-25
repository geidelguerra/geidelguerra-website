import click
from pdf import PDFGenerator
from utils import get_data
import pathlib

@click.group()
def cli():
  pass

@cli.command()
def gen_pdf():
  static_folder = pathlib.Path(__name__).parent.joinpath('static').absolute()
  filepath = static_folder.joinpath('files').joinpath('geidelguerra_cv_en.pdf').__str__()

  generator = PDFGenerator()

  click.echo(f"Generating PDF in `{filepath}`")
  generator.generate_pdf(filepath, get_data())

if __name__ == '__main__':
  cli()