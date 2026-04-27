from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AccountViewSet, ActivityViewSet, ContactViewSet, OpportunityViewSet

router = DefaultRouter(trailing_slash=False)
router.register(r"accounts", AccountViewSet, basename="account")
router.register(r"opportunities", OpportunityViewSet, basename="opportunity")
router.register(r"contacts", ContactViewSet, basename="contact")
router.register(r"activities", ActivityViewSet, basename="activity")

urlpatterns = [path("", include(router.urls))]
