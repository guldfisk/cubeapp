class LobbyException(Exception):
    pass


class CreateLobbyException(LobbyException):
    pass


class JoinLobbyException(LobbyException):
    pass


class ReadyException(LobbyException):
    pass


class StartGameException(LobbyException):
    pass


class SetOptionsException(LobbyException):
    pass
