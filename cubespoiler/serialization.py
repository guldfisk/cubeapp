


class SerializerMeta(object):

    def __new__(cls, *args, **kwargs):
        obj = super().__new__()
        print(args, kwargs)
        return obj


class Serializer(metaclass=SerializerMeta):
    pass



class ASerializer(Serializer):
    lol = 1



def test():
    pass


if __name__ == '__main__':
    test()

