from reportlab.pdfgen.canvas import Canvas
from reportlab.platypus import Paragraph, SimpleDocTemplate
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from pathlib import Path

class PDFGenerator:
  def __init__(self) -> None:
    for font_name, font_filename in [
      ('FiraSansRegular', 'FiraSans-Regular.ttf'),
      ('FiraSansBold', 'FiraSans-Bold.ttf'),
    ]:
      font_path = Path(__file__).parent.joinpath('fonts').joinpath(font_filename)
      pdfmetrics.registerFont(TTFont(font_name, font_path))

  def generate_pdf(self, filename: str, data: dict):
    width = 540
    height = 2600
    margin = 40
    styles = {
      'normal': ParagraphStyle(
        name='normal',
        fontName='FiraSansRegular',
        fontSize=10,
        leading=15
      ),
      'h2': ParagraphStyle(
        name='h2',
        fontName='FiraSansBold',
        fontSize=18,
        leading=22
      ),
      'h3': ParagraphStyle(
        name='h3',
        fontName='FiraSansBold',
        fontSize=13,
        leading=18
      )
    }
    content = []

    networks = []
    for item in data['networks']:
      networks.append(f"<link href=\"{item['url']}\">{item['label']}</link>")
    content.append(Paragraph('Links: ' + ', '.join(networks), styles['normal']))
    content.append(Paragraph('<br/><br/>', styles['normal']))

    content.append(Paragraph('Who Am I?', styles['h2']))
    content.append(Paragraph(data['about'].replace('\n', '<br/>'), styles['normal']))
    content.append(Paragraph('<br/><br/>', styles['normal']))

    content.append(Paragraph('Skills', styles['h2']))
    for item in data['skills']:
      label = item['label'] + '  '
      value = '  ' + item['years']
      label_width = pdfmetrics.stringWidth(label, styles['normal'].fontName, styles['normal'].fontSize)
      value_width = pdfmetrics.stringWidth(value, styles['normal'].fontName, styles['normal'].fontSize)
      sep = '-'
      sep_width = pdfmetrics.stringWidth(sep, styles['normal'].fontName, styles['normal'].fontSize)
      sep *= int((width - (margin * 2) - label_width - value_width) / sep_width) - 2
      content.append(Paragraph(f"{label}{sep}{value}", styles['normal']))
    content.append(Paragraph('<br/><br/>', styles['normal']))

    content.append(Paragraph('Languages', styles['h2']))
    for item in data['languages']:
      label = item['label'] + '  '
      value = '  ' + item['score']
      url = item.get('url', '')
      label_width = pdfmetrics.stringWidth(label, styles['normal'].fontName, styles['normal'].fontSize)
      value_width = pdfmetrics.stringWidth(value, styles['normal'].fontName, styles['normal'].fontSize)
      sep = '-'
      sep_width = pdfmetrics.stringWidth(sep, styles['normal'].fontName, styles['normal'].fontSize)
      sep *= int((width - (margin * 2) - label_width - value_width) / sep_width) - 2
      content.append(Paragraph(f"{label}{sep}<link href=\"{url}\">{value}</link>", styles['normal']))
    content.append(Paragraph('<br/><br/>', styles['normal']))

    content.append(Paragraph('Toolkit', styles['h2']))
    for item in data['toolkit']:
      label = item['category'] + '  '
      value = '  ' + ', '.join(item['tools'])
      url = item.get('url', '')
      label_width = pdfmetrics.stringWidth(label, styles['normal'].fontName, styles['normal'].fontSize)
      value_width = pdfmetrics.stringWidth(value, styles['normal'].fontName, styles['normal'].fontSize)
      sep = '-'
      sep_width = pdfmetrics.stringWidth(sep, styles['normal'].fontName, styles['normal'].fontSize)
      sep *= int((width - (margin * 2) - label_width - value_width) / sep_width) - 2
      content.append(Paragraph(f"{label}{sep}<link href=\"{url}\">{value}</link>", styles['normal']))
    content.append(Paragraph('<br/><br/>', styles['normal']))

    content.append(Paragraph('Education', styles['h2']))
    for item in data['studies']:
      content.append(Paragraph(item['name'], styles['h3']))
      content.append(Paragraph(item['school'], styles['normal']))
      content.append(Paragraph(f"{item['startDate']} - {item['endDate']} ({item['years']})", styles['normal']))
    content.append(Paragraph('<br/><br/>', styles['normal']))

    content.append(Paragraph(f"Experience ({data['experienceYears']})", styles['h2']))
    for item in data['experience']:
      company_url = item.get('companyUrl', '')
      content.append(Paragraph(item['name'], styles['h3']))
      content.append(Paragraph(f"<link href=\"{company_url}\">{item['company']}</link>", styles['normal']))
      content.append(Paragraph(f"{item['startDate']} - {item['endDate']} ({item['years']})", styles['normal']))
      content.append(Paragraph(item['description'], styles['normal']))
      content.append(Paragraph('Tech: ' + ', '.join(item['tech']), styles['normal']))
    content.append(Paragraph('<br/><br/>', styles['normal']))

    content.append(Paragraph('Projects', styles['h2']))
    for item in data['projects']:
      url = item.get('url', '')
      content.append(Paragraph(f"<link href=\"{url}\">{item['name']}</link>", styles['h3']))
      content.append(Paragraph(f"{item['startDate']} - {item['endDate']}", styles['normal']))
      content.append(Paragraph(item['description'], styles['normal']))

    doc = SimpleDocTemplate(filename, title="Geidel Guerra CV", pagesize=(width, height), leftMargin=margin, rightMargin=margin, topMargin=margin, bottomMargin=margin)
    doc.build(content)
