import typing as t

from mtgorp.models.collections.cardboardset import CardboardSet
from mtgorp.models.persistent.attributes.expansiontype import ExpansionType
from mtgorp.models.persistent.expansion import Expansion

from api.models import CubeRelease
from lobbies.games.options import Option, OptionsValidationError, IntegerOption
from mtgorp.models.serilization.strategies.jsonid import JsonId
from mtgorp.models.serilization.strategies.raw import RawStrategy
from resources.staticdb import db
from limited.models import PoolSpecificationOptions


class ExpansionOption(Option[Expansion]):

    @property
    def default(self) -> Expansion:
        return max(db.expansions.values(), key = lambda e: e.release_date).code

    def validate(self, value: t.Any) -> Expansion:
        expansion = db.expansions.get(value)
        if expansion is None or expansion.expansion_type != ExpansionType.SET:
            OptionsValidationError(f'invalid value "{value}" for {self._name}')
        return value


class CubeReleaseOption(Option[int]):

    @property
    def default(self) -> int:
        return CubeRelease.objects.select_related(
            'versioned_cube',
        ).filter(
            versioned_cube__active = True,
        ).order_by(
            'created_at',
        ).values_list(
            'id',
            flat = True,
        ).last()

    def validate(self, value: t.Any) -> int:
        try:
            _release = int(value)
        except ValueError:
            raise OptionsValidationError(f'invalid value "{value}" for {self._name}')
        if not CubeRelease.objects.filter(pk = _release).exists():
            raise OptionsValidationError(f'invalid value "{value}" for {self._name}')
        return _release


class PoolSpecificationOption(Option[PoolSpecificationOptions]):

    def __init__(
        self,
        allowed_booster_specifications: t.Mapping[str, t.MutableMapping[str, Option]],
        default_booster_specification: t.Optional[str] = None,
        default_amount: int = 1,
        **kwargs,
    ):
        super().__init__(**kwargs)
        self._allowed_booster_specifications = allowed_booster_specifications

        for booster_specification in self._allowed_booster_specifications.values():
            booster_specification['amount'] = IntegerOption(min = 1, max = 127, default = default_amount)

        for booster_options in self._allowed_booster_specifications.values():
            for name, option in booster_options.items():
                if option._name is None:
                    option._name = name

        self._default_booster_specification = (
            self._allowed_booster_specifications.keys().__iter__().__next__()
            if default_booster_specification is None else
            default_booster_specification
        )

    @property
    def default(self) -> PoolSpecificationOptions:
        return [
            {
                'type': self._default_booster_specification,
                **{
                    key: option.default
                    for key, option in
                    self._allowed_booster_specifications[self._default_booster_specification].items()
                }
            }
        ]

    def validate(self, value: t.Any) -> PoolSpecificationOptions:
        if not value:
            raise OptionsValidationError(
                f'invalid value for {self._name}: must have at least one booster specification'
            )

        if not isinstance(value, t.Sequence):
            raise OptionsValidationError(f'invalid value for {self._name}: options must be a sequence')

        values = []

        for specification in value:
            if not isinstance(specification, t.Mapping):
                raise OptionsValidationError(f'invalid value for {self._name}: specification options must be a mapping')

            specification_type = specification.get('type')
            specification_options = self._allowed_booster_specifications.get(specification_type)
            if specification_options is None:
                raise OptionsValidationError(
                    f'invalid value for {self._name}: invalid specification type "{specification_type}'
                )

            if not specification.keys() >= specification_options.keys():
                raise OptionsValidationError(f'invalid value for {self._name}: missing keys')

            specification_options = {
                option: specification_options[option].validate(value)
                for option, value in
                specification.items()
                if option in specification_options
            }

            specification_options['type'] = specification_type

            values.append(specification_options)

        return values


class CardboardSetOption(Option[t.Mapping[str, t.Any]]):

    def validate(self, value: t.Any) -> t.Mapping[str, t.Any]:
        try:
            RawStrategy(db).deserialize(CardboardSet, value)
        except Exception:
            raise OptionsValidationError('Invalid cardboard set')

        return value
