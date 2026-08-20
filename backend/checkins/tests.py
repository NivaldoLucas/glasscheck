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

from accounts.models import Profile
from drinks.models import Drink
from social.models import Friendship

from .models import CheckIn


def fake_image_file(name="photo.jpg"):
    buffer = io.BytesIO()
    Image.new("RGB", (10, 10), color="red").save(buffer, format="JPEG")
    buffer.seek(0)
    buffer.name = name
    return buffer


class CheckInTests(APITestCase):
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

    def setUp(self):
        self.user = User.objects.create_user("carla", password="senha12345")
        Profile.objects.create(user=self.user)
        self.drink = Drink.objects.create(name="Caipirinha")
        self.token = Token.objects.create(user=self.user)

    def _auth(self, user):
        token, _ = Token.objects.get_or_create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    def test_anonymous_cannot_create_checkin(self):
        response = self.client.post(
            reverse("checkin-list"),
            {"drink": self.drink.id, "photo_url": "https://example.com/a.jpg"},
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_checkin_assigns_authenticated_user(self):
        self._auth(self.user)
        response = self.client.post(
            reverse("checkin-list"),
            {"drink": self.drink.id, "photo_url": "https://example.com/a.jpg", "rating": 4},
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        checkin = CheckIn.objects.get(id=response.data["id"])
        self.assertEqual(checkin.user, self.user)

    def test_create_checkin_with_uploaded_photo(self):
        self._auth(self.user)
        response = self.client.post(
            reverse("checkin-list"),
            {"drink": self.drink.id, "photo": fake_image_file(), "rating": 5},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        checkin = CheckIn.objects.get(id=response.data["id"])
        self.assertTrue(checkin.photo.name)
        self.assertTrue(response.data["photo_display_url"].endswith(checkin.photo.url))

    def test_create_checkin_without_photo_or_photo_url_fails(self):
        self._auth(self.user)
        response = self.client.post(reverse("checkin-list"), {"drink": self.drink.id})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_checkins_filtered_by_user_param(self):
        other = User.objects.create_user("davi", password="senha12345")
        Profile.objects.create(user=other)
        CheckIn.objects.create(user=self.user, drink=self.drink, photo_url="https://example.com/a.jpg")
        CheckIn.objects.create(user=other, drink=self.drink, photo_url="https://example.com/b.jpg")

        response = self.client.get(reverse("checkin-list"), {"user": self.user.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [c["user"] for c in response.data["results"]]
        self.assertEqual(ids, [self.user.id])

    def test_set_cover_marks_only_one_checkin_per_drink(self):
        self._auth(self.user)
        first = CheckIn.objects.create(user=self.user, drink=self.drink, photo_url="https://example.com/a.jpg")
        second = CheckIn.objects.create(user=self.user, drink=self.drink, photo_url="https://example.com/b.jpg")

        response = self.client.post(reverse("checkin-set-cover", args=[first.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["is_cover"])

        response = self.client.post(reverse("checkin-set-cover", args=[second.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        first.refresh_from_db()
        second.refresh_from_db()
        self.assertFalse(first.is_cover)
        self.assertTrue(second.is_cover)

    def test_only_owner_can_set_cover(self):
        other = User.objects.create_user("davi2", password="senha12345")
        Profile.objects.create(user=other)
        checkin = CheckIn.objects.create(user=self.user, drink=self.drink, photo_url="https://example.com/a.jpg")

        self._auth(other)
        response = self.client.post(reverse("checkin-set-cover", args=[checkin.id]))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class CheckInPrivacyTests(APITestCase):
    def setUp(self):
        self.drink = Drink.objects.create(name="Negroni")
        self.owner = User.objects.create_user("erica", password="senha12345")
        Profile.objects.create(user=self.owner, is_private=True)
        CheckIn.objects.create(user=self.owner, drink=self.drink, photo_url="https://example.com/c.jpg")

        self.stranger = User.objects.create_user("fabio", password="senha12345")
        Profile.objects.create(user=self.stranger)

        self.friend = User.objects.create_user("gabi", password="senha12345")
        Profile.objects.create(user=self.friend)
        Friendship.objects.create(from_user=self.friend, to_user=self.owner, status="accepted")

    def _auth(self, user):
        token, _ = Token.objects.get_or_create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    def test_private_user_checkins_hidden_from_stranger(self):
        self._auth(self.stranger)
        response = self.client.get(reverse("checkin-list"))
        self.assertEqual(response.data["results"], [])

    def test_private_user_checkins_visible_to_friend(self):
        self._auth(self.friend)
        response = self.client.get(reverse("checkin-list"))
        self.assertEqual(len(response.data["results"]), 1)

    def test_private_user_checkins_visible_to_owner(self):
        self._auth(self.owner)
        response = self.client.get(reverse("checkin-list"))
        self.assertEqual(len(response.data["results"]), 1)
