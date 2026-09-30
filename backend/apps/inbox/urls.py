from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.inbox.views import (
    FollowUpsView,
    IdeasView,
    InboxItemViewSet,
    PersonViewSet,
    SearchView,
    SummaryView,
    TagViewSet,
    TodayView,
    clear_space_moment,
)

router = DefaultRouter()
router.register("inbox", InboxItemViewSet, basename="inbox")
router.register("people", PersonViewSet, basename="people")
router.register("tags", TagViewSet, basename="tags")

urlpatterns = [
    path("", include(router.urls)),
    path("summary/", SummaryView.as_view(), name="summary"),
    path("today/", TodayView.as_view(), name="today"),
    path("ideas/", IdeasView.as_view(), name="ideas"),
    path("follow-ups/", FollowUpsView.as_view(), name="follow-ups"),
    path("search/", SearchView.as_view(), name="search"),
    path("clear-space-moment/", clear_space_moment, name="clear-space-moment"),
]

