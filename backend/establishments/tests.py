from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from .models import Establishment


class EstablishmentCatalogTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user("iris", password="senha12345")
        token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    def test_create_establishment(self):
        response = self.client.post(reverse("establishment-list"), {"name": "Bar do Zé"})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Establishment.objects.filter(name="Bar do Zé").exists())

    def test_search_is_used_for_dedupe_check(self):
        Establishment.objects.create(name="Bar do Zé")
        Establishment.objects.create(name="Casa Aurora")

        response = self.client.get(reverse("establishment-list"), {"search": "aurora"})
        names = [e["name"] for e in response.data["results"]]
        self.assertEqual(names, ["Casa Aurora"])
