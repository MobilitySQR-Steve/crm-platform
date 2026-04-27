"""
Root URL config — endpoints are added in Commit 2.
"""

from django.contrib import admin
from django.http import JsonResponse
from django.urls import path
from django.views.decorators.csrf import csrf_exempt


@csrf_exempt
def health(_request):
    return JsonResponse({"status": "ok"})


@csrf_exempt
def health_db(_request):
    from django.db import connection

    with connection.cursor() as cursor:
        cursor.execute("SELECT 1")
        cursor.fetchone()
    return JsonResponse({"status": "ok", "db": "reachable"})


urlpatterns = [
    path("health", health),
    path("health/db", health_db),
    path("admin/", admin.site.urls),
    # Commit 2 will add: /auth, /accounts, /opportunities, /contacts, /activities, /users
    # Commit 3 will add: /enrichment, /outreach
]
