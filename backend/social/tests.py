from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from .models import Friendship


class FriendshipTests(APITestCase):
    def setUp(self):
        self.sender = User.objects.create_user("joao", password="senha12345")
        self.receiver = User.objects.create_user("karla", password="senha12345")
        self.outsider = User.objects.create_user("lucas", password="senha12345")

    def _auth(self, user):
        token, _ = Token.objects.get_or_create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    def test_create_request_assigns_from_user_and_defaults_pending(self):
        self._auth(self.sender)
        response = self.client.post(reverse("friendship-list"), {"to_user": self.receiver.id})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["from_user"], self.sender.id)
        self.assertEqual(response.data["status"], "pending")

    def test_receiver_can_accept(self):
        friendship = Friendship.objects.create(from_user=self.sender, to_user=self.receiver)
        self._auth(self.receiver)
        response = self.client.post(reverse("friendship-accept", args=[friendship.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        friendship.refresh_from_db()
        self.assertEqual(friendship.status, "accepted")

    def test_sender_cannot_accept_own_request(self):
        friendship = Friendship.objects.create(from_user=self.sender, to_user=self.receiver)
        self._auth(self.sender)
        response = self.client.post(reverse("friendship-accept", args=[friendship.id]))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        friendship.refresh_from_db()
        self.assertEqual(friendship.status, "pending")

    def test_outsider_cannot_see_or_accept_others_request(self):
        friendship = Friendship.objects.create(from_user=self.sender, to_user=self.receiver)
        self._auth(self.outsider)

        list_response = self.client.get(reverse("friendship-list"))
        self.assertEqual(list_response.data["results"], [])

        accept_response = self.client.post(reverse("friendship-accept", args=[friendship.id]))
        self.assertEqual(accept_response.status_code, status.HTTP_404_NOT_FOUND)
