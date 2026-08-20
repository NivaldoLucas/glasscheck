from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from social.models import Friendship

from .models import Profile


class RegisterAndAuthTests(APITestCase):
    def test_register_creates_user_profile_and_token(self):
        response = self.client.post(
            reverse("register"),
            {"username": "ana", "email": "ana@example.com", "password": "senha12345"},
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(username="ana")
        self.assertTrue(Profile.objects.filter(user=user).exists())
        self.assertEqual(response.data["token"], Token.objects.get(user=user).key)

    def test_me_requires_authentication(self):
        response = self.client.get(reverse("me"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_returns_authenticated_profile(self):
        user = User.objects.create_user("bruno", password="senha12345")
        Profile.objects.create(user=user)
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
        response = self.client.get(reverse("me"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "bruno")


class ProfileVisibilityTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user("dono", password="senha12345")
        self.profile = Profile.objects.create(user=self.owner, is_private=True)
        self.stranger = User.objects.create_user("estranho", password="senha12345")
        self.friend = User.objects.create_user("amigo", password="senha12345")
        Friendship.objects.create(from_user=self.friend, to_user=self.owner, status="accepted")

    def _auth(self, user):
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    def test_private_profile_hidden_from_stranger(self):
        self._auth(self.stranger)
        response = self.client.get(reverse("profile-detail", args=[self.profile.id]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_private_profile_hidden_from_anonymous(self):
        response = self.client.get(reverse("profile-detail", args=[self.profile.id]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_private_profile_visible_to_accepted_friend(self):
        self._auth(self.friend)
        response = self.client.get(reverse("profile-detail", args=[self.profile.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_private_profile_visible_to_owner(self):
        self._auth(self.owner)
        response = self.client.get(reverse("profile-detail", args=[self.profile.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_public_profile_visible_to_everyone(self):
        self.profile.is_private = False
        self.profile.save()
        self._auth(self.stranger)
        response = self.client.get(reverse("profile-detail", args=[self.profile.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
