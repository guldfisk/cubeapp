import axios from 'axios';

import {Counter, MultiplicityList} from "./utils";
import store from '../state/store';
import wu from 'wu';


export const apiPath = '/api/';


export class Atomic {
  id: string;

  constructor(id: string) {
    this.id = id
  }

  public static fromRemote(remote: any): Atomic {
    return new Atomic('0')
  }

}


export class Cubeable extends Atomic {

  getType = (): string => {
    return 'Cubeable';
  };

  getSortValue = (): string => {
    return '';
  };

}


export class Expansion extends Atomic {
  code: string;
  name: string;

  constructor(id: string, code: string, name: string) {
    super(id);
    this.code = code;
    this.name = name;
  }

  public static fromRemote(remote: any): Expansion {
    return new Expansion(remote.id, remote.code, remote.name)
  }

}


export class Printing extends Cubeable {
  name: string;
  expansion: Expansion;
  color: string[];
  types: string[];

  constructor(id: string, name: string, expansion: Expansion, color: string[], types: string[]) {
    super(id);
    this.name = name;
    this.expansion = expansion;
    this.color = color;
    this.types = types;
  }

  public static fromRemote(remote: any): Printing {
    return new Printing(
      remote.id,
      remote.name,
      Expansion.fromRemote(remote.expansion),
      remote.color,
      remote.types,
    )
  }

  getType = (): string => {
    return 'Printing'
  };

  getSortValue = (): string => {
    return this.name;
  };

  full_name = (): string => {
    return this.name + '|' + this.expansion.code;
  };

}


export class PrintingNode extends Atomic {
  children: MultiplicityList<Printing | PrintingNode>;
  type: string;

  constructor(id: string, children: MultiplicityList<Printing | PrintingNode>, type: string) {
    super(id);
    this.children = children;
    this.type = type;
  }

  public static fromRemote(remote: any): PrintingNode {
    return new PrintingNode(
      remote.id,
      new MultiplicityList(
        remote.children.map(
          ([child, multiplicity]: [any, number]) => [
            child.type === 'printing' ? Printing.fromRemote(child) : PrintingNode.fromRemote(child),
            multiplicity,
          ]
        )
      ),
      remote.type
    )
  };

  * printings(): IterableIterator<Printing> {
    for (const [child, multiplicity] of this.children.items) {
      for (let i = 0; i < multiplicity; i++) {
        if (child instanceof Printing) {
          yield child
        } else {
          yield* (child as PrintingNode).printings()
        }
      }
    }
  };

  representation = (): string => {
    return '(' + this.children.items.map(
      ([child, multiplicity]: [Printing | PrintingNode, number]) =>
        (multiplicity == 1 ? "" : multiplicity.toString() + "# ")
        + (child instanceof Printing ? child.full_name() : child.representation())
    ).join(
      this.type === 'AllNode' ? '; ' : ' || '
    ) + ')'
  };

  serialize = (): any => {
    return {
      type: this.type,
      options: this.children.items.map(
        ([child, multiplicity]) => [
          child instanceof Printing ? child.id : child.serialize(),
          multiplicity,
        ]
      )
    }
  };

}


export class Trap extends Cubeable {
  node: PrintingNode;
  intentionType: string;

  constructor(id: string, node: PrintingNode, intentionType: string) {
    super(id);
    this.node = node;
    this.intentionType = intentionType;
  }

  public static fromRemote(remote: any): Trap {
    return new Trap(
      remote.id,
      PrintingNode.fromRemote(remote.node),
      remote.intention_type,
    )
  }

  getType = (): string => {
    return 'Trap';
  };

  getSortValue = (): string => {
    return this.node.representation();
  };

  serialize = (): any => {
    return {
      node: this.node.serialize(),
      intention_type: this.intentionType,
    }
  };

