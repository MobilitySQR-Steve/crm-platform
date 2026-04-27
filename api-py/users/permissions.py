"""
Custom permission classes — distinct from Django's built-in `is_staff`
permission since this CRM uses an app-level `role` field (ADMIN/USER)
to gate sensitive operations.
"""

from rest_framework.permissions import BasePermission

from .models import UserRole


class IsAdminRole(BasePermission):
    """Permission that requires the authenticated user's role == ADMIN."""

    message = "forbidden"

    def has_permission(self, request, view) -> bool:
        user = request.user
        return bool(user and user.is_authenticated and getattr(user, "role", None) == UserRole.ADMIN)
