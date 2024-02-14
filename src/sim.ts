import * as Vis from './vis';
import * as Plane from './plane';

export class Sim {
  thisVis: Vis.Vis;
  mainPlane: plane.Plane;

  constructor() {
    this.thisVis = new Vis.Vis();
    this.mainPlane = new Plane.Plane();
    this.thisVis.addAircraft(this.mainPlane);
  }
}
