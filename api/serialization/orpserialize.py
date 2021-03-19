import typing as t
from abc import abstractmethod

from mtgorp.models.collections.deck import Deck
from mtgorp.models.persistent.card import Card
from mtgorp.models.persistent.cardboard import Cardboard
from mtgorp.models.persistent.expansion import Expansion
from mtgorp.models.persistent.printing import Printing
from mtgorp.models.serilization.serializeable import compacted_model
from mtgorp.models.serilization.strategies.jsonid import JsonId

from magiccube.collections.cube import Cube
from magiccube.collections.cubeable import BaseCubeable, FlatBaseCubeable
from magiccube.collections.infinites import Infinites
from magiccube.collections.laps import TrapCollection
from magiccube.collections.meta import MetaCube
from magiccube.collections.nodecollection import NodeCollection, ConstrainedNode, GroupMap
from magiccube.laps.purples.purple import BasePurple
from magiccube.laps.tickets.ticket import BaseTicket, Ticket
from magiccube.laps.traps.trap import BaseTrap, Trap
from magiccube.laps.traps.tree.printingtree import BaseNode
from magiccube.update import cubeupdate
from magiccube.update.report import UpdateReport, ReportNotification


T = t.TypeVar('T')

DATETIME_FORMAT = '%Y %M/%d'


class ModelSerializer(t.Generic[T]):

    @classmethod
    @abstractmethod
    def serialize(cls, serializeable: T) -> compacted_model:
        pass


class PrintingIdSerializer(object):

    @classmethod
    def serialize(cls, printing: Printing) -> int:
        return printing.id


class CardboardIdSerializer(object):

    @classmethod
    def serialize(cls, cardboard: Cardboard) -> str:
        return cardboard.name


class ExpansionSerializer(ModelSerializer[Expansion]):

    @classmethod
    def serialize(cls, expansion: Expansion) -> compacted_model:
        return {
            'code': expansion.code,
            'name': expansion.name,
            'block': None if expansion.block is None else expansion.block.name,
            'release_date': expansion.release_date.strftime(DATETIME_FORMAT),
            'type': 'expansion',
            'id': expansion.code,
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
            'id': printing.id,
            'name': printing.cardboard.name,
            'cmc': printing.cardboard.front_card.cmc,
            'expansion_code': printing.expansion.code,
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
            'cardboard_cubeable_id': printing.cardboard.id,
        }


class CardSerializer(ModelSerializer[Card]):

    @classmethod
    def serialize(cls, card: Card) -> compacted_model:
        return {
            'name': card.name,
            'id': card.name,
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
            'id': cardboard.name,
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
            'type': 'cardboard',
        }


class MinimalCardboardSerializer(ModelSerializer[Cardboard]):

    @classmethod
    def serialize(cls, cardboard: Cardboard) -> compacted_model:
        return {
            'name': cardboard.name,
            'id': cardboard.name,
        }


class FullPrintingSerializer(ModelSerializer[Printing]):

    @classmethod
    def serialize(cls, printing: Printing) -> compacted_model:
        return {
            'id': printing.id,
            'name': printing.cardboard.name,
            'expansion': ExpansionSerializer.serialize(printing.expansion),
            'cardboard': CardboardSerializer.serialize(printing.cardboard),
            'type': printing.__class__.__name__,
            'cardboard_cubeable_id': printing.cardboard.id,
        }


class NodeSerializer(ModelSerializer[BaseNode]):

    @classmethod
    def _serialize_child(cls, child: BaseCubeable) -> compacted_model:
        if isinstance(child, Printing):
            return PrintingSerializer.serialize(child)
        if isinstance(child, Cardboard):
            return CardboardSerializer.serialize(child)
        return cls.serialize(child)

    @classmethod
    def serialize(cls, printing_node: BaseNode) -> compacted_model:
        return {
            'type': printing_node.__class__.__name__,
            'children': [
                (
                    cls._serialize_child(child),
                    multiplicity,
                )
                for child, multiplicity in
                printing_node.children.items()
            ],
            'id': printing_node.persistent_hash(),
        }


