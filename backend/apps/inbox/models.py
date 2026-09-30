from __future__ import annotations

from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.core.models import TimeStampedModel


class InboxItem(TimeStampedModel):
    class Type(models.TextChoices):
        TASK = "task", "Task"
        REMINDER = "reminder", "Reminder"
        IDEA = "idea", "Idea"
        NOTE = "note", "Note"
        FOLLOW_UP = "follow_up", "Follow up"

    class Category(models.TextChoices):
        TODAY = "today", "Today"
        UPCOMING = "upcoming", "Upcoming"
        FOLLOW_UP = "follow_up", "Follow up"
        IDEA = "idea", "Idea"
        SOMEDAY = "someday", "Someday"

    class Priority(models.TextChoices):
        LOW = "low", "Low"
        NORMAL = "normal", "Normal"
        HIGH = "high", "High"

    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        COMPLETED = "completed", "Completed"
        ARCHIVED = "archived", "Archived"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="inbox_items")
    raw_content = models.TextField()
    title = models.CharField(max_length=220)
    description = models.TextField(blank=True)
    type = models.CharField(max_length=20, choices=Type.choices, default=Type.NOTE)
    category = models.CharField(max_length=20, choices=Category.choices, default=Category.SOMEDAY)
    priority = models.CharField(max_length=20, choices=Priority.choices, default=Priority.NORMAL)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    due_date = models.DateField(null=True, blank=True)
    due_time = models.TimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    archived_at = models.DateTimeField(null=True, blank=True)
    tags = models.ManyToManyField("inbox.Tag", through="inbox.InboxItemTag", related_name="items", blank=True)
    person = models.ForeignKey(
        "inbox.Person",
        on_delete=models.SET_NULL,
        related_name="items",
        null=True,
        blank=True,
    )

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "status", "category"]),
            models.Index(fields=["user", "type"]),
            models.Index(fields=["user", "due_date"]),
            models.Index(fields=["user", "created_at"]),
        ]

    def __str__(self) -> str:
        return self.title

    @property
    def is_overdue(self) -> bool:
        return bool(self.due_date and self.due_date < timezone.localdate() and self.status == self.Status.ACTIVE)


class Tag(TimeStampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="tags")
    name = models.CharField(max_length=64)

    class Meta:
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(fields=["user", "name"], name="unique_tag_per_user"),
        ]
        indexes = [models.Index(fields=["user", "name"])]

    def __str__(self) -> str:
        return self.name


class InboxItemTag(models.Model):
    inbox_item = models.ForeignKey(InboxItem, on_delete=models.CASCADE)
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["inbox_item", "tag"], name="unique_tag_for_item"),
        ]


class Person(TimeStampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="people")
    name = models.CharField(max_length=160)
    relationship = models.CharField(max_length=120, blank=True)
    notes = models.TextField(blank=True)
    last_contacted = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(fields=["user", "name"], name="unique_person_per_user"),
        ]
        indexes = [models.Index(fields=["user", "name"])]

    def __str__(self) -> str:
        return self.name


class Reminder(TimeStampedModel):
    class Status(models.TextChoices):
        SCHEDULED = "scheduled", "Scheduled"
        SENT = "sent", "Sent"
        CANCELLED = "cancelled", "Cancelled"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reminders")
    inbox_item = models.ForeignKey(InboxItem, on_delete=models.CASCADE, related_name="reminders")
    remind_at = models.DateTimeField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SCHEDULED)

    class Meta:
        ordering = ["remind_at"]
        indexes = [
            models.Index(fields=["user", "status", "remind_at"]),
            models.Index(fields=["inbox_item", "status"]),
        ]


class ActivityLog(models.Model):
    class Action(models.TextChoices):
        CREATED = "created", "Created"
        EDITED = "edited", "Edited"
        COMPLETED = "completed", "Completed"
        ARCHIVED = "archived", "Archived"
        RESTORED = "restored", "Restored"
        CATEGORIZED = "categorized", "Categorized"
        SCHEDULED = "scheduled", "Scheduled"
        DELETED = "deleted", "Deleted"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="activity_logs")
    inbox_item = models.ForeignKey(InboxItem, on_delete=models.SET_NULL, null=True, blank=True, related_name="activity_logs")
    action = models.CharField(max_length=32, choices=Action.choices)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "action", "created_at"]),
            models.Index(fields=["inbox_item", "created_at"]),
        ]

