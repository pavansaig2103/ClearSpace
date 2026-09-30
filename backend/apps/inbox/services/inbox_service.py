from __future__ import annotations

from datetime import datetime, time

from django.db import transaction
from django.utils import timezone

from apps.inbox.models import ActivityLog, InboxItem, Person, Reminder, Tag
from apps.inbox.services.parser import ThoughtParser


class InboxService:
    def __init__(self, parser: ThoughtParser | None = None):
        self.parser = parser or ThoughtParser()

    @transaction.atomic
    def capture(self, *, user, raw_content: str) -> InboxItem:
        raw = raw_content.strip()
        if not raw:
            raise ValueError("Raw content cannot be empty.")

        parsed = self.parser.parse(raw, getattr(user, "timezone", "UTC"))
        person = None
        if parsed.person_name:
            person, _ = Person.objects.get_or_create(user=user, name=parsed.person_name)

        item = InboxItem.objects.create(
            user=user,
            raw_content=raw,
            title=parsed.title,
            description=parsed.description,
            type=parsed.type,
            category=parsed.category,
            priority=parsed.priority,
            due_date=parsed.due_date,
            due_time=parsed.due_time,
            person=person,
        )
        self._set_tags(item, parsed.tags)
        if parsed.due_date:
            self._sync_due_reminder(item)
        self._log(user=user, item=item, action=ActivityLog.Action.CREATED, metadata={"parser": "deterministic"})
        return item

    @transaction.atomic
    def update(self, *, item: InboxItem, data: dict) -> InboxItem:
        tag_names = data.pop("tag_names", None)
        for field, value in data.items():
            setattr(item, field, value)
        item.save()
        if tag_names is not None:
            self._set_tags(item, tag_names)
        if "due_date" in data or "due_time" in data:
            self._sync_due_reminder(item)
        self._log(user=item.user, item=item, action=ActivityLog.Action.EDITED)
        return item

    @transaction.atomic
    def complete(self, *, item: InboxItem) -> InboxItem:
        item.status = InboxItem.Status.COMPLETED
        item.completed_at = timezone.now()
        item.save(update_fields=["status", "completed_at", "updated_at"])
        item.reminders.filter(status=Reminder.Status.SCHEDULED).update(status=Reminder.Status.CANCELLED)
        self._log(user=item.user, item=item, action=ActivityLog.Action.COMPLETED)
        return item

    @transaction.atomic
    def archive(self, *, item: InboxItem) -> InboxItem:
        item.status = InboxItem.Status.ARCHIVED
        item.archived_at = timezone.now()
        item.save(update_fields=["status", "archived_at", "updated_at"])
        self._log(user=item.user, item=item, action=ActivityLog.Action.ARCHIVED)
        return item

    @transaction.atomic
    def restore(self, *, item: InboxItem) -> InboxItem:
        item.status = InboxItem.Status.ACTIVE
        item.archived_at = None
        item.save(update_fields=["status", "archived_at", "updated_at"])
        self._log(user=item.user, item=item, action=ActivityLog.Action.RESTORED)
        return item

    @transaction.atomic
    def schedule(self, *, item: InboxItem, due_date, due_time: time | None = None) -> InboxItem:
        item.due_date = due_date
        item.due_time = due_time
        item.category = InboxItem.Category.TODAY if due_date == timezone.localdate() else InboxItem.Category.UPCOMING
        item.save(update_fields=["due_date", "due_time", "category", "updated_at"])
        self._sync_due_reminder(item)
        self._log(user=item.user, item=item, action=ActivityLog.Action.SCHEDULED)
        return item

    @transaction.atomic
    def move(self, *, item: InboxItem, category: str) -> InboxItem:
        item.category = category
        item.save(update_fields=["category", "updated_at"])
        self._log(user=item.user, item=item, action=ActivityLog.Action.CATEGORIZED, metadata={"category": category})
        return item

    def _set_tags(self, item: InboxItem, tag_names: list[str]) -> None:
        normalized = sorted({name.strip().lower() for name in tag_names if name and name.strip()})
        tags = [Tag.objects.get_or_create(user=item.user, name=name)[0] for name in normalized]
        item.tags.set(tags)

    def _sync_due_reminder(self, item: InboxItem) -> None:
        if not item.due_date:
            item.reminders.filter(status=Reminder.Status.SCHEDULED).update(status=Reminder.Status.CANCELLED)
            return
        due_time = item.due_time or time(9, 0)
        remind_at = timezone.make_aware(datetime.combine(item.due_date, due_time))
        Reminder.objects.update_or_create(
            user=item.user,
            inbox_item=item,
            status=Reminder.Status.SCHEDULED,
            defaults={"remind_at": remind_at},
        )

    def _log(self, *, user, item: InboxItem | None, action: str, metadata: dict | None = None) -> None:
        ActivityLog.objects.create(user=user, inbox_item=item, action=action, metadata=metadata or {})

