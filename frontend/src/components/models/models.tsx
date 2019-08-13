import axios from 'axios';

import {Counter, MultiplicityList} from "./utils";
import store from '../state/store';
import {alphabeticalPropertySortMethodFactory} from "../utils/utils";
import {instanceOf, node} from "prop-types";


export const apiPath = '/api/';


export class Model {
  _wrapping: any;

  constructor(wrapping: any) {
    this._wrapping = wrapping
  }

  id = (): string => {
    return this._wrapping.id
  }

}


export class Cubeable extends Model {

  constructor(cubeable: any) {
    super(cubeable);
  }

  type = (): string => {
    return this._wrapping.type
  }

}


export class Expansion extends Model {
}

export class Printing extends Cubeable {

  constructor(printing: any) {
    super(printing);
  }

  name = (): string => {
    return this._wrapping.name;
  };

  expansion = (): any => {
    return this._wrapping.expansion
  };

  color = (): string => {
    return this._wrapping.color;
  };

  types = (): string[] => {
    return this._wrapping.types;
  };

  full_name = (): string => {
    return this.name() + '|' + this._wrapping.expansion.code;
  };

}


export class PrintingNode extends Cubeable {
  _children: MultiplicityList<Printing | PrintingNode>;

  constructor(node: any) {
    super(node);
    this._children = new MultiplicityList(
      node.children.map(
        ([child, multiplicity]: [any, number]) => [
          child.type === 'printing' ? new Printing(child) : new PrintingNode(child),
          multiplicity,
        ]
      )
    )
  }

  * printings(): IterableIterator<Printing> {
    for (const [child, multiplicity] of this._children.items) {
      for (let i = 0; i < multiplicity; i++) {
        if (child instanceof Printing) {
          yield child
        } else {
          yield* (child as PrintingNode).printings()
        }
      }
    }
  };

  children = (): MultiplicityList<Printing | PrintingNode> => {
    return this._children
  };

  representation = (): string => {
    return '(' + this._children.items.map(
      ([child, multiplicity]: [Printing | PrintingNode, number]) =>
        (multiplicity == 1 ? "" : multiplicity.toString() + "# ")
        + (child instanceof Printing ? child.full_name() : child.representation())
    ).join(
      this.type() === 'AllNode' ? '; ' : ' || '
    ) + ')'
  };

  serialize = (): any => {
    return {
      type: this.type(),
      options: this._children.items.map(
        ([child, multiplicity]) => [
          child instanceof Printing ? child.id() : child.serialize(),
          multiplicity,
        ]
      )
    }
  };

}


export class Trap extends Cubeable {
  _node: PrintingNode;

  constructor(trap: any) {
    super(trap);
    this._node = new PrintingNode(trap.node)
  }

  node = (): PrintingNode => {
    return this._node
  };

  intentionType = (): string => {
    return this._wrapping.intention_type
  };

  serialize = (): any => {
    return {
      node: this._node.serialize(),
      intention_type: this.intentionType(),
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
      trap => new Trap(trap.data)
    )
  }

}

export class Ticket extends Cubeable {

  constructor(ticket: any) {
    super(ticket);

  };

}


export class Purple extends Cubeable {

  constructor(purple: any) {
    super(purple);
  }

  name = (): string => {
    return this._wrapping.name
  };

}


export class User extends Model {

  constructor(user: any) {
    super(user);
  }

  username = (): string => {
    return this._wrapping.username
  };

  static all = (): Promise<User[]> => {
    // TODO pagination lol
    return axios.get(
      apiPath + 'users/'
    ).then(
      response => response.data.results.map(
        (user: any) => new User(user)
      )
    )
  };

  static get = (id: string): Promise<User> => {
    return axios.get(
      apiPath + 'users/' + id + '/'
    ).then(
      response => new User(response.data)
    )
  };

}


export class MinimalCube extends Model {
  _author: User;

  constructor(cube: any) {
    super(cube);
    this._author = new User(cube.author);
  }

  name = (): string => {
    return this._wrapping.name
  };

  description = (): string => {
    return this._wrapping.description;
  };

