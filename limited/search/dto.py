from __future__ import annotations

import functools
import operator
import typing as t

import dataclasses
from abc import ABC, abstractmethod

from django.contrib.contenttypes.models import ContentType
from django.db.models import Q, OuterRef, Exists, Subquery, QuerySet

from mtgorp.db.database import CardDatabase
from mtgorp.models.interfaces import Printing
from mtgorp.tools.search.pattern import Pattern

from api.models import RelatedPrinting
from limited.models import PoolDeck


@dataclasses.dataclass()
class DeckSearchDTO(object):
    node: DeckSearchNode

    def freeze(self, db: CardDatabase) -> FrozenDeckSearch:
        context = FreezeContext(db)
        return FrozenDeckSearch(self.node.to_filter(context), context.annotations)


class FreezeContext(object):

    def __init__(self, db: CardDatabase):
        self._db = db
        self.annotations = {}

    def get_annotation(self, pattern: Pattern[Printing]) -> str:
        key = f'printing_match_{len(self.annotations)}'
        self.annotations[key] = Exists(
            RelatedPrinting.objects.filter(
                printing_id__in = [
                    p.id
                    for p in
                    self._db.printings.values()
                    if pattern.match(p)
                ],
                related_object_id = OuterRef('pk'),
                related_content_type = ContentType.objects.get_for_model(PoolDeck),
            )
        )
        return key


class FrozenDeckSearch(object):

    def __init__(self, node: Q, printing_annotations: t.Mapping[str, Subquery]):
        self._node = node
        self._annotations = printing_annotations

    def filter(self, qs: QuerySet) -> QuerySet:
        return qs.annotate(**self._annotations).filter(self._node)


@dataclasses.dataclass()
class Operator(object):
    filter: str
    explain: str


EXACT = Operator(filter = 'iexact', explain = 'is')
CONTAINS = Operator(filter = 'icontains', explain = 'contains')

EQUALS = Operator(filter = 'exact', explain = 'equals')
LESS_THAN = Operator(filter = 'lt', explain = 'less than')
LESS_THAN_EQUALS = Operator(filter = 'lte', explain = 'no more than')
GREATER_THAN = Operator(filter = 'gt', explain = 'greater than')
GREATER_THAN_EQUALS = Operator(filter = 'gte', explain = 'at least')


class DeckSearchNode(ABC):

    @abstractmethod
    def to_filter(self, context: FreezeContext) -> Q:
        pass

    @abstractmethod
    def explain(self) -> str:
        pass


@dataclasses.dataclass()
class ParenthesisNode(DeckSearchNode):
    child: DeckSearchNode

    def to_filter(self, context: FreezeContext) -> Q:
        return self.child.to_filter(context)

    def explain(self) -> str:
        return f'({self.child.explain()})'


@dataclasses.dataclass()
class NotNode(DeckSearchNode):
    child: DeckSearchNode

    def to_filter(self, context: FreezeContext) -> Q:
        return ~self.child.to_filter(context)

    def explain(self) -> str:
        return f'not {self.child.explain()}'


@dataclasses.dataclass()
class AndNode(DeckSearchNode):
    children: t.Collection[DeckSearchNode]

    def to_filter(self, context: FreezeContext) -> Q:
        return functools.reduce(operator.and_, (child.to_filter(context) for child in self.children))

    def explain(self) -> str:
        return ' and '.join(child.explain() for child in self.children)


@dataclasses.dataclass()
class OrNode(DeckSearchNode):
    children: t.Collection[DeckSearchNode]

    def to_filter(self, context: FreezeContext) -> Q:
        return functools.reduce(operator.or_, (child.to_filter(context) for child in self.children))

    def explain(self) -> str:
        return ' or '.join(child.explain() for child in self.children)


@dataclasses.dataclass()
class CreatorNode(DeckSearchNode):
    value: str
    operator: Operator

    def to_filter(self, context: FreezeContext) -> Q:
        return Q(**{'pool__user__username__' + self.operator.filter: self.value})

    def explain(self) -> str:
        return f'creators name {self.operator.explain} "{self.value}"'


@dataclasses.dataclass()
class NameNode(DeckSearchNode):
    value: str
    operator: Operator

    def to_filter(self, context: FreezeContext) -> Q:
        return Q(**{'name__' + self.operator.filter: self.value})

    def explain(self) -> str:
        return f'name {self.operator.explain} "{self.value}"'


@dataclasses.dataclass()
class WinNode(DeckSearchNode):
    value: int
    operator: Operator

    def to_filter(self, context: FreezeContext) -> Q:
        return Q(**{'win_record__' + self.operator.filter: self.value})

    def explain(self) -> str:
        return f'wins {self.operator.explain} {self.value}'


@dataclasses.dataclass()
class LossNode(DeckSearchNode):
    value: int
    operator: Operator

    def to_filter(self, context: FreezeContext) -> Q:
        return Q(**{'loss_record__' + self.operator.filter: self.value})

    def explain(self) -> str:
        return f'loss {self.operator.explain} {self.value}'


@dataclasses.dataclass()
class DrawNode(DeckSearchNode):
    value: int
    operator: Operator

    def to_filter(self, context: FreezeContext) -> Q:
        return Q(**{'draw_record__' + self.operator.filter: self.value})

    def explain(self) -> str:
        return f'draw {self.operator.explain} {self.value}'


@dataclasses.dataclass()
class PrintingNode(DeckSearchNode):
    pattern: Pattern[Printing]

    def to_filter(self, context: FreezeContext) -> Q:
        return Q(**{context.get_annotation(self.pattern): True})

    def explain(self) -> str:
        return f'contains a printing matching ({self.pattern.matchable.explain()})'


@dataclasses.dataclass()
class CubeNode(DeckSearchNode):
    value: t.Union[int, str]
    operator: Operator

    def to_filter(self, context: FreezeContext) -> Q:
        if self.operator == EXACT:
            return Q(tournament_entries__tournament__limited_session__pool_specification__specifications__release__versioned_cube_id = self.value)
        return Q(tournament_entries__tournament__limited_session__pool_specification__specifications__release__versioned_cube__name__icontains = self.value)

    def explain(self) -> str:
        return f'cube has id {self.value}' if self.operator == EXACT else f'cube name contains "{self.value}"'
