import os
import uvicorn
from dotenv import load_dotenv
load_dotenv()

if __name__ == '__main__':
  uvicorn.run(
    'web.app:app',
    host=os.getenv('APP_HOST', '127.0.0.1'),
    port=int(os.getenv('APP_PORT', 8000)),
    reload=os.getenv('APP_RELOAD', '').lower() == 'true',
    reload_includes=['.env', '*.html'],
    server_header=False
  )