class TrapSerializer(ModelSerializer[BaseTrap]):

    @classmethod
    def serialize(cls, trap: BaseTrap) -> compacted_model:
        d = {
            'id': trap.persistent_hash(),
            'node': NodeSerializer.serialize(trap.node),
            'intention_type': trap.intention_type.name,
            'type': 'trap',
            'string_representation': trap.node.get_minimal_string(identified_by_id = False),
        }
        if isinstance(trap, Trap):
            d['cardboard_cubeable_id'] = trap.as_cardboards.id
        return d


class TicketSerializer(ModelSerializer[BaseTicket]):

    @classmethod
    def _serialize_option(cls, option: FlatBaseCubeable) -> t.Any:
        if isinstance(option, Printing):
            return PrintingSerializer.serialize(option)
        return CardboardSerializer.serialize(option)

    @classmethod
    def serialize(cls, ticket: BaseTicket) -> compacted_model:
        d = {
            'options': list(map(cls._serialize_option, ticket.options)),
            'name': ticket.name,
            'id': ticket.persistent_hash(),
            'type': 'ticket',
        }
        if isinstance(ticket, Ticket):
            d['cardboard_cubeable_id'] = ticket.as_cardboards.id
        return d


class PurpleSerializer(ModelSerializer[BasePurple]):

    @classmethod
    def serialize(cls, purple: BasePurple) -> compacted_model:
        return {
            'name': purple.name,
            'id': purple.persistent_hash(),
            'description': purple.description,
            'type': 'purple',
            'cardboard_cubeable_id': purple.name,
        }


class CubeSerializer(ModelSerializer[Cube]):

    @classmethod
    def serialize(cls, cube: Cube) -> compacted_model:
        return {
            'printings': [
                (
                    PrintingSerializer.serialize(printing),
                    multiplicity,
                )
                for printing, multiplicity in
                cube.printings.items()
            ],
            'traps': [
                (
                    TrapSerializer.serialize(trap),
                    multiplicity,
                )
                for trap, multiplicity in
                cube.traps.items()
            ],
            'tickets': [
                (
                    TicketSerializer.serialize(ticket),
                    multiplicity,
                )
                for ticket, multiplicity in
                cube.tickets.items()
            ],
            'purples': [
                (
                    PurpleSerializer.serialize(purple),
                    multiplicity,
                )
                for purple, multiplicity in
                cube.purples.items()
            ],
        }


class ConstrainedNodeOrpSerializer(ModelSerializer[ConstrainedNode]):

    @classmethod
    def serialize(cls, constrained_node: ConstrainedNode) -> compacted_model:
        return {
            'id': constrained_node.persistent_hash(),
            'value': constrained_node.value,
            'groups': list(constrained_node.groups),
            'node': NodeSerializer.serialize(
                constrained_node.node
            )
        }


class ConstrainedNodesOrpSerializer(ModelSerializer[NodeCollection]):

    @classmethod
    def serialize(cls, constrained_nodes: NodeCollection) -> compacted_model:
        return {
            'nodes': [
                (
                    ConstrainedNodeOrpSerializer.serialize(
                        node
                    ),
                    multiplicity,
                )
                for node, multiplicity in
                constrained_nodes.items()
            ]
        }


