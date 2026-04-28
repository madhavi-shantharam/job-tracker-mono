from dataclasses import dataclass, field
from typing import Optional


@dataclass
class ParsedApplication:
    # Required
    company: str
    role: str
    confidence: float

    # Optional — present in some emails, not others
    location: Optional[str]
    date_applied: Optional[str]
    application_url: Optional[str]
    ats_name: Optional[str]

    # Passed in by the caller, not extracted by Claude
    email_id: str
    email_subject: str
    raw_snippet: str

    # Computed in __post_init__
    is_confident: bool = field(default=False, init=False)
    needs_review: bool = field(default=False, init=False)

    def __post_init__(self):
        self.is_confident = self.confidence >= 0.75
        self.needs_review = self.confidence < 0.75