  public static parse(query: string): any {
    return axios.post(
      apiPath + 'service/parse-trap/',
      {
        query: query,
        intention_type: 'SYNERGY'
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${store.getState().token}`,
        }
      },
    ).then(
      response => Trap.fromRemote(response.data)
    )
  }

}


export class TrapCollection {
  traps: Counter<Trap>;

  constructor(traps: Counter<Trap>) {
    this.traps = traps;
  }

  public static fromRemote(remote: any): TrapCollection {
    return new TrapCollection(
      new Counter(
        remote.traps.map(
          ([trap, multiplicity]: [any, number]) => [Trap.fromRemote(trap), multiplicity]
        )
      )
    )
  }

}


export class DistributionPossibility extends Atomic {
  createdAt: string;
  pdfUrl: null | string;
  trapCollection: TrapCollection;
  fitness: number;

  constructor(
    id: string,
    createdAt: string,
    pdfUrl: null | string,
    trapCollection: TrapCollection,
    fitness: number,
  ) {
    super(id);
    this.createdAt = createdAt;
    this.pdfUrl = pdfUrl;
    this.trapCollection = trapCollection;
    this.fitness = fitness;
  }

  public static fromRemote(remote: any): DistributionPossibility {
    return new DistributionPossibility(
      remote.id,
      remote.created_at,
      remote.pdf_url,
      TrapCollection.fromRemote(
        remote.trap_collection
      ),
      remote.fitness,
    )
  }

}


export class Ticket extends Cubeable {
  name: string;

  public static fromRemote(remote: any): Ticket {
    return new Purple(remote.id, remote.name)
  }

  getType = (): string => {
    return 'Ticket';
  };

  getSortValue = (): string => {
    return 'Ticket';
  };

}


export class Purple extends Cubeable {
  name: string;

  constructor(id: string, name: string) {
    super(id);
    this.name = name;
  }

  public static fromRemote(remote: any): Purple {
    return new Purple(remote.id, remote.name)
  }

  getType = (): string => {
    return 'Purple';
  };

  getSortValue = (): string => {
    return 'Purple';
  };

}


export class User extends Atomic {
  username: string;

  constructor(id: string, username: string) {
    super(id);
    this.username = username;
  }

  public static fromRemote(remote: any): User {
    return new User(remote.id, remote.username)
  }

  static all = (): Promise<User[]> => {
    // TODO pagination lol
    return axios.get(
      apiPath + 'users/'
    ).then(
      response => response.data.results.map(
        (user: any) => User.fromRemote(user)
      )
    )
  };

  static get = (id: string): Promise<User> => {
    return axios.get(
      apiPath + 'users/' + id + '/'
    ).then(
      response => User.fromRemote(response.data)
    )
  };

}


export class MinimalCube extends Atomic {
  name: string;
  description: string;
  author: User;
  createdAt: string;

  constructor(id: string, name: string, description: string, author: User, createdAt: string) {
    super(id);
    this.name = name;
    this.description = description;
    this.author = author;
    this.createdAt = createdAt;
  }

  public static fromRemote(remote: any): MinimalCube {
    return new MinimalCube(
      remote.id,
      remote.name,
      remote.description,
      User.fromRemote(remote.author),
      remote.created_at,
    )
  }

}


interface PaginationResponse<T> {
  objects: T[]
  hits: number
}


export class Cube extends MinimalCube {
  releases: CubeReleaseMeta[];

  constructor(
    id: string,
    name: string,
    description: string,
    author: User,
    createdAt: string,
    releases: CubeReleaseMeta[],
  ) {
    super(id, name, description, author, createdAt);
    this.releases = releases;
  }

  public static fromRemote(remote: any) {
    return new Cube(
      remote.id,
      remote.name,
      remote.description,
      User.fromRemote(remote.author),
      remote.created_at,
      remote.releases.map(
        (release: any) => CubeReleaseMeta.fromRemote(release)
      )
    )
  }

  latestRelease = (): (CubeReleaseMeta | null) => {
    if (this.releases.length < 1) {
      return null;
    }
    return this.releases[0];
  };

  static all = (offset: number = 0, limit: number = 50): Promise<PaginationResponse<Cube>> => {
    return axios.get(
      apiPath + 'versioned-cubes/',
      {
        params: {
          offset,
          limit,
        }
      },
    ).then(
      response => {
        return {
          objects: response.data.results.map(
            (cube: any) => Cube.fromRemote(cube)
          ),
          hits: response.data.count,
        }
      }
    )
  };

  static get = (id: string): Promise<Cube> => {
    return axios.get(
      apiPath + 'versioned-cubes/' + id + '/'
    ).then(
      response => Cube.fromRemote(response.data)
    )
  };

}


export class CubeReleaseMeta extends Atomic {
  name: string;
  createdAt: string;
  createAtTimestamp: number;
  intendedSize: string;

  constructor(id: string, name: string, createdAt: string, intendedSize: string) {
    super(id);
    this.name = name;
    this.createdAt = createdAt;
    this.createAtTimestamp = Date.parse(createdAt);
    this.intendedSize = intendedSize;
  };

  public static fromRemote(remote: any): CubeReleaseMeta {
    return new CubeReleaseMeta(
      remote.id,
      remote.name,
      remote.created_at,
      remote.intended_size,
    )
  };

}


export class PrintingCounter extends Counter<Printing> {

  public static collectFromIterable<T>(printings: IterableIterator<Printing>): PrintingCounter {
    const counter: PrintingCounter = new PrintingCounter();
    for (const printing of printings) {
      counter.add(printing);
    }
    return counter;
  }

  printings_of_color = (color: string): wu.WuIterable<[Printing, number]> => {
    return wu(this.items()).filter(
      ([printing, _]: [Printing, number]) =>
        !printing.types.includes('Land')
        && printing.color.length === 1
        && printing.color[0] === color
    )
  };

  gold_printings = (): wu.WuIterable<[Printing, number]> => {
    return wu(this.items()).filter(
      ([printing, _]: [Printing, number]) =>
        !printing.types.includes('Land')
        && printing.color.length > 1
    )
  };

  colorless_printings = (): wu.WuIterable<[Printing, number]> => {
    return wu(this.items()).filter(
      ([printing, _]: [Printing, number]) =>
        !printing.types.includes('Land')
        && printing.color.length === 0
    )
  };

  land_printings = (): wu.WuIterable<[Printing, number]> => {
    return wu(this.items()).filter(
      ([printing, _]: [Printing, number]) =>
        printing.types.includes('Land')
    )
  };

  grouped_printings = (): IterableIterator<[Printing, number]>[] => {
    return [
      this.printings_of_color('W'),
      this.printings_of_color('U'),
      this.printings_of_color('B'),
      this.printings_of_color('R'),
      this.printings_of_color('G'),
      this.gold_printings(),
      this.colorless_printings(),
      this.land_printings(),
    ]
  };

}


// export class PrintingCollection extends MultiplicityList<Printing> {
//
//   constructor(items: [Printing, number][] = []) {
//     super(items);
//     this.items.sort(
//       alphabeticalPropertySortMethodFactory(
//         ([printing, _]: [Printing, number]) => printing.name.toString()
//       )
//     );
//   }
//
//   public static collectFromIterable<T>(printings: IterableIterator<Printing>): PrintingCollection {
//     let collector: Record<string, [Printing, number]> = {};
//     for (const printing of printings) {
//       let key = printing.id.toString();
//       if (collector[key] === undefined) {
//         collector[key] = [printing, 1]
//       } else {
//         collector[key][1] += 1
//       }
//     }
//     return new PrintingCollection(
//       Object.values(collector)
//     )
//   }
//
//   printings_of_color = (color: string): [Printing, number][] => {
//     return this.items.filter(
//       ([printing, _]: [Printing, number]) =>
//         !printing.types.includes('Land')
//         && printing.color.length === 1
//         && printing.color[0] === color
//     )
//   };
//
//   gold_printings = (): [Printing, number][] => {
//     return this.items.filter(
//       ([printing, _]: [Printing, number]) =>
//         !printing.types.includes('Land')
//         && printing.color.length > 1
//     )
//   };
//
//   colorless_printings = (): [Printing, number][] => {
//     return this.items.filter(
//       ([printing, _]: [Printing, number]) =>
//         !printing.types.includes('Land')
//         && printing.color.length === 0
//     )
//   };
//
//   land_printings = (): [Printing, number][] => {
//     return this.items.filter(
//       ([printing, _]: [Printing, number]) =>
//         printing.types.includes('Land')
//     )
//   };
//
//   grouped_printings = (): [Printing, number][][] => {
//     return [
//       this.printings_of_color('W'),
//       this.printings_of_color('U'),
//       this.printings_of_color('B'),
//       this.printings_of_color('R'),
//       this.printings_of_color('G'),
//       this.gold_printings(),
//       this.colorless_printings(),
//       this.land_printings(),
//     ]
//   };
//
// }


export class CubeablesContainer {
  printings: PrintingCounter;
  traps: Counter<Trap>;
  tickets: Counter<Ticket>;
  purples: Counter<Purple>;

  constructor(
    printings: PrintingCounter,
    traps: Counter<Trap>,
    tickets: Counter<Ticket>,
    purples: Counter<Purple>,
  ) {
    this.printings = printings;
    this.traps = traps;
    this.tickets = tickets;
    this.purples = purples;
  }

  public static fromRemote(remote: any): CubeablesContainer {
    return new CubeablesContainer(
      new PrintingCounter(
        remote.printings.map(
          ([printing, multiplicity]: [Trap, number]) => [Printing.fromRemote(printing), multiplicity]
        )
      ),
      new Counter(
        remote.traps.map(
          ([trap, multiplicity]: [Trap, number]) => [Trap.fromRemote(trap), multiplicity]
        )
      ),
      new Counter(
        remote.tickets.map(
          ([ticket, multiplicity]: [Trap, number]) => [Ticket.fromRemote(ticket), multiplicity]
        )
      ),
      new Counter(
        remote.purples.map(
          ([purple, multiplicity]: [Trap, number]) => [Purple.fromRemote(purple), multiplicity]
        )
      ),
    )
  }

  * allPrintings(): IterableIterator<Printing> {
    yield* this.printings.iter();
    for (const trap of this.traps.iter()) {
      yield* trap.node.printings()
    }
  };

  * laps(): IterableIterator<[Cubeable, number]> {
    yield* this.traps.items();
    yield* this.tickets.items();
    yield* this.purples.items();
  };

  * cubeables(): IterableIterator<[Cubeable, number]> {
    yield* this.printings.items();
    yield* this.laps();
  };

  * allCubeables(): IterableIterator<Cubeable> {
    yield* this.printings.iter();
    yield* this.traps.iter();
    yield* this.tickets.iter();
    yield* this.purples.iter();
  };

  traps_of_intention_types = (intention_types: string[]): wu.WuIterable<[Trap, number]> => {
    return wu(this.traps.items()).filter(
      ([trap, multiplicity]: [Trap, number]) => intention_types.includes(trap.intentionType)
    )
  };

  grouped_laps = (): IterableIterator<[Cubeable, number]>[] => {
    return [
      this.traps_of_intention_types(['GARBAGE']),
      this.traps_of_intention_types(['SYNERGY', 'NO_INTENTION']),
      this.traps_of_intention_types(['OR']),
      this.tickets.items(),
      this.purples.items(),
    ]
  };

  grouped_cubeables = (): IterableIterator<[Cubeable, number]>[] => {
    return (
      this.printings.grouped_printings() as IterableIterator<[Cubeable, number]>[]
    ).concat(
      this.grouped_laps(),
    )
  };

}


export class CubeRelease extends CubeReleaseMeta {
  cube: MinimalCube;
  cubeablesContainer: CubeablesContainer;
  constrainedNodes: ConstrainedNodes | null;

  constructor(
    id: string,
    name: string,
    createdAt: string,
    intendedSize: string,
    cube: MinimalCube,
    cubeablesContainer: CubeablesContainer,
    constrainedNodes: ConstrainedNodes | null,
  ) {
    super(id, name, createdAt, intendedSize);
    this.cube = cube;
    this.constrainedNodes = constrainedNodes;
    this.cubeablesContainer = cubeablesContainer;
  }

  public static fromRemote(remote: any) {
    return new CubeRelease(
      remote.id,
      remote.name,
      remote.created_at,
      remote.intended_size,
      MinimalCube.fromRemote(remote.versioned_cube),
      CubeablesContainer.fromRemote(remote.cube),
      remote.constrained_nodes ?
        new ConstrainedNodes(remote.constrained_nodes.constrained_nodes.nodes)
        : null,
    )
  }

  public static compare = (from_id: number, to_id: number): Promise<[Patch, VerbosePatch, string | null]> => {
    return axios.get(
      apiPath + 'cube-releases/' + to_id + '/delta-from/' + from_id + '/'
    ).then(
      response => [
        Patch.fromRemote(response.data.patch),
        VerbosePatch.fromRemote(response.data.verbose_patch),
        response.data.pdf_url,
      ]
    )
  };

  public static all = (): Promise<CubeRelease[]> => {
    // TODO pagination lol
    return axios.get(
      apiPath + 'cube-releases/'
    ).then(
      response => response.data.results.map(
        (release: any) => CubeRelease.fromRemote(release)
      )
    )
  };

  public static get = (id: string): Promise<CubeRelease> => {
    return axios.get(
      apiPath + 'cube-releases/' + id + '/'
    ).then(
      response => CubeRelease.fromRemote(response.data)
    )
  };

  filter = (query: string, flattened: boolean = false): Promise<CubeablesContainer> => {
    return axios.get(
      apiPath + 'cube-releases/' + this.id + '/filter/',
      {
        params: {
          query,
          flattened,
        }
      }
    ).then(
      response => CubeablesContainer.fromRemote(response.data)
    )
  }

}


export class Preview {
  cubeables: CubeablesContainer;
  constrainedNodes: ConstrainedNodes;
  groupMap: GroupMap;

  constructor(cubeables: CubeablesContainer, constrainedNodes: ConstrainedNodes, groupMap: GroupMap) {
    this.cubeables = cubeables;
    this.constrainedNodes = constrainedNodes;
    this.groupMap = groupMap;
  }

  public static fromRemote(remote: any): Preview {
    return new Preview(
      CubeablesContainer.fromRemote(remote.cube),
      new ConstrainedNodes(remote.nodes.constrained_nodes.nodes),
      GroupMap.fromRemote(remote.group_map),
    )
  }

}


export class Patch {
  positiveCubeablesContainer: CubeablesContainer;
  negativeCubeablesContainer: CubeablesContainer;
  positiveConstrainedNodes: ConstrainedNodes;
  negativeConstrainedNodes: ConstrainedNodes;

  constructor(
    positiveCubeablesContainer: CubeablesContainer,
    negativeCubeablesContainer: CubeablesContainer,
    positiveConstrainedNodes: ConstrainedNodes,
    negativeConstrainedNodes: ConstrainedNodes,
  ) {
    this.positiveCubeablesContainer = positiveCubeablesContainer;
    this.negativeCubeablesContainer = negativeCubeablesContainer;
    this.positiveConstrainedNodes = positiveConstrainedNodes;
    this.negativeConstrainedNodes = negativeConstrainedNodes;
  }

  public static fromRemote(remote: any): Patch {
    return new Patch(
      new CubeablesContainer(
        new PrintingCounter(
          remote.cube_delta.printings.filter(
            ([cubeable, multiplicity]: [any, number]) => multiplicity > 0
          ).map(
            ([printing, multiplicity]: [any, number]) => [Printing.fromRemote(printing), multiplicity]
          )
        ),
        new Counter(
          remote.cube_delta.traps.filter(
            ([cubeable, multiplicity]: [any, number]) => multiplicity > 0
          ).map(
            ([trap, multiplicity]: [any, number]) => [Trap.fromRemote(trap), multiplicity]
          )
        ),
        new Counter(
          remote.cube_delta.tickets.filter(
            ([cubeable, multiplicity]: [any, number]) => multiplicity > 0
          ).map(
            ([ticket, multiplicity]: [any, number]) => [Ticket.fromRemote(ticket), multiplicity]
          )
        ),
        new Counter(
          remote.cube_delta.purples.filter(
            ([cubeable, multiplicity]: [any, number]) => multiplicity > 0
          ).map(
            ([purple, multiplicity]: [any, number]) => [Purple.fromRemote(purple), multiplicity]
          )
        ),
      ),
      new CubeablesContainer(
        new PrintingCounter(
          remote.cube_delta.printings.filter(
            ([cubeable, multiplicity]: [any, number]) => multiplicity < 0
          ).map(
            ([printing, multiplicity]: [any, number]) => [Printing.fromRemote(printing), multiplicity]
          )
        ),
        new Counter(
          remote.cube_delta.traps.filter(
            ([cubeable, multiplicity]: [any, number]) => multiplicity < 0
          ).map(
            ([trap, multiplicity]: [any, number]) => [Trap.fromRemote(trap), multiplicity]
          )
        ),
        new Counter(
          remote.cube_delta.tickets.filter(
            ([cubeable, multiplicity]: [any, number]) => multiplicity < 0
          ).map(
            ([ticket, multiplicity]: [any, number]) => [Ticket.fromRemote(ticket), multiplicity]
          )
        ),
        new Counter(
          remote.cube_delta.purples.filter(
            ([cubeable, multiplicity]: [any, number]) => multiplicity < 0
          ).map(
            ([purple, multiplicity]: [any, number]) => [Purple.fromRemote(purple), multiplicity]
          )
        ),
      ),
      new ConstrainedNodes(
        remote.node_delta.filter(
          ([node, multiplicity]: [any, number]) => multiplicity > 0
        )
      ),
      new ConstrainedNodes(
        remote.node_delta.filter(
          ([node, multiplicity]: [any, number]) => multiplicity < 0
        )
      ),
    );
  }
}


export class ReleasePatch extends Atomic {
  author: User;
  cube: MinimalCube;
  description: string;
  createdAt: string;
  patch: Patch;
  name: string;

  constructor(
    id: string,
    author: User,
    cube: MinimalCube,
    description: string,
    createdAt: string,
    patch: Patch,
    name: string,
  ) {
    super(id);
    this.author = author;
    this.cube = cube;
    this.description = description;
    this.createdAt = createdAt;
    this.patch = patch;
    this.name = name;
  }

  public static fromRemote(remote: any): ReleasePatch {
    return new ReleasePatch(
      remote.id,
      User.fromRemote(remote.author),
      MinimalCube.fromRemote(remote.versioned_cube),
      remote.description,
      remote.created_at,
      Patch.fromRemote(remote.patch),
      remote.name,
    );
  }

  private static getUpdateJSON(updates: [Cubeable | ConstrainedNode | CubeChange | string, number][]): any {
    let cubeDelta: { printings: [any, number][], traps: [any, number][] } = {
      printings: [],
      traps: [],
    };
    let nodeDelta: any = {nodes: []};
    let groupDelta: { groups: [string, number][] } = {groups: []};

    let changeUndoes: [any, number][] = [];

    for (const [update, multiplicity] of updates) {

      if (update instanceof Printing) {
        cubeDelta.printings.push(
          [
            update.id,
            multiplicity,
          ]
        );
      } else if (update instanceof Trap) {
        cubeDelta.traps.push(
          [
            update.serialize(),
            multiplicity,
          ]
        );
      } else if (update instanceof ConstrainedNode) {
        nodeDelta.nodes.push(
          [
            update.serialize(),
            multiplicity,
          ]
        );
      } else if (update instanceof CubeChange) {
        changeUndoes.push(
          [
            update.serialize(),
            multiplicity,
          ]
        )
      } else if (typeof update == 'string') {
        groupDelta.groups.push(
          [
            update,
            multiplicity,
          ]
        )
      }

    }

    return {
      update: {
        cube_delta: cubeDelta,
        nodes_delta: nodeDelta,
        groups_delta: groupDelta,
      },
      change_undoes: changeUndoes,
    };
  };

  update = (updates: [Cubeable | ConstrainedNode | CubeChange | string, number][]): Promise<ReleasePatch> => {
    return axios.patch(
      apiPath + 'patches/' + this.id + '/',
      ReleasePatch.getUpdateJSON(updates),
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${store.getState().token}`,
        }
      },
    ).then(
      response => ReleasePatch.fromRemote(response.data)
    )
  };

  public static updateWebsocket(
    connection: WebSocket,
    updates: [Cubeable | ConstrainedNode | CubeChange | string, number][],
  ): void {
    const values = ReleasePatch.getUpdateJSON(updates);
    values['type'] = 'update';
    console.log('websocket send', values);
    connection.send(
      JSON.stringify(
        values
      )
    );
  };

  getEditWebsocket = (): WebSocket => {
    const url = new URL('/ws/patch_edit/' + this.id + '/', window.location.href);
    url.protocol = url.protocol.replace('http', 'ws');
    const ws = new WebSocket(url.href);

    ws.onopen = () => {
      console.log('connected');
      ws.send(
        JSON.stringify(
          {
            type: 'authentication',
            token: store.getState().token,
          }
        )
      );
    };

    ws.onclose = () => {
      console.log('disconnected');
    };

    return ws;
  };

  delete = (): Promise<any> => {
    return axios.delete(
      apiPath + 'patches/' + this.id + '/',
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${store.getState().token}`,
        }
      },
    )
  };

  fork = (): Promise<ReleasePatch> => {
    return axios.post(
      apiPath + 'patches/' + this.id + '/fork/',
      {},
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${store.getState().token}`,
        }
      },
    ).then(
      response => ReleasePatch.fromRemote(response.data)
    )
  };

  preview = (): Promise<Preview> => {
    return axios.get(
      apiPath + 'patches/' + this.id + '/preview/',
    ).then(
      response => Preview.fromRemote(response.data)
    )
  };

  verbose = (): Promise<VerbosePatch> => {
    return axios.get(
      apiPath + 'patches/' + this.id + '/verbose/',
    ).then(
      response => VerbosePatch.fromRemote(response.data)
    )
  };

  report = (): Promise<UpdateReport> => {
    return axios.get(
      apiPath + 'patches/' + this.id + '/report/',
    ).then(
      response => UpdateReport.fromRemote(response.data)
    )
  };

  apply = (): Promise<CubeRelease> => {
    return axios.post(
      apiPath + 'patches/' + this.id + '/apply/',
      {},
      {
        headers: {
          "Content-Type":
            "application/json",
          "Authorization":
            `Token ${store.getState().token}`,
        }
      },
    ).then(
      response => CubeRelease.fromRemote(response.data)
    )
  };

  static create = (cube_id: number, description: string): Promise<ReleasePatch> => {
    return axios.post(
      apiPath + 'patches/',
      {
        description,
        versioned_cube_id: cube_id,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${store.getState().token}`,
        }
      },
    ).then(
      response => ReleasePatch.fromRemote(response.data)
    )
  };

  static all = (): Promise<ReleasePatch[]> => {
    // TODO pagination lol
    return axios.get(
      apiPath + 'patches/'
    ).then(
      response => response.data.results.map(
        (patch: any) => ReleasePatch.fromRemote(patch)
      )
    )
  };

  static forCube = (cubeId: number): Promise<ReleasePatch[]> => {
    // TODO pagination lol
    return axios.get(
      apiPath + 'versioned-cubes/' + cubeId + '/patches/'
    ).then(
      response => response.data.results.map(
        (patch: any) => ReleasePatch.fromRemote(patch)
      )
    )
  };

  static get = (id: string): Promise<ReleasePatch> => {
    return axios.get(
      apiPath + 'patches/' + id + '/'
    ).then(
      response => ReleasePatch.fromRemote(response.data)
    )
  };

}


export class ConstrainedNode extends Atomic {
  node: PrintingNode;
  value: number;
  groups: string[];

  constructor(id: string, printingNode: PrintingNode, value: number, groups: string[]) {
    super(id);
    this.node = printingNode;
    this.value = value;
    this.groups = groups.sort(
      (a, b) => a.toLowerCase() > b.toLowerCase() ? 1 : a.toLowerCase() < b.toLowerCase() ? -1 : 0
    );
  }

  public static fromRemote(remote: any): ConstrainedNode {
    return new ConstrainedNode(
      remote.id,
      PrintingNode.fromRemote(remote.node),
      remote.value,
      remote.groups,
    )
  };

  public static wrappingPrinting(printing: Printing): ConstrainedNode {
    return new ConstrainedNode(
      "",
      new PrintingNode(
        "",
        new MultiplicityList([[printing, 1]]),
        'AllNode',
      ),
      0,
      [],
    )
  };

  public static fromTrap(trap: Trap): ConstrainedNode {
    return new ConstrainedNode(
      "",
      trap.node,
      1,
      [],
    )
  }

  serialize = (): any => {
    return {
      node: this.node.serialize(),
      value: this.value,
      groups: this.groups,
    }
  };

  public static parse(query: string, groups: string, weight: number): Promise<ConstrainedNode> {
    return axios.post(
      apiPath + 'service/parse-constrained-node/',
      {
        query,
        groups,
        weight,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${store.getState().token}`,
        }
      },
    ).then(
      response => ConstrainedNode.fromRemote(response.data)
    )
  }

}


