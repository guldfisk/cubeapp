import axios from 'axios';

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


export class Printing extends Cubeable {

  constructor(printing: any) {
    super(printing);
  }

  name = (): string => {
    return this._wrapping.name;
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

  static all = () => {
    // TODO pagination lol
    return axios.get(
      apiPath + 'versioned-cubes/'
    ).then(
      response => response.data.results.map(
        (cube: any) => new Cube(cube)
      )
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


export class CubeRelease extends CubeReleaseMeta {
  _cube: MinimalCube;
  _constrained_nodes: ConstrainedNodes | null;
  _printings: Printing[];
  _traps: Trap[];
  _tickets: Ticket[];
  _purples: Purple[];

  constructor(release: any) {
    super(release);

    this._printings = release.cube_content.printings.map(
      (printing: any) => new Printing(printing)
    );
    this._traps = release.cube_content.traps.map(
      (trap: any) => new Trap(trap)
    );
    this._tickets = release.cube_content.tickets.map(
      (ticket: any) => new Ticket(ticket)
    );
    this._purples = release.cube_content.purples.map(
      (purple: any) => new Purple(purple)
    );

    this._cube = new MinimalCube(release.versioned_cube);

    this._constrained_nodes = (
      release.constrained_nodes === null ?
        null :
        new ConstrainedNodes(release.constrained_nodes)
    );
  }

  cube = (): MinimalCube => {
    return this._cube
  };

  constrainedNodes = (): ConstrainedNodes | null => {
    return this._constrained_nodes
  };

  printings = (): Printing[] => {
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

  laps = (): ConcatArray<any> => {
    let _array: any[] = [];
    return _array.concat(
      this.traps(),
      this.tickets(),
      this.purples(),
    );
  };

  cubeables = (): any[] => {
    let _array: any[] = [];
    return _array.concat(
      this.printings(),
      this.laps(),
    );
  };

  traps_of_intention_type = (intention_type: string): Trap[] => {
    return this.traps().filter(
      trap => trap.intentionType() === intention_type
    )
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

  grouped_laps = (): any[][] => {
    return [
      this.traps_of_intention_type('GARBAGE'),
      this.traps_of_intention_type('SYNERGY'),
      this.tickets(),
      this.purples(),
    ]
  };

  grouped_cubeables = (): any[][] => {
    let _array: any[] = [];
    return _array.concat(
      this.grouped_printings(),
      this.grouped_laps(),
    )
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

}


export class Delta extends Model {
  _author: User;
  _cube: MinimalCube;

  constructor(delta: any) {
    super(delta);
    this._author = new User(delta.author);
    this._cube = new MinimalCube(delta.versioned_cube);
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
    return this._cube
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