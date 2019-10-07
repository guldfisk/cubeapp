from mocknames.generate import NameGenerator


def import_path(path: str):
    components = path.split('.')
    mod = __import__(components[0])
    for comp in components[1:]:
        mod = getattr(mod, comp)
    return mod


def get_random_name():
    return NameGenerator().get_name()