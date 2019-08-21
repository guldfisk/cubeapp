import axios from 'axios';

import {Counter, MultiplicityList} from "./utils";
import store from '../state/store';
import {alphabeticalPropertySortMethodFactory} from "../utils/utils";


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
    return 'Cubeable'
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
    return 'Trap'
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

export class Ticket extends Cubeable {
  name: string;

  public static fromRemote(remote: any): Ticket {
    return new Purple(remote.id, remote.name)
  }

  getType = (): string => {
    return 'Ticket'
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
    return 'Purple'
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
  intendedSize: string;

  constructor(id: string, name: string, createdAt: string, intendedSize: string) {
    super(id);
    this.name = name;
    this.createdAt = createdAt;
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


export class PrintingCollection extends MultiplicityList<Printing> {

  constructor(items: [Printing, number][] = []) {
    super(items);
    this.items.sort(
      alphabeticalPropertySortMethodFactory(
        ([printing, _]: [Printing, number]) => printing.name.toString()
      )
    );
  }

  public static collectFromIterable<T>(printings: IterableIterator<Printing>): PrintingCollection {
    let collector: Record<string, [Printing, number]> = {};
    for (const printing of printings) {
      let key = printing.id.toString();
      if (collector[key] === undefined) {
        collector[key] = [printing, 1]
      } else {
        collector[key][1] += 1
      }
    }
    return new PrintingCollection(
      Object.values(collector)
    )
  }

  printings_of_color = (color: string): [Printing, number][] => {
    return this.items.filter(
      ([printing, _]: [Printing, number]) =>
        !printing.types.includes('Land')
        && printing.color.length === 1
        && printing.color[0] === color
    )
  };

  gold_printings = (): [Printing, number][] => {
    return this.items.filter(
      ([printing, _]: [Printing, number]) =>
        !printing.types.includes('Land')
        && printing.color.length > 1
    )
  };

  colorless_printings = (): [Printing, number][] => {
    return this.items.filter(
      ([printing, _]: [Printing, number]) =>
        !printing.types.includes('Land')
        && printing.color.length === 0
    )
  };

  land_printings = (): [Printing, number][] => {
    return this.items.filter(
      ([printing, _]: [Printing, number]) =>
        printing.types.includes('Land')
    )
  };

  grouped_printings = (): [Printing, number][][] => {
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


export class CubeablesContainer {
  printings: PrintingCollection;
  traps: MultiplicityList<Trap>;
  tickets: MultiplicityList<Ticket>;
  purples: MultiplicityList<Purple>;

  constructor(
    printings: PrintingCollection,
    traps: MultiplicityList<Trap>,
    tickets: MultiplicityList<Ticket>,
    purples: MultiplicityList<Purple>,
  ) {
    this.printings = printings;
    this.traps = traps;
    this.tickets = tickets;
    this.purples = purples;
  }

  public static fromRemote(remote: any): CubeablesContainer {
    return new CubeablesContainer(
      new PrintingCollection(
        remote.printings.map(
          ([printing, multiplicity]: [Trap, number]) => [Printing.fromRemote(printing), multiplicity]
        )
      ),
      new MultiplicityList(
        remote.traps.map(
          ([trap, multiplicity]: [Trap, number]) => [Trap.fromRemote(trap), multiplicity]
        )
      ),
      new MultiplicityList(
        remote.tickets.map(
          ([ticket, multiplicity]: [Trap, number]) => [Ticket.fromRemote(ticket), multiplicity]
        )
      ),
      new MultiplicityList(
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
    yield* this.traps.items;
    yield* this.tickets.items;
    yield* this.purples.items;
  };

  * cubeables(): IterableIterator<[Cubeable, number]> {
    yield* this.printings.items;
    yield* this.laps();
  };

  * allCubeables(): IterableIterator<Cubeable> {
    yield* this.printings.iter();
    yield* this.traps.iter();
    yield* this.tickets.iter();
    yield* this.purples.iter();
  };

  traps_of_intention_types = (intention_types: string[]): [Trap, number][] => {
    return this.traps.items.filter(
      ([trap, multiplicity]: [Trap, number]) => intention_types.includes(trap.intentionType)
    )
  };

  grouped_laps = (): [Cubeable, number][][] => {
    return [
      this.traps_of_intention_types(['GARBAGE']),
      this.traps_of_intention_types(['SYNERGY', 'NO_INTENTION']),
      this.traps_of_intention_types(['OR']),
      this.tickets.items,
      this.purples.items,
    ]
  };

  grouped_cubeables = (): [Cubeable, number][][] => {
    return (
      this.printings.grouped_printings() as [Cubeable, number][][]
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
      CubeablesContainer.fromRemote(remote.cube_content),
      remote.constrained_nodes ?
        new ConstrainedNodes(remote.constrained_nodes.constrained_nodes_content.nodes)
        : null,
    )
  }

  static all = (): Promise<CubeRelease[]> => {
    // TODO pagination lol
    return axios.get(
      apiPath + 'cube-releases/'
    ).then(
      response => response.data.results.map(
        (release: any) => CubeRelease.fromRemote(release)
      )
    )
  };

  static get = (id: string): Promise<CubeRelease> => {
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

  constructor(cubeables: CubeablesContainer, constrainedNodes: ConstrainedNodes) {
    this.cubeables = cubeables;
    this.constrainedNodes = constrainedNodes;
  }

  public static fromRemote(remote: any): Preview {
    return new Preview(
      CubeablesContainer.fromRemote(remote.cube),
      new ConstrainedNodes(remote.nodes.constrained_nodes_content.nodes),
    )
  }

}


export class Patch extends Atomic {
  author: User;
  cube: MinimalCube;
  description: string;
  createdAt: string;
  positiveCubeablesContainer: CubeablesContainer;
  negativeCubeablesContainer: CubeablesContainer;

  positiveConstrainedNodes: ConstrainedNodes;
  negativeConstrainedNodes: ConstrainedNodes;

  constructor(
    id: string,
    author: User,
    cube: MinimalCube,
    description: string,
    createdAt: string,
    positiveCubeablesContainer: CubeablesContainer,
    negativeCubeablesContainer: CubeablesContainer,
    positiveConstrainedNodes: ConstrainedNodes,
    negativeConstrainedNodes: ConstrainedNodes,
  ) {
    super(id);
    this.author = author;
    this.cube = cube;
    this.description = description;
    this.createdAt = createdAt;
    this.positiveCubeablesContainer = positiveCubeablesContainer;
    this.negativeCubeablesContainer = negativeCubeablesContainer;
    this.positiveConstrainedNodes = positiveConstrainedNodes;
    this.negativeConstrainedNodes = negativeConstrainedNodes;
  }

  public static fromRemote(remote: any): Patch {
    return new Patch(
      remote.id,
      User.fromRemote(remote.author),
      MinimalCube.fromRemote(remote.versioned_cube),
      remote.description,
      remote.created_at,
      new CubeablesContainer(
        new PrintingCollection(
          remote.content.cube_delta.printings.filter(
            ([cubeable, multiplicity]: [any, number]) => multiplicity > 0
          ).map(
            ([printing, multiplicity]: [any, number]) => [Printing.fromRemote(printing), multiplicity]
          )
        ),
        new MultiplicityList(
          remote.content.cube_delta.traps.filter(
            ([cubeable, multiplicity]: [any, number]) => multiplicity > 0
          ).map(
            ([trap, multiplicity]: [any, number]) => [Trap.fromRemote(trap), multiplicity]
          )
        ),
        new MultiplicityList(
          remote.content.cube_delta.tickets.filter(
            ([cubeable, multiplicity]: [any, number]) => multiplicity > 0
          ).map(
            ([ticket, multiplicity]: [any, number]) => [Ticket.fromRemote(ticket), multiplicity]
          )
        ),
        new MultiplicityList(
          remote.content.cube_delta.purples.filter(
            ([cubeable, multiplicity]: [any, number]) => multiplicity > 0
          ).map(
            ([purple, multiplicity]: [any, number]) => [Purple.fromRemote(purple), multiplicity]
          )
        ),
      ),
      new CubeablesContainer(
        new PrintingCollection(
          remote.content.cube_delta.printings.filter(
            ([cubeable, multiplicity]: [any, number]) => multiplicity < 0
          ).map(
            ([printing, multiplicity]: [any, number]) => [Printing.fromRemote(printing), multiplicity]
          )
        ),
        new MultiplicityList(
          remote.content.cube_delta.traps.filter(
            ([cubeable, multiplicity]: [any, number]) => multiplicity < 0
          ).map(
            ([trap, multiplicity]: [any, number]) => [Trap.fromRemote(trap), multiplicity]
          )
        ),
        new MultiplicityList(
          remote.content.cube_delta.tickets.filter(
            ([cubeable, multiplicity]: [any, number]) => multiplicity < 0
          ).map(
            ([ticket, multiplicity]: [any, number]) => [Ticket.fromRemote(ticket), multiplicity]
          )
        ),
        new MultiplicityList(
          remote.content.cube_delta.purples.filter(
            ([cubeable, multiplicity]: [any, number]) => multiplicity < 0
          ).map(
            ([purple, multiplicity]: [any, number]) => [Purple.fromRemote(purple), multiplicity]
          )
        ),
      ),
      new ConstrainedNodes(
        remote.content.node_delta.filter(
          ([node, multiplicity]: [any, number]) => multiplicity > 0
        )
      ),
      new ConstrainedNodes(
        remote.content.node_delta.filter(
          ([node, multiplicity]: [any, number]) => multiplicity < 0
        )
      ),
    );
  }

  update = (updates: [Cubeable | ConstrainedNode | CubeChange, number][]): Promise<Patch> => {
    let cubeDelta: { printings: [any, number][], traps: [any, number][] } = {
      printings: [],
      traps: [],
    };
    let nodeDelta: any = {nodes: []};

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
      }

    }

    console.log(cubeDelta);
    console.log(nodeDelta);
    console.log(changeUndoes);

    return axios.patch(
      apiPath + 'patches/' + this.id + '/',
      {
        update: JSON.stringify(
          {
            cube_delta: cubeDelta,
            nodes_delta: nodeDelta,
          }
        ),
        change_undoes: JSON.stringify(
          changeUndoes
        ),
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${store.getState().token}`,
        }
      },
    ).then(
      response => Patch.fromRemote(response.data)
    )
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

  static create = (cube_id: number, description: string): Promise<Patch> => {
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
      response => Patch.fromRemote(response.data)
    )
  };

  static all = (): Promise<Patch[]> => {
    // TODO pagination lol
    return axios.get(
      apiPath + 'patches/'
    ).then(
      response => response.data.results.map(
        (patch: any) => Patch.fromRemote(patch)
      )
    )
  };

  static forCube = (cubeId: number): Promise<Patch[]> => {
    // TODO pagination lol
    return axios.get(
      apiPath + 'versioned-cubes/' + cubeId + '/patches/'
    ).then(
      response => response.data.results.map(
        (patch: any) => Patch.fromRemote(patch)
      )
    )
  };

  static get = (id: string): Promise<Patch> => {
    return axios.get(
      apiPath + 'patches/' + id + '/'
    ).then(
      response => Patch.fromRemote(response.data)
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
      1,
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
  _nodes: MultiplicityList<ConstrainedNode>;

  constructor(nodes: [any, number][]) {
    this._nodes = new MultiplicityList(
      nodes.map(
        ([node, multiplicity]: [any, number]) => [ConstrainedNode.fromRemote(node), multiplicity]
      )
    )
  }

  nodes = (): MultiplicityList<ConstrainedNode> => {
    return this._nodes
  };

  static all = (): Promise<ConstrainedNodes[]> => {
    // TODO pagination lol
    return axios.get(
      apiPath + 'constrained-nodes/'
    ).then(
      response => response.data.results.map(
        (constrainedNode: any) => ConstrainedNode.fromRemote(constrainedNode.nodes.constrained_nodes_content)
      )
    )
  };

  static get = (id: string): Promise<ConstrainedNodes> => {
    return axios.get(
      apiPath + 'constrained-nodes/' + id + '/'
    ).then(
      response => new ConstrainedNodes(response.data.nodes.constrained_nodes_content)
    )
  };

}


// const cubeableFromRemote = (remote: any): Cubeable => {
//   if (remote.type === 'Printing') {
//     return Printing.fromRemote(remote)
//   }
//   if (remote.type === 'Trap') {
//     return Trap.fromRemote(remote)
//   }
//   if (remote.type === 'Ticket') {
//     return Ticket.fromRemote(remote)
//   }
//   if (remote.type === 'Purple') {
//     return Purple.fromRemote(remote)
//   }
// };


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


// export class NewCubeable extends CubeChange {
//   cubeable: Cubeable;
//
//   constructor(id: string, explanation: string, cubeable: Cubeable) {
//     super(id, explanation);
//     this.cubeable = cubeable;
//   }
//
//   public static fromRemote(remote: any): NewCubeable {
//     return new NewCubeable(
//       remote.id,
//       remote.explanation,
//       cubeableFromRemote(remote.cubeable),
//     )
//   }
//
// }


// export class AlteredNode extends CubeChange {
//   before: ConstrainedNode;
//   after: ConstrainedNode;
//
//   constructor(id: string, explanation: string, before: ConstrainedNode, after: ConstrainedNode) {
//     super(id, explanation);
//     this.before = before;
//     this.after = after;
//   }
//
//   public static fromRemote(remote: any): AlteredNode {
//     return new AlteredNode(
//       remote.id,
//       remote.explanation,
//       ConstrainedNode.fromRemote(remote.before),
//       ConstrainedNode.fromRemote(remote.after),
//     )
//   }
//
// }


export class VerbosePatch {
  changes: MultiplicityList<CubeChange>;

  constructor(changes: MultiplicityList<CubeChange>) {
    this.changes = changes;
  }

  public static fromRemote(remote: any): VerbosePatch {
    return new VerbosePatch(
      new MultiplicityList(
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