export class ConstrainedNodes {
  nodes: Counter<ConstrainedNode>;

  constructor(nodes: [any, number][]) {
    this.nodes = new Counter(
      nodes.map(
        ([node, multiplicity]: [any, number]) => [ConstrainedNode.fromRemote(node), multiplicity]
      )
    )
  }

  static all = (): Promise<ConstrainedNodes[]> => {
    // TODO pagination lol
    return axios.get(
      apiPath + 'constrained-nodes/'
    ).then(
      response => response.data.results.map(
        (constrainedNode: any) => ConstrainedNode.fromRemote(constrainedNode.nodes.constrained_nodes)
      )
    )
  };

  static get = (id: string): Promise<ConstrainedNodes> => {
    return axios.get(
      apiPath + 'constrained-nodes/' + id + '/'
    ).then(
      response => new ConstrainedNodes(response.data.nodes.constrained_nodes)
    )
  };

}


export class GroupMap {
  groups: { string: number };

  constructor(groups: { string: number }) {
    this.groups = groups;
  }

  public static fromRemote(remote: any): GroupMap {
    return new GroupMap(
      remote.groups,
    )
  }

}


export class CubeChange extends Atomic {
  explanation: string;
  type: string;
  content: any;
  category: string;

  constructor(id: string, explanation: string, type: string, content: any, category: string) {
    super(id);
    this.explanation = explanation;
    this.type = type;
    this.content = content;
    this.category = category
  }

