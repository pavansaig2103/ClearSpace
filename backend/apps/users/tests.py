from __future__ import annotations

import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.users.models import User


@pytest.mark.django_db
def test_me_requires_authentication():
    response = APIClient().get(reverse("me"))
    assert response.status_code == 401


@pytest.mark.django_db
def test_me_returns_current_user():
    user = User.objects.create_user(email="sam@example.com", password="StrongPass123!", name="Sam")
    client = APIClient()
    client.force_authenticate(user=user)
    response = client.get(reverse("me"))
    assert response.status_code == 200
    assert response.data["data"]["email"] == "sam@example.com"

