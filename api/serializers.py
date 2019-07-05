import typing as t
from abc import abstractmethod
import json

from django.contrib.auth import authenticate, get_user_model

from rest_framework import serializers

from mtgorp.models.serilization.serializeable import compacted_model
from mtgorp.models.serilization.strategies.jsonid import JsonId
from mtgorp.models.persistent.printing import Printing
from mtgorp.models.persistent.cardboard import Cardboard
from mtgorp.models.persistent.card import Card
from mtgorp.models.persistent.expansion import Expansion

from magiccube.collections.cube import Cube
from magiccube.laps.tickets.ticket import Ticket
from magiccube.laps.purples.purple import Purple
from magiccube.laps.traps.trap import Trap
from magiccube.laps.traps.tree.printingtree import PrintingNode

from resources.staticdb import db
from api import models


T = t.TypeVar('T')


class ModelSerializer(t.Generic[T]):

    @classmethod
    @abstractmethod
    def serialize(cls, serializeable: T) -> compacted_model:
        pass


class ExpansionSerializer(ModelSerializer[Expansion]):

    @classmethod
    def serialize(cls, expansion: Expansion) -> compacted_model:
        return {
            'code': expansion.code,
            'name': expansion.name,
            'block': None if expansion.block is None else expansion.block.name,
            'release_date': expansion.release_date,
            'type': 'expansion',
        }


class MinimalPrintingSerializer(ModelSerializer[Printing]):

    @classmethod
    def serialize(cls, printing: Printing) -> compacted_model:
        return {
            'name': printing.cardboard.name,
            'id': printing.id,
        }


class PrintingSerializer(ModelSerializer[Printing]):

    @classmethod
    def serialize(cls, printing: Printing) -> compacted_model:
        return {
            'name': printing.cardboard.name,
            'expansion': ExpansionSerializer.serialize(printing.expansion),
            'id': printing.id,
            'color': [
                color.letter_code
                for color in
                printing.cardboard.front_card.color
            ],
            'types': [
                _type.name
                for _type in
                printing.cardboard.front_card.type_line.types
            ],
            'type': 'printing',
        }


class CardSerializer(ModelSerializer[Card]):

    @classmethod
    def serialize(cls, card: Card) -> compacted_model:
        return {
            'name': card.name,
            'oracle_text': card.oracle_text,
            'mana_cost': (
                None
                if card.mana_cost is None else
                {
                    'str': str(card.mana_cost),
                    'atoms': [
                        atom.code
                        for atom in
                        card.mana_cost
                    ],
                }
            ),
            'cmc': card.cmc,
            'color': [
                color.letter_code
                for color in
                card.color
            ],
            'type_line': {
                'types': [
                    _type.name
                    for _type in
                    card.type_line.types
                ],
                'line': str(card.type_line),
            },
            'power_toughness': (
                None
                if card.power_toughness is None else
                {
                    'power': str(card.power_toughness.power),
                    'toughness': str(card.power_toughness.toughness),
                    'str': str(card.power_toughness)
                }
            ),
            'loyalty': str(card.loyalty),
        }


class CardboardSerializer(ModelSerializer[Cardboard]):

    @classmethod
    def serialize(cls, cardboard: Cardboard) -> compacted_model:
        return {
            'name': cardboard.name,
            'front_cards': [
                CardSerializer.serialize(card)
                for card in
                cardboard.front_cards
            ],
            'back_cards': [
                CardSerializer.serialize(card)
                for card in
                cardboard.back_cards
            ],
            'layout': cardboard.layout.name,
        }


class MinimalCardboardSerializer(ModelSerializer[Cardboard]):

    @classmethod
    def serialize(cls, cardboard: Cardboard) -> compacted_model:
        return {
            'name': cardboard.name,
        }


class FullPrintingSerializer(ModelSerializer[Printing]):

    @classmethod
    def serialize(cls, printing: Printing) -> compacted_model:
        return {
            'id': printing.id,
            'expansion': ExpansionSerializer.serialize(printing.expansion),
            'cardboard': CardboardSerializer.serialize(printing.cardboard),
        }


