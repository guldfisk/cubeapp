export class LobbyUser {
  username: string
  ready: boolean

  constructor(username: string, ready: boolean) {
    this.username = username;
    this.ready = ready;
  }

  public static fromRemote(remote: any): LobbyUser {
    return new LobbyUser(
      remote.username,
      remote.ready,
    )
  }
}

interface LobbyOptions {
  size: number
  minimumSize: number
  requireReady: boolean
  unreadyOnChange: boolean
}


export class Lobby {
  name: string
  state: string
  lobbyOptions: LobbyOptions
  users: LobbyUser[]
  owner: string
  gameType: string
  key: string | null

  constructor(
    name: string,
    state: string,
    users: LobbyUser[],
    owner: string,
    gameType: string,
    key: string | null,
  ) {
    this.name = name;
    this.state = state;
    this.users = users;
    this.owner = owner;
    this.gameType = gameType;
    this.key = key;
  }

  hasUsername = (username: string): boolean => {
    return this.users.some((user) => user.username === username)
  }

  public static fromRemote(remote: any): Lobby {
    return new Lobby(
      remote.name,
      remote.state,
      remote.users.map((user: any) => LobbyUser.fromRemote(user)),
      remote.owner,
      remote.game_type,
      remote.key,
    )
  }

}
