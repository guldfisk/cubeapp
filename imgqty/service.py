import math
import statistics
import typing as t

import numpy as np
from magiccube.collections.cube import Cube
from magiccube.collections.cubeable import Cubeable
from magiccube.laps.traps.trap import Trap
from scipy import stats


def get_cubeable_image_amount(cubeable: Cubeable) -> int:
    if isinstance(cubeable, Trap):
        return cubeable.node.image_amount
    return 1


def cube_image_sums(cube: Cube) -> t.List[int]:
    return [get_cubeable_image_amount(c) for c in cube.cubeables]


def image_sum_quantity_probability_function(
    image_amount: int,
    cube_size: int,
    pack_size: int,
    average_images: float,
    population_standard_deviation: float,
) -> float:
    return math.e ** (
        -(pack_size * (cube_size - 1) * (image_amount / pack_size - average_images) ** 2)
        / (2 * population_standard_deviation**2 * (cube_size - pack_size))
    ) / (
        math.sqrt(2 * math.pi)
        * math.sqrt((population_standard_deviation**2 * (cube_size - pack_size)) / (pack_size * (cube_size - 1)))
    )


def probability_at_least_images(
    image_amount: int,
    cube_size: int,
    pack_size: int,
    average_images: float,
    population_standard_deviation: float,
) -> float:
    return 1 - stats.norm.cdf(
        ((image_amount / pack_size) - average_images)
        / (
            (population_standard_deviation / math.sqrt(pack_size))
            * math.sqrt((cube_size - pack_size) / (cube_size - 1))
        )
    )


class ImageQtyProbabilityManager(object):
    def __init__(self, cube: Cube, pack_size: int):
        self._cube = cube
        self._pack_size = pack_size
        self._image_sums = cube_image_sums(cube)
        self._average_images = np.average(self._image_sums)
        self._population_standard_deviation = statistics.stdev(self._image_sums)

        self._min_max = None

    @property
    def image_sums(self) -> t.List[int]:
        return self._image_sums

    @property
    def qty_range(self) -> t.Iterator[int]:
        if self._min_max is None:
            sorted_sums = sorted(self._image_sums)
            self._min_max = (sum(sorted_sums[: self._pack_size]), sum(sorted_sums[-self._pack_size :]))
        return range(*self._min_max)

    def image_sum_quantity_probability(self, image_amount: int) -> float:
        return image_sum_quantity_probability_function(
            image_amount=image_amount,
            cube_size=len(self._cube),
            pack_size=self._pack_size,
            average_images=self._average_images,
            population_standard_deviation=self._population_standard_deviation,
        )

    def probability_at_least_images(self, image_amount: int) -> float:
        return probability_at_least_images(
            image_amount=image_amount,
            cube_size=len(self._cube),
            pack_size=self._pack_size,
            average_images=self._average_images,
            population_standard_deviation=self._population_standard_deviation,
        )
