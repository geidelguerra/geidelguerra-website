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
  filename = static_folder.joinpath('files').joinpath('geidelguerra_cv_en.pdf')
  data = get_data()

  generator = PDFGenerator()
  generator.generate_pdf(str(filename), data)

if __name__ == '__main__':
  cli()