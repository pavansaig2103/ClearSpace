from __future__ import annotations

from datetime import timedelta

from django.db.models import Count, Q
from django.utils import timezone
from django.utils.dateparse import parse_date
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.inbox.models import ActivityLog, InboxItem, Person, Tag
from apps.inbox.serializers import (
    CaptureSerializer,
    InboxItemSerializer,
    InboxItemUpdateSerializer,
    MoveSerializer,
    PersonSerializer,
    ScheduleSerializer,
    TagSerializer,
)
from apps.inbox.services.inbox_service import InboxService


class UserScopedMixin:
    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class TagViewSet(UserScopedMixin, viewsets.ModelViewSet):
    serializer_class = TagSerializer
    queryset = Tag.objects.all()

    def list(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_queryset(), many=True)
        return Response({"ok": True, "data": serializer.data})

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        tag, _ = Tag.objects.get_or_create(user=request.user, name=serializer.validated_data["name"])
        return Response({"ok": True, "data": self.get_serializer(tag).data}, status=status.HTTP_201_CREATED)


class PersonViewSet(UserScopedMixin, viewsets.ModelViewSet):
    serializer_class = PersonSerializer
    queryset = Person.objects.all()

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        q = request.query_params.get("q")
        if q:
            queryset = queryset.filter(Q(name__icontains=q) | Q(relationship__icontains=q) | Q(notes__icontains=q))
        serializer = self.get_serializer(queryset, many=True)
        return Response({"ok": True, "data": serializer.data})

    def retrieve(self, request, *args, **kwargs):
        return Response({"ok": True, "data": self.get_serializer(self.get_object()).data})

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)
        return Response({"ok": True, "data": serializer.data}, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        serializer = self.get_serializer(self.get_object(), data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"ok": True, "data": serializer.data})

    def destroy(self, request, *args, **kwargs):
        self.get_object().delete()
        return Response({"ok": True, "data": {"message": "Person deleted"}})


class InboxItemViewSet(viewsets.ModelViewSet):
    queryset = InboxItem.objects.select_related("person").prefetch_related("tags")
    service = InboxService()

    def get_serializer_class(self):
        if self.action == "create":
            return CaptureSerializer
        if self.action in {"update", "partial_update"}:
            return InboxItemUpdateSerializer
        return InboxItemSerializer

    def get_queryset(self):
        queryset = self.queryset.filter(user=self.request.user)
        params = self.request.query_params
        status_filter = params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        else:
            queryset = queryset.exclude(status=InboxItem.Status.ARCHIVED)
        for field in ["type", "category", "priority"]:
            value = params.get(field)
            if value:
                queryset = queryset.filter(**{field: value})
        tag = params.get("tag")
        if tag:
            queryset = queryset.filter(tags__name=tag.lower())
        q = params.get("q")
        if q:
            queryset = queryset.filter(
                Q(raw_content__icontains=q)
                | Q(title__icontains=q)
                | Q(description__icontains=q)
                | Q(tags__name__icontains=q)
                | Q(person__name__icontains=q)
            ).distinct()
        if params.get("due_today") == "true":
            queryset = queryset.filter(due_date=timezone.localdate())
        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = InboxItemSerializer(page, many=True, context={"request": request})
            return self.get_paginated_response(serializer.data)
        serializer = InboxItemSerializer(queryset, many=True, context={"request": request})
        return Response({"ok": True, "data": serializer.data})

    def retrieve(self, request, *args, **kwargs):
        return Response({"ok": True, "data": InboxItemSerializer(self.get_object(), context={"request": request}).data})

    def create(self, request, *args, **kwargs):
        serializer = CaptureSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        item = self.service.capture(user=request.user, raw_content=serializer.validated_data["raw_content"])
        data = InboxItemSerializer(item, context={"request": request}).data
        return Response({"ok": True, "data": data}, status=status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        serializer = InboxItemUpdateSerializer(self.get_object(), data=request.data, partial=True, context={"request": request})
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)
        item = self.service.update(item=self.get_object(), data=data)
        return Response({"ok": True, "data": InboxItemSerializer(item, context={"request": request}).data})

    def update(self, request, *args, **kwargs):
        return self.partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        item = self.get_object()
        ActivityLog.objects.create(user=request.user, inbox_item=None, action=ActivityLog.Action.DELETED, metadata={"title": item.title})
        item.delete()
        return Response({"ok": True, "data": {"message": "Item deleted"}})

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        item = self.service.complete(item=self.get_object())
        return Response({"ok": True, "data": InboxItemSerializer(item, context={"request": request}).data})

    @action(detail=True, methods=["post"])
    def archive(self, request, pk=None):
        item = self.service.archive(item=self.get_object())
        return Response({"ok": True, "data": InboxItemSerializer(item, context={"request": request}).data})

    @action(detail=True, methods=["post"])
    def restore(self, request, pk=None):
        item = self.service.restore(item=self.get_object())
        return Response({"ok": True, "data": InboxItemSerializer(item, context={"request": request}).data})

    @action(detail=True, methods=["post"])
    def schedule(self, request, pk=None):
        serializer = ScheduleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        item = self.service.schedule(item=self.get_object(), **serializer.validated_data)
        return Response({"ok": True, "data": InboxItemSerializer(item, context={"request": request}).data})

    @action(detail=True, methods=["post"])
    def move(self, request, pk=None):
        serializer = MoveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        item = self.service.move(item=self.get_object(), category=serializer.validated_data["category"])
        return Response({"ok": True, "data": InboxItemSerializer(item, context={"request": request}).data})


