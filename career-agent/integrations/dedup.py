import difflib
import string

from parser.models import ParsedApplication


class Deduplicator:
    COMMON_SUFFIXES = {
        "inc", "llc", "ltd", "corp", "group",
        "technologies", "technology", "solutions",
        "com",  # strips domain TLD from names like "Amazon.com"
    }

    def normalize(self, text: str) -> str:
        text = text.lower()
        # Replace punctuation with spaces so "amazon.com" → "amazon com"
        text = text.translate(
            str.maketrans(string.punctuation, " " * len(string.punctuation))
        )
        # Split, drop common corporate/domain suffixes, rejoin
        words = [w for w in text.split() if w not in self.COMMON_SUFFIXES]
        return " ".join(words).strip()

    def similarity_ratio(self, a: str, b: str) -> float:
        return difflib.SequenceMatcher(None, a, b).ratio()

    def is_duplicate(
        self,
        application: ParsedApplication,
        existing_applications: list[dict],
    ) -> bool:
        norm_company = self.normalize(application.company)
        norm_role = self.normalize(application.role)
        for app in existing_applications:
            norm_existing_company = self.normalize(app.get("company", ""))
            norm_existing_role = self.normalize(app.get("role", ""))
            company_match = (
                self.similarity_ratio(norm_company, norm_existing_company) >= 0.85
            )
            role_match = (
                self.similarity_ratio(norm_role, norm_existing_role) >= 0.85
            )
            if company_match and role_match:
                return True
        return False
