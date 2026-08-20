from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from .models import Drink


class DrinkCatalogTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user("hugo", password="senha12345")
        token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    def test_create_drink(self):
        response = self.client.post(reverse("drink-list"), {"name": "Mojito", "category": "cocktail"})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Drink.objects.filter(name="Mojito").exists())

    def test_search_is_used_for_dedupe_check(self):
        Drink.objects.create(name="Caipirinha")
        Drink.objects.create(name="Margarita")

        response = self.client.get(reverse("drink-list"), {"search": "caip"})
        names = [d["name"] for d in response.data["results"]]
        self.assertEqual(names, ["Caipirinha"])

    def test_anonymous_can_list_but_not_create(self):
        self.client.credentials()
        response = self.client.post(reverse("drink-list"), {"name": "Daiquiri"})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
