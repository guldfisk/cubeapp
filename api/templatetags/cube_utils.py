from django import template

from magiccube.collections.cubeable import Cubeable
from magiccube.laps.traps.trap import Trap

from mtgimg.interface import SizeSlug


register = template.Library()


@register.simple_tag
def cubeable_image_link(cubeable: Cubeable, size_slug: SizeSlug = SizeSlug.MEDIUM) -> str:
    return 'http://prohunterdogkeeper.dk/images/{}{}{}.png'.format(
        '_cube_traps/' if isinstance(cubeable, Trap) else '',
        cubeable.id,
        '_' + size_slug.code if size_slug.code else '',
    )