class SummaryView(APIView):
    def get(self, request):
        active = InboxItem.objects.filter(user=request.user, status=InboxItem.Status.ACTIVE)
        data = {
            "today": active.filter(category=InboxItem.Category.TODAY).count(),
            "upcoming": active.filter(category=InboxItem.Category.UPCOMING).count(),
            "ideas": active.filter(category=InboxItem.Category.IDEA).count(),
            "follow_ups": active.filter(category=InboxItem.Category.FOLLOW_UP).count(),
            "completed_this_week": InboxItem.objects.filter(
                user=request.user,
                status=InboxItem.Status.COMPLETED,
                completed_at__gte=timezone.now() - timedelta(days=7),
            ).count(),
        }
        return Response({"ok": True, "data": data})


class TodayView(APIView):
    def get(self, request):
        today = timezone.localdate()
        base = InboxItem.objects.filter(user=request.user).select_related("person").prefetch_related("tags")
        active = base.filter(status=InboxItem.Status.ACTIVE)
        must_handle = active.filter(Q(priority=InboxItem.Priority.HIGH) | Q(due_date__lt=today)).exclude(category=InboxItem.Category.IDEA)[:8]
        today_items = active.filter(due_date=today).exclude(priority=InboxItem.Priority.HIGH)[:12]
        quick_wins = active.filter(type=InboxItem.Type.TASK, priority__in=[InboxItem.Priority.LOW, InboxItem.Priority.NORMAL], due_date__isnull=True)[:6]
        done = base.filter(status=InboxItem.Status.COMPLETED, completed_at__date=today)[:8]
        return Response(
            {
                "ok": True,
                "data": {
                    "date": today,
                    "must_handle": InboxItemSerializer(must_handle, many=True, context={"request": request}).data,
                    "today": InboxItemSerializer(today_items, many=True, context={"request": request}).data,
                    "quick_wins": InboxItemSerializer(quick_wins, many=True, context={"request": request}).data,
                    "done": InboxItemSerializer(done, many=True, context={"request": request}).data,
                },
            }
        )


class IdeasView(APIView):
    def get(self, request):
        ideas = InboxItem.objects.filter(
            user=request.user,
            type=InboxItem.Type.IDEA,
        ).exclude(status=InboxItem.Status.ARCHIVED).select_related("person").prefetch_related("tags")
        return Response({"ok": True, "data": InboxItemSerializer(ideas, many=True, context={"request": request}).data})


class FollowUpsView(APIView):
    def get(self, request):
        items = InboxItem.objects.filter(
            user=request.user,
            type=InboxItem.Type.FOLLOW_UP,
        ).exclude(status=InboxItem.Status.ARCHIVED).select_related("person").prefetch_related("tags")
        return Response({"ok": True, "data": InboxItemSerializer(items, many=True, context={"request": request}).data})


class SearchView(APIView):
    def get(self, request):
        query = request.query_params.get("q", "").strip()
        items = InboxItem.objects.filter(user=request.user).select_related("person").prefetch_related("tags")
        people = Person.objects.filter(user=request.user)

        if query:
            items = items.filter(
                Q(raw_content__icontains=query)
                | Q(title__icontains=query)
                | Q(description__icontains=query)
                | Q(tags__name__icontains=query)
                | Q(person__name__icontains=query)
            ).distinct()
            people = people.filter(Q(name__icontains=query) | Q(relationship__icontains=query) | Q(notes__icontains=query))
        else:
            items = items.none()
            people = people.none()

        for field in ["type", "category", "status"]:
            value = request.query_params.get(field)
            if value:
                items = items.filter(**{field: value})
        tag = request.query_params.get("tag")
        if tag:
            items = items.filter(tags__name=tag.lower())
        date_filter = request.query_params.get("date")
        if date_filter:
            today = timezone.localdate()
            if date_filter == "today":
                items = items.filter(due_date=today)
            elif date_filter == "tomorrow":
                items = items.filter(due_date=today + timedelta(days=1))
            elif date_filter == "this_week":
                items = items.filter(due_date__gte=today, due_date__lte=today + timedelta(days=7))
            elif date_filter == "no_date":
                items = items.filter(due_date__isnull=True)
            else:
                parsed_date = parse_date(date_filter)
                if parsed_date:
                    items = items.filter(due_date=parsed_date)

        return Response(
            {
                "ok": True,
                "data": {
                    "items": InboxItemSerializer(items[:30], many=True, context={"request": request}).data,
                    "people": PersonSerializer(people[:10], many=True).data,
                },
            }
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def clear_space_moment(request):
    since = timezone.now() - timedelta(hours=24)
    cleared = ActivityLog.objects.filter(
        user=request.user,
        action__in=[ActivityLog.Action.COMPLETED, ActivityLog.Action.ARCHIVED, ActivityLog.Action.CATEGORIZED],
        created_at__gte=since,
    ).count()
    return Response({"ok": True, "data": {"cleared": cleared}})

