from __future__ import annotations

import typing as t

from abc import ABCMeta, abstractmethod

from mtgorp.models.collections.deck import Deck


class _FormatMeta(ABCMeta):
    formats_map: t.MutableMapping[str, Format] = {}

    def __new__(mcs, classname, base_classes, attributes):
        klass = type.__new__(mcs, classname, base_classes, attributes)

        if 'name' in attributes:
            mcs.formats_map[attributes['name']] = klass

        return klass


class Format(object, metaclass = _FormatMeta):
    name: str

    @classmethod
    @abstractmethod
    def deckcheck(cls, deck: Deck) -> t.Tuple[bool, t.List[str]]:
        pass


class Sealed(Format):
    name = 'sealed'

    @classmethod
    def deckcheck(cls, deck: Deck) -> t.Tuple[bool, t.List[str]]:
        errors = []

        if len(deck.maindeck) < 40:
            errors.append(f'deck size {len(deck.maindeck)} below required minimum size 40')

        if not len(deck.sideboard) == 15:
            errors.append(f'sideboard size {len(deck.sideboard)} does not match required 15')

        return not errors, errors
