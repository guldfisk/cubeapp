import axios from 'axios';
import {response} from "express";

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

  content_description = (): string => {
    return this.name + '|' + this._wrapping.expansion.code;
  };

}


export class PrintingNode extends Cubeable {
  _children: (Printing | PrintingNode)[];

  constructor(node: any) {
    super(node);
    this._children = node.children.map(
      (child: any) => child.type === 'printing' ? new Printing(child) : new PrintingNode(child)
    );
  }

  * printings(): IterableIterator<Printing> {
    for (const child of this._children) {
      if (child instanceof Printing) {
        yield child
      } else {
        yield* (child as PrintingNode).printings()
      }
    }
  };

  children = (): (Printing | PrintingNode)[] => {
    return this._children
  };

  representation = (): string => {
    return '(' + this._children.map(
      child => child instanceof Printing ? child.name() : child.representation()
    ).join(
      this.type() === 'AllNode' ? '; ' : ' || '
    ) + ')'
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

  static all = () => {
    // TODO pagination lol
    return axios.get(
      apiPath + 'users/'
    ).then(
      response => response.data.results.map(
        (user: any) => new User(user)
      )
    )
  };

  static get = (id: string) => {
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

  static all = (offset: number = 0, limit: number = 50) => {
    return axios.get(
      apiPath + 'versioned-cubes/',
      {
        params: {
          offset,
          limit,
        }
      },
    ).then(
      response => [
        response.data.results.map(
          (cube: any) => new Cube(cube)
        ),
        response.data.count,
      ]
    )
  };

  static get = (id: string) => {
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


export class PrintingCollection {
  _printings: Printing[];

  constructor(printings: Printing[]) {
    this._printings = printings;
  }

  printings = (): Printing[] => {
    return this._printings
  };

  printings_of_color = (color: string): Printing[] => {
    return this.printings().filter(
      printing => {
        return (
          !printing.types().includes('Land')
          && printing.color().length === 1
          && printing.color()[0] === color
        );
      }
    )
  };

  gold_printings = (): Printing[] => {
    return this.printings().filter(
      printing => {
        return (
          !printing.types().includes('Land')
          && printing.color().length > 1
        );
      }
    )
  };

  colorless_printings = (): Printing[] => {
    return this.printings().filter(
      printing => {
        return (
          !printing.types().includes('Land')
          && printing.color().length === 0
        );
      }
    )
  };

  land_printings = (): Printing[] => {
    return this.printings().filter(
      printing => printing.types().includes('Land')
    )
  };

  grouped_printings = (): Printing[][] => {
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
  _traps: Trap[];
  _tickets: Ticket[];
  _purples: Purple[];

  constructor(cube: any) {
    this._printings = new PrintingCollection(
      cube.printings.map(
        (printing: any) => new Printing(printing)
      )
    );
    this._traps = cube.traps.map(
      (trap: any) => new Trap(trap)
    );
    this._tickets = cube.tickets.map(
      (ticket: any) => new Ticket(ticket)
    );
    this._purples = cube.purples.map(
      (purple: any) => new Purple(purple)
    );

  }

  printings = (): PrintingCollection => {
    return this._printings
  };

  traps = (): Trap[] => {
    return this._traps;
  };

  tickets = (): Ticket[] => {
    return this._tickets;
  };

  purples = (): Purple[] => {
    return this._purples;
  };

  * allPrintings(): IterableIterator<Printing> {
    yield* this._printings.printings();
    for (const trap of this._traps) {
      yield* trap.node().printings()
    }
  };

  laps = (): ConcatArray<Cubeable> => {
    return (
      this._traps as Cubeable[]
    ).concat(
      this._tickets as Cubeable[],
      this._purples as Cubeable[],
    );
  };

  cubeables = (): Cubeable[] => {
    return (
      this._printings.printings() as Cubeable[]
    ).concat(
      this.laps() as Cubeable[]
    );
  };

  traps_of_intention_type = (intention_type: string): Trap[] => {
    return this.traps().filter(
      trap => trap.intentionType() === intention_type
    )
  };

  grouped_laps = (): Cubeable[][] => {
    return [
      this.traps_of_intention_type('GARBAGE'),
      this.traps_of_intention_type('SYNERGY'),
      this.tickets(),
      this.purples(),
    ]
  };

  grouped_cubeables = (): Cubeable[][] => {
    return (
      this._printings.grouped_printings() as Cubeable[][]
    ).concat(
      this.grouped_laps(),
    )
  };

}


export class CubeRelease extends CubeReleaseMeta {
  _cube: MinimalCube;
  _constrained_nodes: ConstrainedNodes | null;
  _rawCube: CubeablesContainer;

  constructor(release: any) {
    super(release);

    this._cube = new MinimalCube(release.versioned_cube);

    this._rawCube = new CubeablesContainer(release.cube_content);

    this._constrained_nodes = (
      release.constrained_nodes === null ?
        null :
        new ConstrainedNodes(release.constrained_nodes)
    );
  }

  cube = (): MinimalCube => {
    return this._cube
  };

  cubeablesContainer = (): CubeablesContainer => {
    return this._rawCube
  };

  constrainedNodes = (): ConstrainedNodes | null => {
    return this._constrained_nodes
  };


  static all = () => {
    // TODO pagination lol
    return axios.get(
      apiPath + 'cube-releases/'
    ).then(
      response => response.data.results.map(
        (release: any) => new CubeRelease(release)
      )
    )
  };

  static get = (id: string) => {
    return axios.get(
      apiPath + 'cube-releases/' + id + '/'
    ).then(
      response => new CubeRelease(response.data)
    )
  };

  filter = (query: string, flattened: boolean = false) => {
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


class Counter {
  _cubeable: Cubeable;
  _count: number;

  constructor(cubeable: Cubeable, count: number) {
    this._cubeable = cubeable;
    this._count = count;
  }

  cubeable = (): Cubeable => {
    return this._cubeable
  };

  count = (): number => {
    return this._count
  };

  add = (amount: number): Counter => {
    this._count += amount;
    return this;
  };

}


class CubeablesCounter {

  _counters: {[id: string]: Counter};

  constructor(cubeables: Cubeable[] = []) {
    this._counters = {};
    cubeables.forEach(cubeable => this.add(cubeable));
  }

  add = (cubeable: Cubeable, amount: number = 1): void => {
    if (amount === 0) {
      return
    }
    let count = this._counters[cubeable.id()];
    if (count === undefined) {
      this._counters[cubeable.id()] = new Counter(cubeable, amount)
    } else {
      if (count.add(amount).count()) {
        delete this._counters[cubeable.id()]
      }
    }
  };

  *items(): IterableIterator<[Cubeable, number]> {
   for (const count of Object.values(this._counters)) {
     yield [count.cubeable(), count.count()]
   }
  }

}


export class Delta extends Model {
  _author: User;
  _cube: MinimalCube;
  _printings: [Printing, number][];

  constructor(delta: any) {
    super(delta);
    this._author = new User(delta.author);
    this._cube = new MinimalCube(delta.versioned_cube);
    this._printings = delta.content.printings.map(
      ([printing, multiplicity]: [any, number]) => [new Printing(printing), multiplicity]
    )
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

  printings = (): [Printing, number][] => {
    return this._printings;
  };

  static all = () => {
    // TODO pagination lol
    return axios.get(
      apiPath + 'deltas/'
    ).then(
      response => response.data.results.map(
        (delta: any) => new Delta(delta)
      )
    )
  };

  static forCube = (cubeId: number) => {
    // TODO pagination lol
    return axios.get(
      apiPath + 'versioned-cubes/' + cubeId + '/deltas/'
    ).then(
      response => response.data.results.map(
        (delta: any) => new Delta(delta)
      )
    )
  };

  static get = (id: string) => {
    return axios.get(
      apiPath + 'deltas/' + id + '/'
    ).then(
      response => new Delta(response.data)
    )
  };

}


export class ConstrainedNode extends Model {
  _node: PrintingNode;

  constructor(node: any) {
    super(node);
    this._node = new PrintingNode(node.node);
  }

  value = (): number => {
    return this._wrapping.value;
  };

  groups = (): string[] => {
    return this._wrapping.groups;
  };

  node = (): PrintingNode => {
    return this._node;
  }

}


export class ConstrainedNodes extends Model {
  _nodes: ConstrainedNode[];

  constructor(nodes: any) {
    super(nodes);
    this._nodes = this._wrapping.constrained_nodes_content.nodes.map(
      (node: any) => new ConstrainedNode(node)
    )
  }

  nodes = (): ConstrainedNode[] => {
    return this._nodes
  };

  static all = () => {
    // TODO pagination lol
    return axios.get(
      apiPath + 'constrained-nodes/'
    ).then(
      response => response.data.results.map(
        (constrainedNode: any) => new ConstrainedNode(constrainedNode)
      )
    )
  };

  static get = (id: string) => {
    return axios.get(
      apiPath + 'constrained-nodes/' + id + '/'
    ).then(
      response => new ConstrainedNode(response.data)
    )
  };

}