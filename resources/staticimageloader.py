from django.conf import settings
from mtgimg.load import Loader


image_loader = Loader(
    printing_executor=15,
    imageable_executor=15,
    image_cache_size=None if not settings.IMAGE_CACHE_SIZE else settings.IMAGE_CACHE_SIZE,
)