class CubePatchOrpSerializer(ModelSerializer[cubeupdate.CubePatch]):

    @classmethod
    def serialize(cls, cube_patch: cubeupdate.CubePatch) -> compacted_model:
        return {
            'cube_delta': {
                'printings': [
                    (PrintingSerializer.serialize(printing), multiplicity)
                    for printing, multiplicity in
                    cube_patch.cube_delta_operation.printings
                ],
                'traps': [
                    (TrapSerializer.serialize(trap), multiplicity)
                    for trap, multiplicity in
                    cube_patch.cube_delta_operation.traps
                ],
                'tickets': [
                    (TicketSerializer.serialize(ticket), multiplicity)
                    for ticket, multiplicity in
                    cube_patch.cube_delta_operation.tickets
                ],
                'purples': [
                    (PurpleSerializer.serialize(purple), multiplicity)
                    for purple, multiplicity in
                    cube_patch.cube_delta_operation.purples
                ],
            },
            'node_delta': [
                (
                    ConstrainedNodeOrpSerializer.serialize(node),
                    multiplicity,
                )
                for node, multiplicity in
                cube_patch.node_delta_operation.nodes.items()
            ]
        }


class CubeChangeSerializer(ModelSerializer[cubeupdate.CubeChange]):

    @classmethod
    def serialize(cls, serializeable: cubeupdate.CubeChange) -> compacted_model:
        return {
            'type': serializeable.__class__.__name__,
            'id': serializeable.persistent_hash(),
            'explanation': serializeable.explain(),
            'content': JsonId.serialize(serializeable),
            'category': serializeable.category.value,
        }


class GroupMapSerializer(ModelSerializer[GroupMap]):

    @classmethod
    def serialize(cls, serializeable: GroupMap) -> compacted_model:
        return {
            'groups': dict(serializeable.groups),
        }


class VerbosePatchSerializer(ModelSerializer[cubeupdate.VerboseCubePatch]):

    @classmethod
    def serialize(cls, serializeable: cubeupdate.VerboseCubePatch) -> compacted_model:
        return {
            'changes': [
                [CubeChangeSerializer.serialize(change), multiplicity]
                for change, multiplicity in
                serializeable.changes.items()
            ]
        }


class UpdateNotificationSerializer(ModelSerializer[ReportNotification]):

    @classmethod
    def serialize(cls, serializeable: ReportNotification) -> compacted_model:
        return {
            'title': serializeable.title,
            'content': serializeable.content,
            'level': serializeable.notification_level.value,
        }


class UpdateReportSerializer(ModelSerializer[UpdateReport]):

    @classmethod
    def serialize(cls, serializeable: UpdateReport) -> compacted_model:
        return {
            'notifications': [
                UpdateNotificationSerializer.serialize(
                    notification
                )
                for notification in
                serializeable.notifications
            ]
        }


class TrapCollectionSerializer(ModelSerializer[TrapCollection]):

    @classmethod
    def serialize(cls, serializeable: TrapCollection) -> compacted_model:
        return {
            'traps': [
                (
                    TrapSerializer.serialize(trap),
                    multiplicity,
                )
                for trap, multiplicity in
                serializeable.traps.items()
            ]
        }


class DeckSerializer(ModelSerializer[Deck]):

    @classmethod
    def serialize(cls, serializeable: Deck) -> compacted_model:
        return {
            'maindeck': [
                (
                    PrintingSerializer.serialize(printing),
                    multiplicity,
                )
                for printing, multiplicity in
                serializeable.maindeck.items()
            ],
            'sideboard': [
                (
                    PrintingSerializer.serialize(printing),
                    multiplicity,
                )
                for printing, multiplicity in
                serializeable.sideboard.items()
            ],
        }


class InfinitesSerializer(ModelSerializer[Infinites]):

    @classmethod
    def serialize(cls, serializeable: Infinites) -> compacted_model:
        return {
            'cardboards': [
                CardboardSerializer.serialize(cardboard)
                for cardboard in
                serializeable
            ]
        }


class MetaCubeSerializer(ModelSerializer[MetaCube]):

    @classmethod
    def serialize(cls, serializeable: MetaCube) -> compacted_model:
        return {
            'cube': CubeSerializer.serialize(serializeable.cube),
            'nodes': ConstrainedNodesOrpSerializer.serialize(serializeable.node_collection),
            'group_map': GroupMapSerializer.serialize(serializeable.group_map),
            'infinites': InfinitesSerializer.serialize(serializeable.infinites),
        }
