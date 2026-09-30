from django.contrib import admin

from apps.memories.models import Memory


@admin.register(Memory)
class MemoryAdmin(admin.ModelAdmin):
    list_display = ["date", "user", "created_at"]
    search_fields = ["content", "user__email"]

