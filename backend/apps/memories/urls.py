from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.memories.views import MemoryViewSet

router = DefaultRouter()
router.register("memories", MemoryViewSet, basename="memories")

urlpatterns = [
    path("", include(router.urls)),
]

