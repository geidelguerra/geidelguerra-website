import json
import pathlib
from datetime import datetime

def parse_date(date_str: str) -> datetime:
  if date_str.lower() == 'present':
    return datetime.now()

  parts = date_str.split('-')
  while len(parts) < 3:
    parts.append('01')

  return datetime.fromisoformat('-'.join(parts))

def date_diff(start_date: datetime, end_date: datetime) -> str:
  years = round((end_date - start_date).days / 360, 1)

  if years < 1:
    return 'less than a year'
  if years < 2:
    return f'{years} year'

  return f'{round(years)} years'

def get_data() -> dict:
  data = {}
  current_date = datetime.now()

  with open(pathlib.Path(__file__).parent.joinpath('data.json'), 'r') as f:
    data = json.load(f)

  data['experienceYears'] = date_diff(parse_date(data['startDate']), current_date)

  for item in data['skills']:
    start_date = parse_date(item['startDate'])
    end_date = current_date
    item['years'] = date_diff(start_date, current_date)

  for item in data['studies']:
    start_date = parse_date(item['startDate'])
    end_date = parse_date(item['endDate'])
    item['years'] = date_diff(start_date, end_date)

  for item in data['experience']:
    start_date = parse_date(item['startDate'])
    end_date = parse_date(item['endDate'])
    item['years'] = date_diff(start_date, end_date)

  return data
