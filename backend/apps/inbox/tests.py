from __future__ import annotations

from datetime import timedelta

import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from apps.inbox.models import InboxItem
from apps.users.models import User


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_user(
        email="maya@example.com",
        password="StrongPass123!",
        name="Maya",
        timezone="Asia/Calcutta",
    )


@pytest.fixture
def other_user(db):
    return User.objects.create_user(
        email="other@example.com",
        password="StrongPass123!",
        name="Other",
    )


def authenticate(client, user):
    client.force_authenticate(user=user)


@pytest.mark.django_db
def test_register_and_login(api_client):
    register = api_client.post(
        reverse("register"),
        {
            "name": "Pavan",
            "email": "pavan@example.com",
            "password": "Clearspace123!",
            "timezone": "Asia/Calcutta",
        },
        format="json",
    )
    assert register.status_code == 201
    assert register.data["ok"] is True
    assert register.data["data"]["access"]

    login = api_client.post(
        reverse("login"),
        {"email": "pavan@example.com", "password": "Clearspace123!"},
        format="json",
    )
    assert login.status_code == 200
    assert login.data["data"]["user"]["email"] == "pavan@example.com"


@pytest.mark.django_db
def test_capture_categorizes_without_losing_raw_text(api_client, user):
    authenticate(api_client, user)
    response = api_client.post(
        "/api/inbox/",
        {"raw_content": "Pay electricity bill Friday #home"},
        format="json",
    )
    assert response.status_code == 201
    data = response.data["data"]
    assert data["raw_content"] == "Pay electricity bill Friday #home"
    assert data["type"] == InboxItem.Type.REMINDER
    assert data["category"] == InboxItem.Category.UPCOMING
    assert data["tags"][0]["name"] == "home"


@pytest.mark.django_db
def test_user_cannot_access_another_users_item(api_client, user, other_user):
    authenticate(api_client, other_user)
    created = api_client.post("/api/inbox/", {"raw_content": "Call Mom tonight"}, format="json")
    item_id = created.data["data"]["id"]

    authenticate(api_client, user)
    response = api_client.get(f"/api/inbox/{item_id}/")
    assert response.status_code == 404


@pytest.mark.django_db
def test_complete_item(api_client, user):
    authenticate(api_client, user)
    created = api_client.post("/api/inbox/", {"raw_content": "Finish DBMS assignment today"}, format="json")
    item_id = created.data["data"]["id"]

    response = api_client.post(f"/api/inbox/{item_id}/complete/", {}, format="json")
    assert response.status_code == 200
    assert response.data["data"]["status"] == InboxItem.Status.COMPLETED
    assert response.data["data"]["completed_at"]


@pytest.mark.django_db
def test_edit_and_schedule_item(api_client, user):
    authenticate(api_client, user)
    created = api_client.post("/api/inbox/", {"raw_content": "Book bike service"}, format="json")
    item_id = created.data["data"]["id"]
    due_date = timezone.localdate() + timedelta(days=3)

    edited = api_client.patch(
        f"/api/inbox/{item_id}/",
        {"title": "Book bike service appointment", "priority": "high"},
        format="json",
    )
    assert edited.status_code == 200
    assert edited.data["data"]["priority"] == "high"

    scheduled = api_client.post(
        f"/api/inbox/{item_id}/schedule/",
        {"due_date": due_date.isoformat()},
        format="json",
    )
    assert scheduled.status_code == 200
    assert scheduled.data["data"]["category"] == InboxItem.Category.UPCOMING


@pytest.mark.django_db
def test_search_is_user_scoped(api_client, user, other_user):
    authenticate(api_client, user)
    api_client.post("/api/inbox/", {"raw_content": "Idea: campus marketplace"}, format="json")
    authenticate(api_client, other_user)
    api_client.post("/api/inbox/", {"raw_content": "Idea: private finance tracker"}, format="json")

    authenticate(api_client, user)
    response = api_client.get("/api/search/?q=idea")
    titles = [item["title"] for item in response.data["data"]["items"]]
    assert any("campus" in title.lower() for title in titles)
    assert not any("finance" in title.lower() for title in titles)


@pytest.mark.django_db
def test_search_supports_due_date_filter(api_client, user):
    authenticate(api_client, user)
    created = api_client.post("/api/inbox/", {"raw_content": "Buy charger tomorrow"}, format="json")
    due_date = created.data["data"]["due_date"]

    response = api_client.get(f"/api/search/?q=charger&date={due_date}")

    assert response.status_code == 200
    assert [item["id"] for item in response.data["data"]["items"]] == [created.data["data"]["id"]]


@pytest.mark.django_db
def test_parser_understands_this_week_and_time(api_client, user):
    authenticate(api_client, user)
    response = api_client.post(
        "/api/inbox/",
        {"raw_content": "Book bike service this week at 5pm"},
        format="json",
    )

    data = response.data["data"]
    assert response.status_code == 201
    assert data["raw_content"] == "Book bike service this week at 5pm"
    assert data["category"] == InboxItem.Category.UPCOMING
    assert data["due_date"]
    assert data["due_time"] == "17:00:00"

