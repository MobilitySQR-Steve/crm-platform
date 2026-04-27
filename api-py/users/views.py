"""
Auth + user-listing endpoints — port of api/src/routes/auth.ts and
api/src/routes/users.ts. Response shapes match the TS originals so the
React frontend works unchanged.
"""

from django.contrib.auth import authenticate, login as django_login, logout as django_logout
from django.db import IntegrityError
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from .models import User, UserRole
from .serializers import LoginSerializer, RegisterSerializer, UserPublicSerializer


# ── Throttles ────────────────────────────────────────────────────


class LoginThrottle(AnonRateThrottle):
    scope = "login"


class RegisterThrottle(AnonRateThrottle):
    scope = "register"


# ── Views ────────────────────────────────────────────────────────


class RegisterView(APIView):
    """
    POST /auth/register

    First user (when DB is empty) bootstraps as ADMIN with no auth.
    Every subsequent registration requires an authenticated ADMIN.
    """

    permission_classes = [AllowAny]
    throttle_classes = [RegisterThrottle]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"error": "invalid_body", "details": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )
        data = serializer.validated_data

        existing_count = User.objects.count()
        if existing_count == 0:
            role = UserRole.ADMIN
        else:
            user = request.user
            if not (user and user.is_authenticated):
                return Response({"error": "unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)
            if getattr(user, "role", None) != UserRole.ADMIN:
                return Response({"error": "forbidden"}, status=status.HTTP_403_FORBIDDEN)
            role = data.get("role") or UserRole.USER

        try:
            user = User.objects.create_user(
                email=data["email"],
                password=data["password"],
                first_name=data["first_name"],
                last_name=data["last_name"],
                role=role,
            )
        except IntegrityError:
            return Response({"error": "email_taken"}, status=status.HTTP_409_CONFLICT)

        return Response(
            {"user": UserPublicSerializer(user).data},
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [LoginThrottle]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"error": "invalid_body"}, status=status.HTTP_400_BAD_REQUEST)
        data = serializer.validated_data

        # Django's authenticate uses USERNAME_FIELD ("email" on our custom User).
        user = authenticate(request, username=data["email"], password=data["password"])
        if user is None or not user.is_active:
            return Response({"error": "invalid_credentials"}, status=status.HTTP_401_UNAUTHORIZED)

        django_login(request, user)
        return Response({"user": UserPublicSerializer(user).data})


class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        django_logout(request)
        return Response({"ok": True})


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"user": UserPublicSerializer(request.user).data})


class UserListView(APIView):
    """GET /users — minimal user list for owner-picker dropdowns."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        users = User.objects.all().order_by("first_name", "last_name")
        return Response({"items": UserPublicSerializer(users, many=True).data})
