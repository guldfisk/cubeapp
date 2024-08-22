from api.serialization import orpserialize
from api.serialization.serializers import OrpSerializerField
from limited import models
from limited.serializers.limitedsessions.full import LimitedSessionSerializer
from limited.serializers.pooldecks.full import PoolDeckSerializer
from limited.serializers.pools.minimal import MinimalPoolSerializer


class PoolSerializer(MinimalPoolSerializer):
    pool = OrpSerializerField(model_serializer=orpserialize.CubeSerializer)
    session = LimitedSessionSerializer()

    class Meta:
        model = models.Pool
        fields = ("id", "user", "session", "decks", "pool")


class FullPoolSerializer(PoolSerializer):
    decks = PoolDeckSerializer(many=True, source="pool_decks")

    class Meta:
        model = models.Pool
        fields = ("id", "user", "session", "decks", "pool")
