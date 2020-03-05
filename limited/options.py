import typing as t

from api.models import CubeRelease
from lobbies.games.options import Option, OptionsValidationError, IntegerOption


class CubeReleaseOption(Option):

    @property
    def default(self) -> t.Any:
        return CubeRelease.objects.order_by(
            'created_at',
        ).values_list('id', flat = True).last()

    def validate(self, value: t.Any) -> t.Any:
        try:
            _release = int(value)
        except ValueError:
            raise OptionsValidationError(f'invalid value "{value}" for {self._name}')
        if not CubeRelease.objects.filter(pk = _release).exists():
            raise OptionsValidationError(f'invalid value "{value}" for {self._name}')
        return _release


class PoolSpecificationOption(Option):

    def __init__(
        self,
        allowed_booster_specifications: t.Mapping[str, t.MutableMapping[str, Option]],
        default_booster_specification: t.Optional[str] = None,
        **kwargs,
    ):
        super().__init__(**kwargs)
        self._allowed_booster_specifications = allowed_booster_specifications
        for booster_specification in self._allowed_booster_specifications.values():
            booster_specification['amount'] = IntegerOption(min = 1, max = 127, default = 1)

        self._default_booster_specification = (
            self._allowed_booster_specifications.keys().__iter__().__next__()
            if default_booster_specification is None else
            default_booster_specification
        )

    @property
    def default(self) -> t.Any:
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

    def validate(self, value: t.Any) -> t.Any:
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

            specification_options = {
                option: specification_options[option].validate(value)
                for option, value in
                specification.items()
                if option in specification_options
            }

            specification_options['type'] = specification_type

            values.append(specification_options)

        return values
