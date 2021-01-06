import typing as t

from django.conf import settings

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import sessionmaker, scoped_session, Session

from orp.alchemy import patch_alchemy

from mtgorp.db.load import PickleLoader, SqlLoader


class SqlContext(object):
    engine: Engine
    scoped_session: t.Callable[[], Session]

    @classmethod
    def init(cls):
        if getattr(cls, 'engine', None) is not None:
            return

        uri = '{dialect}+{driver}://{username}:{password}@{host}/{database}?charset=utf8'.format(
            dialect = 'mysql',
            driver = 'mysqldb',
            username = 'phdk',
            password = settings.DATABASE_PASSWORD,
            host = settings.DATABASE_HOST,
            database = 'mtg',
        )

        cls.engine = create_engine(
            uri,
            pool_size = 64,
            max_overflow = 32,
        )

        session_factory = sessionmaker(bind = cls.engine)
        cls.scoped_session = scoped_session(session_factory)
        patch_alchemy(cls.scoped_session)


if settings.USE_PICKLE_DB:
    db = PickleLoader().load()
else:
    SqlContext.init()
    db = SqlLoader(SqlContext.engine, SqlContext.scoped_session).load()