  public static fromRemote(remote: any): CubeChange {
    return new CubeChange(
      remote.id,
      remote.explanation,
      remote.type,
      remote.content,
      remote.category,
    )
  }

  serialize = (): any => {
    return {
      type: this.type,
      content: this.content,
    }
  }

}


export class VerbosePatch {
  changes: Counter<CubeChange>;

  constructor(changes: Counter<CubeChange>) {
    this.changes = changes;
  }

  public static fromRemote(remote: any): VerbosePatch {
    return new VerbosePatch(
      new Counter(
        remote.changes.map(
          ([change, multiplicity]: [any, number]) => [
            CubeChange.fromRemote(change),
            multiplicity,
          ]
        )
      )
    )
  }

}


export class ReportNotification {
  title: string;
  content: string;
  level: string;

  constructor(title: string, content: string, level: string) {
    this.title = title;
    this.content = content;
    this.level = level;
  }

  public static fromRemote(remote: any): ReportNotification {
    return new ReportNotification(
      remote.title,
      remote.content,
      remote.level,
    )
  }

}


export class UpdateReport {
  notifications: ReportNotification[];

  constructor(notifications: ReportNotification[]) {
    this.notifications = notifications;
  }

  public static fromRemote(remote: any): UpdateReport {
    return new UpdateReport(
      remote.notifications.map(
        (notification: any) => ReportNotification.fromRemote(notification)
      )
    )
  }

}
