from rest_framework import filters, generics, permissions, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.views import APIView

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
        return Response(ProfileSerializer(profile, context={"request": request}).data)

    def patch(self, request):
        """Permite ao usuário editar bio/avatar e alternar a privacidade do próprio perfil."""
        profile, _ = Profile.objects.get_or_create(user=request.user)
        serializer = ProfileSerializer(profile, data=request.data, partial=True, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class ProfileViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Perfis consultáveis/buscáveis por outros usuários (para busca de pessoas e
    telas de perfil). A privacidade do perfil não afasta ele da busca — apenas
    o catálogo de check-ins fica de fora para quem não é dono nem amigo aceito
    (ver CheckInViewSet e social.permissions.hidden_user_ids). Isso permite
    encontrar e enviar pedido de amizade para uma conta privada, como no
    Instagram.
    """

    queryset = Profile.objects.select_related("user")
    serializer_class = ProfileSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["user__username"]
