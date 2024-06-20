from jinja2.nodes import CallBlock
from jinja2.ext import Extension
import markdown

class MarkdownExtension(Extension):
  tags = {'markdown'}

  def __init__(self, environment):
    super().__init__(environment)

  def parse(self, parser):
    lineno = next(parser.stream).lineno
    body = parser.parse_statements(['name:endmarkdown'], drop_needle=True)

    return CallBlock(self.call_method('_render_markdown'), [], [], body).set_lineno(lineno)

  def _render_markdown(self, caller) -> str:
    text = caller()
    parsed_text = markdown.markdown(text, extensions=[])

    return parsed_text