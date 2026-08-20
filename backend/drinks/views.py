from rest_framework import filters, viewsets

from .models import Drink
from .serializers import DrinkSerializer


class DrinkViewSet(viewsets.ModelViewSet):
    """
    Catálogo global de drinks.

    GET /api/drinks/?search=caip  -> usado pelo front para checar duplicados
    antes de criar um novo drink (ver seção 5 do documento de conceito).
    """

    queryset = Drink.objects.all()
    serializer_class = DrinkSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["name"]
