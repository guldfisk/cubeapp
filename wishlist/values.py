from enum import Enum
from functools import total_ordering


@total_ordering
class Condition(Enum):
    MINT = 0
    NEAR_MINT = 1
    EXCELLENT = 2
    GOOD = 3
    LIGHT_PLAYED = 4
    PLAYED = 5
    POOR = 6

    def __le__(self, other) -> bool:
        return self.value < other.value


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
