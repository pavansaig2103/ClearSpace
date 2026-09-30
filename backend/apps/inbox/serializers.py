from __future__ import annotations

from django.utils import timezone
from rest_framework import serializers

from apps.inbox.models import InboxItem, Person, Reminder, Tag


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name", "created_at"]
        read_only_fields = ["id", "created_at"]

    def validate_name(self, value: str) -> str:
        return value.strip().lower()


class PersonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Person
        fields = ["id", "name", "relationship", "notes", "last_contacted", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class ReminderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reminder
        fields = ["id", "inbox_item", "remind_at", "status", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class InboxItemSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)
    tag_names = serializers.ListField(
        child=serializers.CharField(max_length=64),
        write_only=True,
        required=False,
        allow_empty=True,
    )
    person = PersonSerializer(read_only=True)
    person_id = serializers.PrimaryKeyRelatedField(
        queryset=Person.objects.none(),
        source="person",
        write_only=True,
        required=False,
        allow_null=True,
    )
    is_overdue = serializers.BooleanField(read_only=True)

    class Meta:
        model = InboxItem
        fields = [
            "id",
            "raw_content",
            "title",
            "description",
            "type",
            "category",
            "priority",
            "status",
            "due_date",
            "due_time",
            "completed_at",
            "archived_at",
            "created_at",
            "updated_at",
            "tags",
            "tag_names",
            "person",
            "person_id",
            "is_overdue",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "completed_at", "archived_at", "is_overdue"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            self.fields["person_id"].queryset = Person.objects.filter(user=request.user)

    def validate_tag_names(self, value: list[str]) -> list[str]:
        normalized = []
        for tag in value:
            name = tag.strip().lower().lstrip("#")
            if name:
                normalized.append(name[:64])
        return sorted(set(normalized))


class CaptureSerializer(serializers.Serializer):
    raw_content = serializers.CharField(max_length=4000, trim_whitespace=True)

    def validate_raw_content(self, value: str) -> str:
        if not value.strip():
            raise serializers.ValidationError("Capture cannot be empty.")
        return value.strip()


class InboxItemUpdateSerializer(InboxItemSerializer):
    raw_content = serializers.CharField(max_length=4000, required=False, trim_whitespace=True)
    title = serializers.CharField(max_length=220, required=False)
    description = serializers.CharField(required=False, allow_blank=True)
    type = serializers.ChoiceField(choices=InboxItem.Type.choices, required=False)
    category = serializers.ChoiceField(choices=InboxItem.Category.choices, required=False)
    priority = serializers.ChoiceField(choices=InboxItem.Priority.choices, required=False)
    status = serializers.ChoiceField(choices=InboxItem.Status.choices, required=False)
    due_date = serializers.DateField(required=False, allow_null=True)
    due_time = serializers.TimeField(required=False, allow_null=True)


class ScheduleSerializer(serializers.Serializer):
    due_date = serializers.DateField()
    due_time = serializers.TimeField(required=False, allow_null=True)


class MoveSerializer(serializers.Serializer):
    category = serializers.ChoiceField(choices=InboxItem.Category.choices)


class TodaySerializer(serializers.Serializer):
    must_handle = InboxItemSerializer(many=True)
    today = InboxItemSerializer(many=True)
    quick_wins = InboxItemSerializer(many=True)
    done = InboxItemSerializer(many=True)
    date = serializers.DateField(default=timezone.localdate)

