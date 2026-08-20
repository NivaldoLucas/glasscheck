from rest_framework import generics, permissions, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.views import APIView

from social.permissions import hidden_user_ids

from .models import Profile
from .serializers import ProfileSerializer, RegisterSerializer


class RegisterView(generics.CreateAPIView):
    """Cria o usuário + Profile associado e já devolve um token de autenticação."""

    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        user_id = response.data["id"]
        token, _ = Token.objects.get_or_create(user_id=user_id)
        response.data["token"] = token.key
        return response


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile, _ = Profile.objects.get_or_create(user=request.user)
        return Response(ProfileSerializer(profile).data)


class ProfileViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Perfis consultáveis por outros usuários (para telas de perfil).
    Perfis privados ficam de fora da queryset para quem não é o dono nem
    amigo aceito — resulta em 404 na consulta direta, sem confirmar
    a existência do perfil.
    """

    serializer_class = ProfileSerializer

    def get_queryset(self):
        return Profile.objects.exclude(
            user_id__in=hidden_user_ids(self.request.user)
        ).select_related("user")
