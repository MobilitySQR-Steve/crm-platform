"""
Uniform error envelope so the React frontend can keep its existing
ApiError handling: { "error": "<code>", "message"?: "...", "details"?: {...} }
"""

from rest_framework.exceptions import APIException
from rest_framework.views import exception_handler as drf_default_handler


def handler(exc, context):
    """Wrap DRF's default exception handler to match the TS API's shape."""
    response = drf_default_handler(exc, context)
    if response is None:
        return response

    # DRF's default body is the bare detail dict; reshape to {error, ...}.
    detail = response.data
    if isinstance(detail, dict) and "error" in detail:
        # Already in our shape (the view raised a custom error)
        return response
    if isinstance(detail, dict) and "detail" in detail:
        response.data = {
            "error": _code_for_exception(exc, response.status_code),
            "message": str(detail["detail"]),
        }
    elif isinstance(detail, dict):
        # Validation error — DRF returns a dict of field -> [errors]
        response.data = {"error": "invalid_body", "details": detail}
    elif isinstance(detail, list):
        response.data = {"error": "invalid_body", "message": "; ".join(str(x) for x in detail)}
    else:
        response.data = {"error": "request_failed", "message": str(detail)}
    return response


def _code_for_exception(exc, status: int) -> str:
    if isinstance(exc, APIException) and getattr(exc, "default_code", None):
        return str(exc.default_code)
    if status == 401:
        return "unauthorized"
    if status == 403:
        return "forbidden"
    if status == 404:
        return "not_found"
    if status == 429:
        return "rate_limited"
    if status >= 500:
        return "internal_server_error"
    return "request_failed"
