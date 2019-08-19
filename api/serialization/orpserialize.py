import typing as t
from abc import abstractmethod

from mtgorp.models.persistent.card import Card
from mtgorp.models.persistent.cardboard import Cardboard
from mtgorp.models.persistent.expansion import Expansion
from mtgorp.models.persistent.printing import Printing
from mtgorp.models.serilization.serializeable import compacted_model

from magiccube.collections.cube import Cube
from magiccube.collections.nodecollection import NodeCollection, ConstrainedNode
from magiccube.laps.purples.purple import Purple
from magiccube.laps.tickets.ticket import Ticket
from magiccube.laps.traps.trap import Trap
from magiccube.laps.traps.tree.printingtree import PrintingNode
from magiccube.update import cubeupdate


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
            'expansion': ExpansionSerializer.serialize(printing.expansion),
            'cardboard': CardboardSerializer.serialize(printing.cardboard),
        }


class NodeSerializer(ModelSerializer):

    @classmethod
    def serialize(cls, printing_node: PrintingNode) -> compacted_model:
        return {
            'type': printing_node.__class__.__name__,
            'children': [
                (
                    (
                        PrintingSerializer.serialize(
                            child
                        ) if isinstance(child, Printing) else
                        NodeSerializer.serialize(
                            child
                        )
                    ),
                    multiplicity,
                )
                for child, multiplicity in
                printing_node.children.items()
            ],
            'id': printing_node.persistent_hash(),
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
            'value': constrained_node.value,
            'groups': constrained_node.groups,
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
        d = {}

        if any(
            isinstance(serializeable, klass)
            for klass in
            (
                cubeupdate.NewCubeable,
                cubeupdate.RemovedCubeable,
            )
        ):
            if isinstance(serializeable.cubeable, Printing):
                serializer = FullPrintingSerializer
            elif isinstance(serializeable.cubeable, Trap):
                serializer = TrapSerializer
            elif isinstance(serializeable.cubeable, Ticket):
                serializer = TicketSerializer
            elif isinstance(serializeable.cubeable, Purple):
                serializer = PurpleSerializer
            else:
                raise ValueError(serializeable)

            d = {
                'cubeable': serializer.serialize(
                    serializeable.cubeable
                ),
            }

        elif any(
            isinstance(serializeable, klass)
            for klass in
            (
                cubeupdate.NewNode,
                cubeupdate.RemovedNode,
            )
        ):
            d = {
                'node': ConstrainedNodeOrpSerializer.serialize(
                    serializeable.node
                ),
            }

        elif isinstance(serializeable, cubeupdate.PrintingToNode):
            d = {
                'before': FullPrintingSerializer.serialize(
                    serializeable.before
                ),
                'after': ConstrainedNodeOrpSerializer.serialize(
                    serializeable.after
                ),
            }

        elif isinstance(serializeable, cubeupdate.NodeToPrinting):
            d = {
                'before': ConstrainedNodeOrpSerializer.serialize(
                    serializeable.before
                ),
                'after': FullPrintingSerializer.serialize(
                    serializeable.after
                ),
            }

        elif isinstance(serializeable, cubeupdate.AlteredNode):
            d = {
                'before': ConstrainedNodeOrpSerializer.serialize(
                    serializeable.before
                ),
                'after': ConstrainedNodeOrpSerializer.serialize(
                    serializeable.after
                ),
            }

        d['type'] =  serializeable.__class__.__name__.lower()

        return d


class VerboseChangeSerializer(ModelSerializer[cubeupdate.VerboseCubePatch]):

    @classmethod
    def serialize(cls, serializeable: cubeupdate.VerboseCubePatch) -> compacted_model:
        return {
            'changes': [
                [CubeChangeSerializer.serialize(change), multiplicity]
                for change, multiplicity in
                serializeable.changes.items()
            ]
        }