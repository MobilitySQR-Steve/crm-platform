from django.urls import path

from .views import LoginView, LogoutView, MeView, RegisterView, UserListView

# Mounted at the project URLconf.
auth_urlpatterns = [
    path("auth/register", RegisterView.as_view(), name="auth-register"),
    path("auth/login", LoginView.as_view(), name="auth-login"),
    path("auth/logout", LogoutView.as_view(), name="auth-logout"),
    path("auth/me", MeView.as_view(), name="auth-me"),
]

users_urlpatterns = [
    path("users", UserListView.as_view(), name="users-list"),
]
