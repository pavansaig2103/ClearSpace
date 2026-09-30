from rest_framework import status, viewsets
from rest_framework.response import Response

from apps.memories.models import Memory
from apps.memories.serializers import MemorySerializer


class MemoryViewSet(viewsets.ModelViewSet):
    serializer_class = MemorySerializer
    queryset = Memory.objects.all()

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        return Response({"ok": True, "data": self.get_serializer(queryset, many=True).data})

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)
        return Response({"ok": True, "data": serializer.data}, status=status.HTTP_201_CREATED)

    def retrieve(self, request, *args, **kwargs):
        return Response({"ok": True, "data": self.get_serializer(self.get_object()).data})

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        serializer = self.get_serializer(self.get_object(), data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"ok": True, "data": serializer.data})

    def destroy(self, request, *args, **kwargs):
        self.get_object().delete()
        return Response({"ok": True, "data": {"message": "Memory deleted"}})

