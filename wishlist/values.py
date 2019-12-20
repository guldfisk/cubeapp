from enum import Enum
from functools import total_ordering


@total_ordering
class Condition(Enum):
    MINT = 'MT'
    NEAR_MINT = 'NM'
    EXCELLENT = 'EX'
    GOOD = 'GD'
    LIGHT_PLAYED = 'LP'
    PLAYED = 'PL'
    POOR = 'PO'

    def __le__(self, other) -> bool:
        return (
            _CONDITION_VALUE_MAP[self]
            < _CONDITION_VALUE_MAP[other]
        )


_CONDITION_VALUE_MAP = {
    condition: value
    for value, condition in
    enumerate(
        reversed(
            list(
                Condition.__iter__()
            )
        )
    )
}


class Language(Enum):
    ENGLISH = 1
    FRENCH = 2
    GERMAN = 3
    SPANISH = 4
    ITALIAN = 5
    SIMPLIFIED_CHINESE = 6
    JAPANESE = 7
    PORTUGUESE = 8
    RUSSIAN = 9
    KOREAN = 10
    TRADITIONAL_CHINESE = 11
