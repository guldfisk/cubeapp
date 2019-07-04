
class PrintingModel {

  constructor(printing) {
    this._printing = printing;
  }

  name = () => {
    return this._printing.name;
  };

  id = () => {
    return this._printing.id;
  };

  color = () => {
    return this._printing.color;
  };

  types = () => {
    return self._printing.types;
  };

  content_description = () => {
    return self.name + '|' + self._printing.expansion.code;
  };

}


class TicketModel {

  constructor(ticket) {
    this._ticket = ticket;
  };

  id = () => {
    return this._ticket.id;
  };

  content_description = () => {

  };

}


export class MinimalCube {

  constructor(cube) {
    self._cube = cube;
  }

  name = () => {
    return self._cube.name
  };

  id = () => {
    return self._cube.id
  };

  description = () => {
    return self._cube.description;
  };

  author = () => {
    return self._cube.author
  };

  createdAt = () => {
    return self._cube.created_at
  };

}


export class Cube extends MinimalCube {

  constructor(cube) {
    super(cube);
    self._cube.releases = self._cube.releases.map(
      release => new CubeReleaseMeta(release)
    );
  }

  releases = () => {
    return self._cube.releases
  };

  latestRelease = () => {
    return self._cube.releases[0]
  };

}


export class CubeReleaseMeta {

  constructor(release) {
    this._release = release;
  };

  id = () => {
    return this._release.id
  };

  name = () => {
    return this._release.name
  };

  createdAt = () => {
    return this._release.created_at
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
    return this._release.cube_content.printings
  };

  traps = () => {
    return this._release.cube_content.traps;
  };

  tickets = () => {
    return this._release.cube_content.tickets;
  };

  purples = () => {
    return this._release.cube_content.purples;
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

}