"""Root URL config."""

from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from django.views.decorators.csrf import csrf_exempt

from users.urls import auth_urlpatterns, users_urlpatterns


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
    *auth_urlpatterns,
    *users_urlpatterns,
    path("", include("crm.urls")),
    # Commit 3 will add: /enrichment, /outreach
]
