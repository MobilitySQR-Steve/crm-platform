from django.urls import path

from .views import DraftOutreachView, EnrichAccountView, SourceAccountsView

urlpatterns = [
    # Enrichment
    path("enrichment/account/<int:pk>", EnrichAccountView.as_view(), name="enrichment-account"),
    path("enrichment/source", SourceAccountsView.as_view(), name="enrichment-source"),
    # Outreach
    path("outreach/account/<int:pk>/draft", DraftOutreachView.as_view(), name="outreach-draft"),
]