class NodeSerializer(ModelSerializer):

    @classmethod
    def serialize(cls, printing_node: PrintingNode) -> compacted_model:
        return {
            'type': printing_node.__class__.__name__,
            'children': [
                PrintingSerializer.serialize(
                    child
                ) if isinstance(child, Printing) else
                NodeSerializer.serialize(
                    child
                )
                for child in
                printing_node.children
            ],
        }


class TrapSerializer(ModelSerializer[Trap]):

    @classmethod
    def serialize(cls, trap: Trap) -> compacted_model:
        return {
            'id': trap.persistent_hash(),
            'node': NodeSerializer.serialize(trap.node),
            'intention_type': trap.intention_type.name,
            'type': 'trap',
            'string_representation': trap.node.get_minimal_string(identified_by_id=False),
        }


class TicketSerializer(ModelSerializer[Ticket]):

    @classmethod
    def serialize(cls, ticket: Ticket) -> compacted_model:
        return {
            'options': [
                PrintingSerializer.serialize(
                    printing
                ) for printing in
                ticket.options
            ],
            'name': ticket.name,
            'id': ticket.persistent_hash(),
            'type': 'ticket',
        }


class PurpleSerializer(ModelSerializer[Purple]):

    @classmethod
    def serialize(cls, purple: Purple) -> compacted_model:
        return {
            'name': purple.name,
            'id': purple.persistent_hash(),
            'description': purple.description,
            'type': 'purple',
        }


class CubeSerializer(ModelSerializer[Cube]):

    @classmethod
    def serialize(cls, cube: Cube) -> compacted_model:
        return {
            'printings': [
                PrintingSerializer.serialize(
                    printing
                ) for printing in
                cube.printings
            ],
            'traps': [
                TrapSerializer.serialize(
                    trap
                ) for trap in
                cube.traps
            ],
            'tickets': [
                TicketSerializer.serialize(
                    ticket
                ) for ticket in
                cube.tickets
            ],
            'purples': [
                PurpleSerializer.serialize(
                    purple
                ) for purple in
                cube.purples
            ],
        }


class JsonField(serializers.Field):

    def to_internal_value(self, data):
        return json.loads(data)

    def to_representation(self, value):
        return CubeSerializer.serialize(
            JsonId(db).deserialize(
                Cube,
                value
            )
        )


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = get_user_model()
        fields = ('id', 'username')


class MinimalVersionedCubeSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)

    class Meta:
        model = models.VersionedCube
        fields = ('id', 'name', 'created_at', 'author', 'description')


class MinimalCubeContainerSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    name = serializers.CharField(read_only=True)
    checksum = serializers.CharField(read_only=True)
    intended_size = serializers.IntegerField(read_only=True)

    def update(self, instance, validated_data):
        raise NotImplemented()

    def create(self, validated_data):
        raise NotImplemented()


class CubeDeltaSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    versioned_cube = serializers.PrimaryKeyRelatedField(queryset=models.VersionedCube.objects.all())

    class Meta:
        model = models.CubeDelta
        fields = ('id', 'created_at', 'author', 'description', 'versioned_cube')


class CubeContainerSerializer(MinimalCubeContainerSerializer):
    versioned_cube = MinimalVersionedCubeSerializer(read_only=True)


class FullCubeContainerSerializer(CubeContainerSerializer):
    cube_content = JsonField()


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

    def validate(self, data):
        user = authenticate(**data)
        if user and user.is_active:
            return user
        raise serializers.ValidationError('Unable to login')

    def update(self, instance, validated_data):
        raise NotImplemented()

    def create(self, validated_data):
        raise NotImplemented()


class VersionedCubeSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    releases = MinimalCubeContainerSerializer(read_only=True, many=True)

    class Meta:
        model = models.VersionedCube
        fields = ('id', 'name', 'created_at', 'author', 'description', 'releases')

