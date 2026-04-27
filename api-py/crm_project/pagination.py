"""
Offset/limit pagination that returns the response shape the TS Fastify
backend used: { items, total, limit, offset }. The frontend's
useAccounts/useOpportunities hooks expect exactly these fields.
"""

from rest_framework.pagination import LimitOffsetPagination
from rest_framework.response import Response


class OffsetLimitPagination(LimitOffsetPagination):
    default_limit = 50
    max_limit = 200
    limit_query_param = "limit"
    offset_query_param = "offset"

    def get_paginated_response(self, data):
        return Response(
            {
                "items": data,
                "total": self.count,
                "limit": self.limit,
                "offset": self.offset,
            }
        )
