class EmailFilter:
    CONFIRMATION_SUBJECTS = [
        "application received",
        "application submitted",
        "thank you for applying",
        "thanks for applying",
        "we received your application",
        "your application has been",
        "application confirmation",
        "successfully applied",
        "you applied to",
        "application for",
    ]

    CONFIRMATION_SENDERS = [
        "greenhouse.io",
        "lever.co",
        "workday.com",
        "myworkdayjobs.com",
        "icims.com",
        "taleo.net",
        "smartrecruiters.com",
        "jobvite.com",
        "applytojob.com",
        "jobs.lever.co",
        "no-reply@linkedin.com",
        "jobalerts-noreply@linkedin.com",
        "amazonjobs",
        "amazon.jobs",
    ]

    def is_confirmation_email(self, subject: str, sender: str) -> bool:
        subject_lower = subject.lower()
        sender_lower = sender.lower()
        if any(kw in subject_lower for kw in self.CONFIRMATION_SUBJECTS):
            return True
        if any(domain in sender_lower for domain in self.CONFIRMATION_SENDERS):
            return True
        return False

    def filter_messages(self, messages: list[dict]) -> list[dict]:
        return [
            msg for msg in messages
            if self.is_confirmation_email(
                msg.get("subject", ""), msg.get("sender", "")
            )
        ]
