"""
JSON Schemas for the custom Anthropic tools (submit_enrichment,
submit_candidates, submit_draft). Hand-written — verbatim ports of
the TS api/src/lib/{enrichment,outreach}/schema.ts.
"""

from crm.models import (
    CrossBorderMovesBand,
    EmployeeBand,
    TriggerEvent,
)


_EMPLOYEE_BAND_KEYS = [v for v in EmployeeBand.values]
_MOVES_BAND_KEYS = [v for v in CrossBorderMovesBand.values]
_TRIGGER_EVENT_KEYS = [v for v in TriggerEvent.values]


ENRICHMENT_TOOL_SCHEMA = {
    "type": "object",
    "properties": {
        "domain": {"type": ["string", "null"], "description": 'Normalized domain like "notion.so" — no protocol, no path'},
        "website": {"type": ["string", "null"], "description": "Full website URL with https://"},
        "linkedinUrl": {"type": ["string", "null"], "description": "Company LinkedIn page URL"},
        "hqCountry": {"type": ["string", "null"], "description": 'HQ country as ISO 3166-1 alpha-2 (e.g. "US", "GB", "DE")'},
        "hqCity": {"type": ["string", "null"], "description": "HQ city name"},
        "industry": {"type": ["string", "null"], "description": 'Industry / sector (e.g. "Software", "FinTech", "Manufacturing")'},
        "employeeBand": {
            "type": "string",
            "enum": _EMPLOYEE_BAND_KEYS,
            "description": "Employee count band. Use UNKNOWN if you cannot find evidence.",
        },
        "crossBorderMovesBand": {
            "type": "string",
            "enum": _MOVES_BAND_KEYS,
            "description": "Cross-border employee moves per year. UNKNOWN if no evidence — DO NOT GUESS.",
        },
        "countriesWithEmployees": {
            "type": "array",
            "items": {"type": "string", "description": "ISO 3166-1 alpha-2 country code"},
            "description": "List of ISO country codes where the company has employees or offices.",
        },
        "currentToolingTags": {
            "type": "array",
            "items": {"type": "string"},
            "description": (
                'Mobility / HR / payroll tooling they reportedly use. Examples: "Spreadsheets", '
                '"Topia", "Equus", "Deel", "Vialto", "Sirva". Empty if unknown.'
            ),
        },
        "triggerEvent": {
            "type": "string",
            "enum": _TRIGGER_EVENT_KEYS,
            "description": "A recent buying signal. Use UNKNOWN if none.",
        },
        "triggerNote": {
            "type": ["string", "null"],
            "description": "One-sentence description of the trigger with date/source if known.",
        },
        "confidence": {
            "type": "number",
            "minimum": 0,
            "maximum": 1,
            "description": "Overall confidence in this enrichment (0=guessed, 1=fully sourced).",
        },
        "rationale": {
            "type": "string",
            "description": "Brief explanation of how you arrived at the answer — what sources you weighed.",
        },
        "citations": {
            "type": "array",
            "items": {"type": "string"},
            "description": "URLs you used as evidence.",
        },
    },
    "required": ["confidence", "rationale", "citations"],
}


SOURCING_TOOL_SCHEMA = {
    "type": "object",
    "properties": {
        "candidates": {
            "type": "array",
            "description": "New ICP-matching companies to add to the pipeline.",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "domain": {"type": ["string", "null"], "description": 'Normalized domain like "acme.com"'},
                    "website": {"type": ["string", "null"]},
                    "hqCountry": {"type": ["string", "null"], "description": "ISO 3166-1 alpha-2"},
                    "industry": {"type": ["string", "null"]},
                    "employeeBand": {"type": "string", "enum": _EMPLOYEE_BAND_KEYS},
                    "triggerEvent": {"type": "string", "enum": _TRIGGER_EVENT_KEYS},
                    "rationale": {
                        "type": "string",
                        "description": "One sentence: why this is a good MobilitySQR fit + the buying trigger.",
                    },
                },
                "required": ["name", "rationale"],
            },
        }
    },
    "required": ["candidates"],
}


DRAFT_TOOL_SCHEMA = {
    "type": "object",
    "properties": {
        "subject": {
            "type": "string",
            "description": "Email subject line. Under 60 characters. Not clickbait, not generic.",
        },
        "body": {
            "type": "string",
            "description": (
                "Full email body, including greeting and sign-off. 3 short paragraphs, "
                "under 150 words total. Plain text — no markdown, no HTML."
            ),
        },
        "callToAction": {
            "type": "string",
            "description": (
                "The specific ask in the closing paragraph (e.g. \"15-min call next "
                "Tuesday to walk through your H-1B renewal stack\"). Used for tracking what we asked for."
            ),
        },
        "rationale": {
            "type": "string",
            "description": (
                "1-2 sentence explanation of WHY you chose this hook angle. Helps the "
                "seller adjust if it lands wrong."
            ),
        },
    },
    "required": ["subject", "body", "callToAction", "rationale"],
}
