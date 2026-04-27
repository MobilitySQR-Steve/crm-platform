"""
ASGI entry point — used if the app is ever served via uvicorn / Daphne
for async/websocket support. Currently the app is sync-only via WSGI.
"""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "crm_project.settings")

application = get_asgi_application()
