from rest_framework import serializers

from .models import User, UserRole


class UserPublicSerializer(serializers.ModelSerializer):
    """Safe-to-expose fields for any authenticated user."""

    class Meta:
        model = User
        fields = ("id", "email", "first_name", "last_name", "role")
        read_only_fields = fields


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(min_length=12, max_length=128, write_only=True)
    first_name = serializers.CharField(min_length=1, max_length=100)
    last_name = serializers.CharField(min_length=1, max_length=100)
    role = serializers.ChoiceField(choices=UserRole.choices, required=False)


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(min_length=1, write_only=True)
