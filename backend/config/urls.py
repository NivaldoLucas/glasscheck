from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from rest_framework import routers
from rest_framework.authtoken.views import obtain_auth_token

from accounts.views import MeView, ProfileViewSet, RegisterView
from checkins.views import CheckInViewSet
from drinks.views import DrinkViewSet
from establishments.views import EstablishmentViewSet
from social.views import FriendshipViewSet

router = routers.DefaultRouter()
router.register("drinks", DrinkViewSet)
router.register("establishments", EstablishmentViewSet)
router.register("checkins", CheckInViewSet, basename="checkin")
router.register("friendships", FriendshipViewSet, basename="friendship")
router.register("profiles", ProfileViewSet, basename="profile")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/register/", RegisterView.as_view(), name="register"),
    path("api/auth/login/", obtain_auth_token, name="login"),
    path("api/auth/me/", MeView.as_view(), name="me"),
    path("api/", include(router.urls)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
