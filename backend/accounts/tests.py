import io
import shutil
import tempfile

from django.contrib.auth.models import User
from django.test import override_settings
from django.urls import reverse
from PIL import Image
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from social.models import Friendship

from .models import Profile


def fake_image_file(name="avatar.jpg"):
    buffer = io.BytesIO()
    Image.new("RGB", (10, 10), color="blue").save(buffer, format="JPEG")
    buffer.seek(0)
    buffer.name = name
    return buffer


class RegisterAndAuthTests(APITestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls._media_root = tempfile.mkdtemp()
        cls._media_override = override_settings(MEDIA_ROOT=cls._media_root)
        cls._media_override.enable()

    @classmethod
    def tearDownClass(cls):
        cls._media_override.disable()
        shutil.rmtree(cls._media_root, ignore_errors=True)
        super().tearDownClass()

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

    def test_me_patch_toggles_privacy_and_bio(self):
        user = User.objects.create_user("carla", password="senha12345")
        Profile.objects.create(user=user)
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
        response = self.client.patch(reverse("me"), {"is_private": True, "bio": "gosto de gin"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["is_private"])
        self.assertEqual(response.data["bio"], "gosto de gin")

    def test_me_patch_uploads_avatar(self):
        user = User.objects.create_user("dora", password="senha12345")
        Profile.objects.create(user=user)
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

        response = self.client.patch(
            reverse("me"), {"avatar": fake_image_file()}, format="multipart"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["avatar_display_url"])


class ProfileDiscoveryTests(APITestCase):
    """
    O perfil em si é sempre buscável/visível (como no Instagram) — é só o
    catálogo de check-ins que fica escondido de quem não é amigo aceito
    (ver checkins.tests.CheckInPrivacyTests). Isso é necessário pra dar pra
    encontrar uma conta privada e mandar pedido de amizade pra ela.
    """

    def setUp(self):
        self.owner = User.objects.create_user("dono", password="senha12345")
        self.profile = Profile.objects.create(user=self.owner, is_private=True)
        self.stranger = User.objects.create_user("estranho", password="senha12345")
        self.friend = User.objects.create_user("amigo", password="senha12345")
        Friendship.objects.create(from_user=self.friend, to_user=self.owner, status="accepted")

    def _auth(self, user):
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    def test_private_profile_still_visible_to_stranger(self):
        self._auth(self.stranger)
        response = self.client.get(reverse("profile-detail", args=[self.profile.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["friendship_status"], "none")

    def test_private_profile_visible_to_anonymous(self):
        response = self.client.get(reverse("profile-detail", args=[self.profile.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(response.data["friendship_status"])

    def test_friendship_status_reflects_accepted_friend(self):
        self._auth(self.friend)
        response = self.client.get(reverse("profile-detail", args=[self.profile.id]))
        self.assertEqual(response.data["friendship_status"], "accepted")

    def test_friendship_status_self(self):
        self._auth(self.owner)
        response = self.client.get(reverse("profile-detail", args=[self.profile.id]))
        self.assertEqual(response.data["friendship_status"], "self")

    def test_search_by_username(self):
        response = self.client.get(reverse("profile-list"), {"search": "dono"})
        usernames = [p["username"] for p in response.data["results"]]
        self.assertEqual(usernames, ["dono"])

    def test_friendship_status_pending(self):
        pending_friend = User.objects.create_user("pendente", password="senha12345")
        pending_profile = Profile.objects.create(user=pending_friend)
        friendship = Friendship.objects.create(from_user=pending_friend, to_user=self.owner)

        self._auth(pending_friend)
        response = self.client.get(reverse("profile-detail", args=[self.profile.id]))
        self.assertEqual(response.data["friendship_status"], "pending_sent")
        self.assertEqual(response.data["friendship_id"], friendship.id)

        self._auth(self.owner)
        response = self.client.get(reverse("profile-detail", args=[pending_profile.id]))
        self.assertEqual(response.data["friendship_status"], "pending_received")
