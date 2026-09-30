from __future__ import annotations

from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.inbox.models import InboxItem, Person
from apps.inbox.services.inbox_service import InboxService
from apps.memories.models import Memory
from apps.users.models import User


class Command(BaseCommand):
    help = "Create realistic development data for ClearSpace."

    def handle(self, *args, **options):
        user, created = User.objects.get_or_create(
            email="pavan@clearspace.dev",
            defaults={"name": "Pavan", "timezone": "Asia/Calcutta"},
        )
        if created:
            user.set_password("Clearspace123!")
            user.save(update_fields=["password"])

        service = InboxService()
        samples = [
            "Finish DBMS assignment today #college",
            "Buy laptop charger tomorrow #errands",
            "Ask professor about project submission",
            "Idea: AI assistant for local restaurants",
            "Call Rahul about internship referral tonight",
            "Pay electricity bill Friday",
            "Learn Docker someday",
            "Book bike service this week",
            "Watch that Django deployment video later",
            "Maybe build a tiny habit tracker for study sessions",
        ]
        if not user.inbox_items.exists():
            for sample in samples:
                service.capture(user=user, raw_content=sample)

        rahul, _ = Person.objects.get_or_create(
            user=user,
            name="Rahul",
            defaults={"relationship": "Friend", "last_contacted": timezone.localdate() - timedelta(days=8)},
        )
        InboxItem.objects.filter(user=user, raw_content__icontains="Rahul").update(person=rahul)

        Memory.objects.get_or_create(
            user=user,
            date=timezone.localdate(),
            content="Finally started shaping ClearSpace into a calmer place for everything in my head.",
        )
        Memory.objects.get_or_create(
            user=user,
            date=timezone.localdate() - timedelta(days=1),
            content="Had a good evening walk and did not rush back to my phone.",
        )

        self.stdout.write(self.style.SUCCESS("Seeded ClearSpace demo data."))
        self.stdout.write("Login: pavan@clearspace.dev / Clearspace123!")

