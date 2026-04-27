"""Server-side enum display labels — used in user messages we send to
Claude (so the model sees "100–250" instead of "B_100_250")."""

from crm.models import CrossBorderMovesBand, EmployeeBand, TriggerEvent


EMPLOYEE_BAND_LABELS = {
    EmployeeBand.UNKNOWN: "unknown",
    EmployeeBand.LT_100: "< 100",
    EmployeeBand.B_100_250: "100–250",
    EmployeeBand.B_250_700: "250–700",
    EmployeeBand.B_700_1000: "700–1,000",
    EmployeeBand.GT_1000: "1,000+",
}

MOVES_BAND_LABELS = {
    CrossBorderMovesBand.UNKNOWN: "unknown",
    CrossBorderMovesBand.LT_10: "< 10 / yr",
    CrossBorderMovesBand.B_10_50: "10–50 / yr",
    CrossBorderMovesBand.B_50_250: "50–250 / yr",
    CrossBorderMovesBand.B_250_500: "250–500 / yr",
    CrossBorderMovesBand.GT_500: "500+ / yr",
}

TRIGGER_EVENT_LABELS = {
    TriggerEvent.UNKNOWN: "unknown",
    TriggerEvent.NEW_MARKET: "New market opened",
    TriggerEvent.INTL_HIRING: "International hiring",
    TriggerEvent.AUDIT_FINDING: "Audit / compliance finding",
    TriggerEvent.OUTGREW_TOOL: "Outgrew current tool",
    TriggerEvent.RFP: "RFP",
    TriggerEvent.INBOUND: "Inbound",
    TriggerEvent.OTHER: "Other",
}
