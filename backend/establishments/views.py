from rest_framework import filters, viewsets

from .models import Establishment
from .serializers import EstablishmentSerializer


class EstablishmentViewSet(viewsets.ModelViewSet):
    """Catálogo global de estabelecimentos, com busca para checagem de duplicados."""

    queryset = Establishment.objects.all()
    serializer_class = EstablishmentSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["name"]
