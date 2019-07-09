import axios from 'axios';


export const apiPath = '/api/';


export class Model {

  constructor(wrapping) {
    this._wrapping = wrapping
  }

  id = () => {
    return this._wrapping._id
  }

}


class Cubeable extends Model {

  constructor(cubeable) {
    super(cubeable);
  }

}


class PrintingModel extends Cubeable {

  constructor(printing) {
    super(printing);
  }

  name = () => {
    return this._wrapping.name;
  };

  color = () => {
    return this._wrapping.color;
  };

  types = () => {
    return this._wrapping.types;
  };

  content_description = () => {
    return this.name + '|' + this._wrapping.expansion.code;
  };

}


class TicketModel extends Model {

  constructor(ticket) {
    super(ticket);
  };

  content_description = () => {

  };

}


class User extends Model {

  constructor(user) {
    super(user);
  }

  username = () => {
    return this._wrapping.username
  };

  static all = () => {
    // TODO pagination lol
    return axios.get(
      apiPath + 'users/'
    ).then(
      response => response.data.results.map(
        user => new User(user)
      )
    )
  };

  static get = (id) => {
    return axios.get(
      apiPath + 'users/' + id + '/'
    ).then(
      response => new User(response.data)
    )
  };

}


export class MinimalCube extends Model {

  constructor(cube) {
    super(cube);
    this._author = new User(cube._author);
  }

  name = () => {
    return this._wrapping.name
  };

  id = () => {
    return this._wrapping.id
  };

  description = () => {
    return this._wrapping.description;
  };

  author = () => {
    return this._author
  };

  createdAt = () => {
    return this._wrapping.created_at
  };

}


export class Cube extends MinimalCube {

  constructor(cube) {
    super(cube);
    this._wrapping.releases = this._wrapping.releases.map(
      release => new CubeReleaseMeta(release)
    );
  }

  releases = () => {
    return this._wrapping.releases
  };

  latestRelease = () => {
    if (this._wrapping.releases.length < 1) {
      return null;
    }
    return this._wrapping.releases[0];
  };

  static all = () => {
    // TODO pagination lol
    return axios.get(
      apiPath + 'versioned-cubes/'
    ).then(
      response => response.data.results.map(
        user => new Cube(user)
      )
    )
  };

  static get = (id) => {
    return axios.get(
      apiPath + 'versioned-cubes/' + id + '/'
    ).then(
      response => new Cube(response.data)
    )
  };

}


export class CubeReleaseMeta extends Model {

  constructor(release) {
    super(release);
  };

  id = () => {
    return this._wrapping.id
  };

  name = () => {
    return this._wrapping.name
  };

  createdAt = () => {
    return this._wrapping.created_at
  };

  intendedSize = () => {
    return this._wrapping.intended_size
  };

}


export class CubeRelease extends CubeReleaseMeta {

  constructor(release) {
    super(release);
    this._cube = new MinimalCube(release.versioned_cube);
    
  }

  cube = () => {
    return this._cube
  };

  printings = () => {
    console.log('get printings');
    console.log(this._wrapping.cube_content.printings);
    return this._wrapping.cube_content.printings
  };

  traps = () => {
    return this._wrapping.cube_content.traps;
  };

  tickets = () => {
    return this._wrapping.cube_content.tickets;
  };

  purples = () => {
    return this._wrapping.cube_content.purples;
  };

  laps = () => {
    return [].concat(
      this.traps(),
      this.tickets(),
      this.purples(),
    );
  };

  cubeables = () => {
    return [].concat(
      this.printings(),
      this.laps(),
    );
  };

  traps_of_intention_type = (intention_type) => {
    return this.traps().filter(
      trap => trap.intention_type === intention_type
    )
  };

  printings_of_color = (color) => {
    return this.printings().filter(
      printing => {
        return (
          !printing.types.includes('Land')
          && printing.color.length === 1
          && printing.color[0] === color
        );
      }
    )
  };

  gold_printings = () => {
    return this.printings().filter(
      printing => {
        return (
          !printing.types.includes('Land')
          && printing.color.length > 1
        );
      }
    )
  };

  colorless_printings = () => {
    return this.printings().filter(
      printing => {
        return (
          !printing.types.includes('Land')
          && printing.color.length === 0
        );
      }
    )
  };

  land_printings = () => {
    return this.printings().filter(
      printing => printing.types.includes('Land')
    )
  };

  grouped_printings = () => {
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

  grouped_laps = () => {
    return [
      this.traps_of_intention_type('GARBAGE'),
      this.traps_of_intention_type('SYNERGY'),
      this.tickets(),
      this.purples(),
    ]
  };

  grouped_cubeables = () => {
    return [].concat(
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
        user => new CubeRelease(user)
      )
    )
  };

  static get = (id) => {
    return axios.get(
      apiPath + 'cube-releases/' + id + '/'
    ).then(
      response => new CubeRelease(response.data)
    )
  };

}


export class Delta extends Model {

  constructor(delta) {
    super(delta);
    this._author = new User(delta.author);
    this._cube = new MinimalCube(delta.versioned_cube);
  }

  id = () => {
    return this._wrapping.id
  };

  description = () => {
    return this._wrapping.description;
  };

  createdAt = () => {
    return this._wrapping.created_at;
  };

  author = () => {
    return this._author;
  };

  cube = () => {
    return this._cube
  };

  static all = () => {
    // TODO pagination lol
    return axios.get(
      apiPath + 'deltas/'
    ).then(
      response => response.data.results.map(
        user => new Delta(user)
      )
    )
  };

  static get = (id) => {
    return axios.get(
      apiPath + 'deltas/' + id + '/'
    ).then(
      response => new Delta(response.data)
    )
  };

}


export class ConstrainedNode extends Model {

  constructor(node) {
    super(node);
    self._wrapping = node
  }

  value = () => {
    return self._wrapping.value
  };

  groups = () => {
    return self._wrapping.groups
  };

  node = () => {
    return self._wrapping.node
  }

}


export class ConstrainedNodes extends Model {

  constructor(nodes) {
    super(nodes);
    self._nodes = self._wrapping.nodes.map(
      node => new ConstrainedNode(node)
    )
  }

  nodes = () => {
    return self._nodes
  };

  static all = () => {
    // TODO pagination lol
    return axios.get(
      apiPath + 'constrained-nodes/'
    ).then(
      response => response.data.results.map(
        user => new ConstrainedNode(user)
      )
    )
  };

  static get = (id) => {
    return axios.get(
      apiPath + 'constrained-nodes/' + id + '/'
    ).then(
      response => new ConstrainedNode(response.data)
    )
  };

}