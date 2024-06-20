from reportlab.pdfgen.canvas import Canvas
from reportlab.platypus import Paragraph
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from pathlib import Path

class PDFGenerator:
  def __init__(self) -> None:
    self.margin = 40
    self.default_font_size = 10
    self.default_leading = self.default_font_size * 1.4
    self.default_font = 'FiraSansRegular'
    self.header_font = 'FiraSansBold'
    self.state_stack = []
    self.register_fonts()

  def save_state(self, canvas: Canvas) -> None:
    self.state_stack.append((canvas._fontname, canvas._fontsize, canvas._leading))

  def restore_state(self, canvas: Canvas) -> None:
    (fontname, fontsize, leading) = self.state_stack.pop()
    canvas._fontname = fontname
    canvas._fontsize = fontsize
    canvas._leading = leading

  def register_fonts(self) -> None:
    for font_name, font_filename in [
      ('FiraSansRegular', 'FiraSans-Regular.ttf'),
      ('FiraSansBold', 'FiraSans-Bold.ttf'),
    ]:
      font_path = Path(__file__).parent.joinpath('fonts').joinpath(font_filename)
      pdfmetrics.registerFont(TTFont(font_name, font_path))

  def _draw_text_line(self, canvas: Canvas, text: str) -> None:
    x = canvas._x + self.margin
    y = canvas._y
    if y == 0:
      y = self.margin + canvas._leading

    text_obj = canvas.beginText(x, y)
    text_obj.textLines(text)
    canvas.drawText(text_obj)
    canvas._y = text_obj._y + canvas._leading

  def draw_text_block(self, canvas: Canvas, text: str) -> None:
    x = self.margin
    y = canvas._y
    if y == 0:
      y = self.margin + canvas._leading

    style = getSampleStyleSheet()['Normal']
    style.fontName = canvas._fontname
    style.fontSize = canvas._fontsize
    style.leading = canvas._leading

    paragraph = Paragraph(text.replace('\n', '<br/>'), style)
    paragraph.debug = 0
    paragraph.wrapOn(canvas, canvas._pagesize[0] - self.margin * 2, 0)
    height = paragraph.height
    # hack to draw text correctly
    paragraph.height = canvas._leading
    paragraph.drawOn(canvas, x, y)
    paragraph.height = height
    canvas._y += paragraph.height + style.leading

  def _draw_text_header(self, canvas: Canvas, text: str, level: int = 1) -> None:
    self.save_state(canvas)
    font_size = (1 - (level * 0.8 / 6)) * canvas._fontsize * 2

    canvas.setFont(self.header_font, font_size, font_size * 0.5)
    self._draw_text_line(canvas, text)

    self.restore_state(canvas)

  def draw_label_value_line(self, canvas: Canvas, label: str, value: str) -> None:
    sep = '-'
    padding = 2
    label += ' ' * padding
    value = ' ' * padding + value
    available_width = canvas._pagesize[0] - self.margin * 2 - canvas.stringWidth(label) - canvas.stringWidth(value)
    sep_width = canvas.stringWidth(sep)
    text = f"{label}{sep * (int(available_width / sep_width) - 2)}{value}"
    self.save_state(canvas)
    canvas.setFontSize(None, canvas._fontsize)
    self._draw_text_line(canvas, text)
    self.restore_state(canvas)

  def generate_pdf(self, filename: str, data: dict):
    canvas = Canvas(filename=filename, bottomup=0, pagesize=(540, 2200))
    canvas.setTitle('Geidel Guerra CV')
    canvas.setFont(self.default_font, self.default_font_size, self.default_leading)
    canvas.setFillColorRGB(0, 0, 0, 1)

    self._draw_text_header(canvas, 'Who Am I?')
    self.draw_text_block(canvas, data['about'])

    self._draw_text_line(canvas, '')

    self._draw_text_header(canvas, 'Skills')
    for item in data['skills']:
      self.draw_label_value_line(canvas, item['label'], item['years'])

    self._draw_text_line(canvas, '')

    self._draw_text_header(canvas, 'Languages')
    for item in data['languages']:
      self.draw_label_value_line(canvas, item['label'], item['score'])

    self._draw_text_line(canvas, '')

    self._draw_text_header(canvas, 'Toolkit')
    for item in data['toolkit']:
      self.draw_label_value_line(canvas, item['category'], ', '.join(item['tools']))

    self._draw_text_line(canvas, '')

    self._draw_text_header(canvas, f"Studies")
    for item in data['studies']:
      self.save_state(canvas)
      canvas.setFontSize(None, canvas._fontsize * 0.7)
      self._draw_text_header(canvas, item['name'], 3)
      self._draw_text_line(canvas, item['school'])
      self._draw_text_line(canvas, f"{item['startDate']} - {item['endDate']} ({item['years']})")
      self._draw_text_line(canvas, '')
      self.restore_state(canvas)

    self._draw_text_line(canvas, '')

    self._draw_text_header(canvas, f"Experience ({data['experienceYears']})")
    for item in data['experience']:
      self.save_state(canvas)
      canvas.setFontSize(None, canvas._fontsize * 0.7)
      self._draw_text_header(canvas, item['name'], 3)
      self._draw_text_line(canvas, item['company'])
      self._draw_text_line(canvas, f"{item['startDate']} - {item['endDate']} ({item['years']})")
      self.restore_state(canvas)
      self._draw_text_line(canvas, ', '.join(item['tech']))

    self._draw_text_line(canvas, '')

    self._draw_text_header(canvas, 'Projects')
    for item in data['projects']:
      self.save_state(canvas)
      canvas.setFontSize(None, canvas._fontsize * 0.7)
      self._draw_text_header(canvas, item['name'], 3)
      self._draw_text_line(canvas, f"{item['startDate']} - {item['endDate']}")
      self.restore_state(canvas)
      self.draw_text_block(canvas, item['description'])

    canvas.save()