  author = (): User => {
    return this._author
  };

  createdAt = (): string => {
    return this._wrapping.created_at
  };

}


interface PaginationResponse<T> {
  objects: T[]
  hits: number
}

export class Cube extends MinimalCube {
  _releases: CubeReleaseMeta[];

  constructor(cube: any) {
    super(cube);
    this._releases = this._wrapping.releases.map(
      (release: any) => new CubeReleaseMeta(release)
    );
  }

  releases = (): CubeReleaseMeta[] => {
    return this._releases
  };

  latestRelease = (): (CubeReleaseMeta | null) => {
    if (this._releases.length < 1) {
      return null;
    }
    return this._releases[0];
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
            (cube: any) => new Cube(cube)
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
      response => new Cube(response.data)
    )
  };

}


export class CubeReleaseMeta extends Model {

  constructor(release: any) {
    super(release);
  };

  name = (): string => {
    return this._wrapping.name
  };

  createdAt = (): string => {
    return this._wrapping.created_at
  };

  intendedSize = (): number => {
    return this._wrapping.intended_size
  };

}


export class PrintingCollection extends MultiplicityList<Printing> {

  constructor(items: [Printing, number][] = []) {
    super(items);
    this.items.sort(
      alphabeticalPropertySortMethodFactory(
        ([printing, _]: [Printing, number]) => printing.name().toString()
      )
    );
  }

  public static collectFromIterable<T>(printings: IterableIterator<Printing>): PrintingCollection {
    let collector: Record<string, [Printing, number]> = {};
    for (const printing of printings) {
      let key = printing.id().toString();
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
        !printing.types().includes('Land')
        && printing.color().length === 1
        && printing.color()[0] === color
    )
  };

  gold_printings = (): [Printing, number][] => {
    return this.items.filter(
      ([printing, _]: [Printing, number]) =>
        !printing.types().includes('Land')
        && printing.color().length > 1
    )
  };

  colorless_printings = (): [Printing, number][] => {
    return this.items.filter(
      ([printing, _]: [Printing, number]) =>
        !printing.types().includes('Land')
        && printing.color().length === 0
    )
  };

