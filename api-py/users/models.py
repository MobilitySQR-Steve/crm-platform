"""
User model — matches the Prisma schema's User table conceptually.

Differences from the TS backend:
- Uses Django's PermissionsMixin (gives `is_superuser`, groups,
  user_permissions) so Django Admin works out of the box.
- Adds `is_staff` (Django Admin gate). The app-level `role` field
  (ADMIN/USER) is what controls business-logic permissions in views.
- Drops the camelCase column names — fresh schema lives in its own
  Postgres tables alongside the existing TS-era ones (or in a fresh
  Neon branch). Tech team can prune the TS tables when the Django
  backend is canonical.
"""

from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone

from .managers import UserManager


class UserRole(models.TextChoices):
    ADMIN = "ADMIN", "Admin"
    USER = "USER", "User"


class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    role = models.CharField(max_length=8, choices=UserRole.choices, default=UserRole.USER)

    # Django admin / permissions
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    class Meta:
        db_table = "users_user"
        ordering = ["first_name", "last_name"]

    def __str__(self) -> str:
        return f"{self.full_name} <{self.email}>"

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()

    def get_full_name(self) -> str:
        return self.full_name

    def get_short_name(self) -> str:
        return self.first_name

    @property
    def is_admin_role(self) -> bool:
        """Business-level admin (ADMIN role). Distinct from is_superuser."""
        return self.role == UserRole.ADMIN
