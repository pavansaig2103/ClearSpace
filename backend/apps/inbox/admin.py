from django.contrib import admin

from apps.inbox.models import ActivityLog, InboxItem, Person, Reminder, Tag


@admin.register(InboxItem)
class InboxItemAdmin(admin.ModelAdmin):
    list_display = ["title", "user", "type", "category", "priority", "status", "due_date", "created_at"]
    list_filter = ["type", "category", "priority", "status"]
    search_fields = ["title", "raw_content", "user__email"]
    autocomplete_fields = ["user", "person"]


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ["name", "user", "created_at"]
    search_fields = ["name", "user__email"]


@admin.register(Person)
class PersonAdmin(admin.ModelAdmin):
    list_display = ["name", "user", "relationship", "last_contacted"]
    search_fields = ["name", "relationship", "user__email"]


@admin.register(Reminder)
class ReminderAdmin(admin.ModelAdmin):
    list_display = ["inbox_item", "user", "remind_at", "status"]
    list_filter = ["status"]


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ["action", "user", "inbox_item", "created_at"]
    list_filter = ["action"]