  land_printings = (): [Printing, number][] => {
    return this.items.filter(
      ([printing, _]: [Printing, number]) =>
        printing.types().includes('Land')
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
  _printings: PrintingCollection;
  _traps: MultiplicityList<Trap>;
  _tickets: MultiplicityList<Ticket>;
  _purples: MultiplicityList<Purple>;

  constructor(cube: any) {
    this._printings = new PrintingCollection(
      cube.printings.map(
        ([printing, multiplicity]: [Trap, number]) => [new Printing(printing), multiplicity]
      )
    );
    this._traps = new MultiplicityList(
      cube.traps.map(
        ([trap, multiplicity]: [Trap, number]) => [new Trap(trap), multiplicity]
      )
    );
    this._tickets = new MultiplicityList(
      cube.tickets.map(
        ([ticket, multiplicity]: [Trap, number]) => [new Ticket(ticket), multiplicity]
      )
    );
    this._purples = new MultiplicityList(
      cube.purples.map(
        ([purple, multiplicity]: [Trap, number]) => [new Purple(purple), multiplicity]
      )
    );

  }

  printings = (): PrintingCollection => {
    return this._printings
  };

  traps = (): MultiplicityList<Trap> => {
    return this._traps;
  };

  tickets = (): MultiplicityList<Ticket> => {
    return this._tickets;
  };

  purples = (): MultiplicityList<Purple> => {
    return this._purples;
  };

  * allPrintings(): IterableIterator<Printing> {
    yield* this._printings.iter();
    for (const trap of this._traps.iter()) {
      yield* trap.node().printings()
    }
  };

  * laps(): IterableIterator<[Cubeable, number]> {
    yield* this._traps.items;
    yield* this._tickets.items;
    yield* this._purples.items;
  };

  * cubeables(): IterableIterator<[Cubeable, number]> {
    yield* this._printings.items;
    yield* this.laps();
  };

  * allCubeables(): IterableIterator<Cubeable> {
    yield* this.printings().iter();
    yield* this.traps().iter();
    yield* this.tickets().iter();
    yield* this.purples().iter();
  };

  traps_of_intention_type = (intention_type: string): [Trap, number][] => {
    return this.traps().items.filter(
      ([trap, multiplicity]: [Trap, number]) => trap.intentionType() === intention_type
    )
  };

  grouped_laps = (): [Cubeable, number][][] => {
    return [
      this.traps_of_intention_type('GARBAGE'),
      this.traps_of_intention_type('SYNERGY'),
      this.tickets().items,
      this.purples().items,
    ]
  };

  grouped_cubeables = (): [Cubeable, number][][] => {
    return (
      this._printings.grouped_printings() as [Cubeable, number][][]
    ).concat(
      this.grouped_laps(),
    )
  };

}


export class CubeRelease extends CubeReleaseMeta {
  _cube: MinimalCube;
  _constrained_nodes: ConstrainedNodes | null;
  _cubeablesContainer: CubeablesContainer;

  constructor(release: any) {
    super(release);

    this._cube = new MinimalCube(release.versioned_cube);

    this._cubeablesContainer = new CubeablesContainer(release.cube_content);

    this._constrained_nodes = (
      release.constrained_nodes === null ?
        null :
        new ConstrainedNodes(release.constrained_nodes.constrained_nodes_content.nodes)
    );
  }

  cube = (): MinimalCube => {
    return this._cube
  };

  cubeablesContainer = (): CubeablesContainer => {
    return this._cubeablesContainer
  };

  constrainedNodes = (): ConstrainedNodes | null => {
    return this._constrained_nodes
  };


  static all = (): Promise<CubeRelease[]> => {
    // TODO pagination lol
    return axios.get(
      apiPath + 'cube-releases/'
    ).then(
      response => response.data.results.map(
        (release: any) => new CubeRelease(release)
      )
    )
  };

  static get = (id: string): Promise<CubeRelease> => {
    return axios.get(
      apiPath + 'cube-releases/' + id + '/'
    ).then(
      response => new CubeRelease(response.data)
    )
  };

  filter = (query: string, flattened: boolean = false): Promise<CubeablesContainer> => {
    return axios.get(
      apiPath + 'cube-releases/' + this.id() + '/filter/',
      {
        params: {
          query,
          flattened,
        }
      }
    ).then(
      response => new CubeablesContainer(response.data)
    )
  }

}


export class Preview {
  cubeables: CubeablesContainer;
  constrainedNodes: ConstrainedNodes;

  constructor(preview: any) {
    this.cubeables = new CubeablesContainer(preview.cube);
    this.constrainedNodes = new ConstrainedNodes(preview.nodes.constrained_nodes_content.nodes);
  }

}


export class Patch extends Model {
  _author: User;
  _cube: MinimalCube;
  positiveCubeablesContainer: CubeablesContainer;
  negativeCubeablesContainer: CubeablesContainer;

  positiveConstrainedNodes: ConstrainedNodes;
  negativeConstrainedNodes: ConstrainedNodes;

  constructor(patch: any) {
    super(patch);
    this._author = new User(patch.author);
    this._cube = new MinimalCube(patch.versioned_cube);
    this.positiveCubeablesContainer = new CubeablesContainer(
      {
        printings: patch.content.cube_delta.printings.filter(
          ([cubeable, multiplicity]: [any, number]) => multiplicity > 0
        ),
        traps: patch.content.cube_delta.traps.filter(
          ([cubeable, multiplicity]: [any, number]) => multiplicity > 0
        ),
        tickets: patch.content.cube_delta.tickets.filter(
          ([cubeable, multiplicity]: [any, number]) => multiplicity > 0
        ),
        purples: patch.content.cube_delta.purples.filter(
          ([cubeable, multiplicity]: [any, number]) => multiplicity > 0
        ),
      }
    );
    this.negativeCubeablesContainer = new CubeablesContainer(
      {
        printings: patch.content.cube_delta.printings.filter(
          ([cubeable, multiplicity]: [any, number]) => multiplicity < 0
        ),
        traps: patch.content.cube_delta.traps.filter(
          ([cubeable, multiplicity]: [any, number]) => multiplicity < 0
        ),
        tickets: patch.content.cube_delta.tickets.filter(
          ([cubeable, multiplicity]: [any, number]) => multiplicity < 0
        ),
        purples: patch.content.cube_delta.purples.filter(
          ([cubeable, multiplicity]: [any, number]) => multiplicity < 0
        ),
      }
    );

    this.positiveConstrainedNodes = new ConstrainedNodes(
      patch.content.node_delta.filter(
        ([node, multiplicity]: [any, number]) => multiplicity > 0
      )
    );
    this.negativeConstrainedNodes = new ConstrainedNodes(
      patch.content.node_delta.filter(
        ([node, multiplicity]: [any, number]) => multiplicity < 0
      )
    );

  }

  description = (): string => {
    return this._wrapping.description;
  };

  createdAt = (): string => {
    return this._wrapping.created_at;
  };

  author = (): User => {
    return this._author;
  };

  cube = (): MinimalCube => {
    return this._cube;
  };

  update = (update: Cubeable | ConstrainedNode, amount: number = 1): Promise<Patch> => {
    let cubeDelta = {};
    let nodeDelta: any = {nodes: []};
    if (update instanceof Printing) {
      cubeDelta = {
        printings: [
          [
            update.id(),
            amount,
          ]
        ]
      }
    } else if (update instanceof Trap) {
      cubeDelta = {
        traps: [
          [
            update.serialize(),
            amount,
          ]
        ]
      }
    } else if (update instanceof ConstrainedNode) {
      nodeDelta = {
        nodes: [
          [
            update.serialize(),
            amount,
          ]
        ]
      }
    }

    return axios.patch(
      apiPath + 'patches/' + this.id() + '/',
      {
        update: JSON.stringify(
          {
            cube_delta: cubeDelta,
            nodes_delta: nodeDelta,
          }
        )
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${store.getState().token}`,
        }
      },
    ).then(
      response => new Patch(response.data)
    )
  };

  delete = (): Promise<any> => {
    return axios.delete(
      apiPath + 'patches/' + this.id() + '/',
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
      apiPath + 'patches/' + this.id() + '/preview/',
    ).then(
      response => new Preview(response.data)
    )
  };

  apply = (): Promise<CubeRelease> => {
    return axios.post(
      apiPath + 'patches/' + this.id() + '/apply/',
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
      response => new CubeRelease(response.data)
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
      response => new Patch(response.data)
    )
  };

  static all = (): Promise<Patch[]> => {
    // TODO pagination lol
    return axios.get(
      apiPath + 'patches/'
    ).then(
      response => response.data.results.map(
        (delta: any) => new Patch(delta)
      )
    )
  };

  static forCube = (cubeId: number): Promise<Patch[]> => {
    // TODO pagination lol
    return axios.get(
      apiPath + 'versioned-cubes/' + cubeId + '/patches/'
    ).then(
      response => response.data.results.map(
        (delta: any) => new Patch(delta)
      )
    )
  };

  static get = (id: string): Promise<Patch> => {
    return axios.get(
      apiPath + 'patches/' + id + '/'
    ).then(
      response => new Patch(response.data)
    )
  };

}


export class ConstrainedNode {
  _node: PrintingNode;
  value: number;
  groups: string[];

  constructor(node: any) {
    this._node = new PrintingNode(node.node);
    this.value = node.value;
    this.groups = node.groups;
  }

  node = (): PrintingNode => {
    return this._node;
  };

  serialize = (): any => {
    return {
      node: this._node.serialize(),
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
      response => new ConstrainedNode(response.data)
    )
  }

}


export class ConstrainedNodes {
  _nodes: MultiplicityList<ConstrainedNode>;

  constructor(nodes: [any, number][]) {
    this._nodes = new MultiplicityList(
      nodes.map(
        ([node, multiplicity]: [any, number]) => [new ConstrainedNode(node), multiplicity]
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
        (constrainedNode: any) => new ConstrainedNode(constrainedNode.nodes.constrained_nodes_content)
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