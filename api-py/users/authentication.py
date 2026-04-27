"""
Session auth that skips CSRF — matches the original Fastify backend's
behavior (no CSRF tokens; relies on SameSite cookies + CORS allowlist).

If the team wants real CSRF down the road, swap this back to DRF's
default SessionAuthentication and have the frontend fetch a token from
a /csrf endpoint before mutating requests.
"""

from rest_framework.authentication import SessionAuthentication


class CsrfExemptSessionAuthentication(SessionAuthentication):
    def enforce_csrf(self, request):
        return  # noqa: PIE790 — intentional no-op

    def authenticate_header(self, request):
        # Returning a header value makes DRF respond with 401 (instead of 403)
        # when authentication is missing — matches the TS Fastify backend's
        # 401 unauthorized contract.
        return "Session"
