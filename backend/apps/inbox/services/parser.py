from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from django.utils import timezone


@dataclass(frozen=True)
class ParsedThought:
    title: str
    description: str
    type: str
    category: str
    priority: str
    due_date: date | None = None
    due_time: time | None = None
    tags: list[str] = field(default_factory=list)
    person_name: str | None = None


class ThoughtParser:
    """Small deterministic parser that can be replaced by an AI classifier later."""

    IDEA_WORDS = ("idea", "startup", "maybe", "could build", "what if", "learn", "explore")
    FOLLOW_UP_WORDS = ("ask", "call", "text", "email", "message", "follow up", "follow-up", "check with", "talk to")
    REMINDER_WORDS = (
        "pay",
        "bill",
        "remind",
        "deadline",
        "due",
        "tonight",
        "tomorrow",
        "this week",
        "next week",
        "friday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "saturday",
        "sunday",
    )
    TASK_WORDS = ("buy", "finish", "book", "submit", "send", "clean", "review", "fix", "prepare", "pick up")
    HIGH_PRIORITY_WORDS = ("urgent", "asap", "important", "deadline", "must", "today", "tonight", "bill")
    LOW_PRIORITY_WORDS = ("maybe", "someday", "later", "eventually", "explore")
    WEEKDAYS = {
        "monday": 0,
        "tuesday": 1,
        "wednesday": 2,
        "thursday": 3,
        "friday": 4,
        "saturday": 5,
        "sunday": 6,
    }

    def parse(self, raw_content: str, user_timezone: str = "UTC") -> ParsedThought:
        text = raw_content.strip()
        compact = re.sub(r"\s+", " ", text)
        lowered = compact.lower()
        today = self._local_today(user_timezone)
        tags = self._extract_tags(compact)
        due_date, due_time = self._extract_due(lowered, today)
        thought_type = self._detect_type(lowered, due_date)
        category = self._detect_category(lowered, thought_type, due_date, today)
        priority = self._detect_priority(lowered, due_date, today)
        title = self._make_title(compact)
        description = compact if len(compact) > len(title) else ""
        person_name = self._extract_person_name(compact, thought_type)

        return ParsedThought(
            title=title,
            description=description,
            type=thought_type,
            category=category,
            priority=priority,
            due_date=due_date,
            due_time=due_time,
            tags=tags,
            person_name=person_name,
        )

    def _detect_type(self, lowered: str, due_date: date | None) -> str:
        if any(word in lowered for word in self.IDEA_WORDS):
            return "idea"
        if any(word in lowered for word in self.FOLLOW_UP_WORDS):
            return "follow_up"
        if due_date or any(word in lowered for word in self.REMINDER_WORDS):
            return "reminder"
        if any(word in lowered for word in self.TASK_WORDS):
            return "task"
        return "note"

    def _detect_category(self, lowered: str, thought_type: str, due_date: date | None, today: date) -> str:
        if thought_type == "idea":
            return "idea"
        if thought_type == "follow_up":
            return "follow_up"
        if due_date == today or "tonight" in lowered:
            return "today"
        if due_date and due_date > today:
            return "upcoming"
        if any(word in lowered for word in ("someday", "later", "eventually", "maybe learn", "watch that")):
            return "someday"
        return "today"

    def _detect_priority(self, lowered: str, due_date: date | None, today: date) -> str:
        if any(word in lowered for word in self.HIGH_PRIORITY_WORDS):
            return "high"
        if any(word in lowered for word in self.LOW_PRIORITY_WORDS):
            return "low"
        if due_date and due_date <= today:
            return "high"
        return "normal"

    def _extract_due(self, lowered: str, today: date) -> tuple[date | None, time | None]:
        explicit_time = self._extract_time(lowered)
        if "tonight" in lowered:
            return today, time(20, 0)
        if "today" in lowered:
            return today, explicit_time
        if "tomorrow" in lowered:
            return today + timedelta(days=1), explicit_time
        if "this week" in lowered:
            days_until_week_end = max(1, 6 - today.weekday())
            return today + timedelta(days=days_until_week_end), explicit_time
        if "next week" in lowered:
            days_until_next_monday = 7 - today.weekday()
            return today + timedelta(days=days_until_next_monday), explicit_time

        for name, weekday in self.WEEKDAYS.items():
            if re.search(rf"\b{name}\b", lowered):
                days_ahead = (weekday - today.weekday()) % 7
                days_ahead = 7 if days_ahead == 0 else days_ahead
                return today + timedelta(days=days_ahead), explicit_time

        month_day = re.search(r"\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+(\d{1,2})\b", lowered)
        if month_day:
            month_lookup = {
                "jan": 1,
                "feb": 2,
                "mar": 3,
                "apr": 4,
                "may": 5,
                "jun": 6,
                "jul": 7,
                "aug": 8,
                "sep": 9,
                "sept": 9,
                "oct": 10,
                "nov": 11,
                "dec": 12,
            }
            month = month_lookup[month_day.group(1)]
            day = int(month_day.group(2))
            year = today.year
            candidate = date(year, month, day)
            if candidate < today:
                candidate = date(year + 1, month, day)
            return candidate, explicit_time

        iso_date = re.search(r"\b(20\d{2})-(\d{1,2})-(\d{1,2})\b", lowered)
        if iso_date:
            return datetime.strptime(iso_date.group(0), "%Y-%m-%d").date(), explicit_time

        return None, None

    def _extract_time(self, lowered: str) -> time | None:
        match = re.search(r"\b(?:at\s*)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b", lowered)
        if not match:
            return None
        hour = int(match.group(1))
        minute = int(match.group(2) or 0)
        period = match.group(3)
        if hour > 12 or minute > 59:
            return None
        if period == "pm" and hour != 12:
            hour += 12
        if period == "am" and hour == 12:
            hour = 0
        return time(hour, minute)

    def _local_today(self, user_timezone: str) -> date:
        try:
            tzinfo = ZoneInfo(user_timezone)
        except ZoneInfoNotFoundError:
            return timezone.localdate()
        return timezone.localtime(timezone.now(), tzinfo).date()

    def _extract_tags(self, text: str) -> list[str]:
        tags = [tag.lower() for tag in re.findall(r"#([A-Za-z0-9_-]{2,40})", text)]
        return sorted(set(tags))

    def _extract_person_name(self, text: str, thought_type: str) -> str | None:
        if thought_type != "follow_up":
            return None
        match = re.search(
            r"\b(?:ask|call|text|email|message|follow up with|follow-up with|check with|talk to)\s+([A-Z][a-zA-Z]+|mom|dad|sir|professor|rahul)\b",
            text,
            flags=re.IGNORECASE,
        )
        if not match:
            return None
        name = match.group(1).strip()
        return name[:1].upper() + name[1:]

    def _make_title(self, text: str) -> str:
        title = re.sub(r"\s+", " ", text).strip()
        title = re.sub(r"#([A-Za-z0-9_-]{2,40})", "", title).strip()
        if len(title) <= 120:
            return title
        trimmed = title[:117].rstrip()
        return f"{trimmed}..."

