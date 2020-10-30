from mtgimg.load import Loader


image_loader = Loader(
    printing_executor = 15,
    imageable_executor = 15,
    image_cache_size = 32,
)
