import * as vis from './vis';
import * as plane from './plane';

class sim {
  thisvis: vis.vis;
  mainplane: plane.Plane;

  constructor() {
    this.thisvis = new vis.vis();
    this.mainplane = new plane.Plane();
    this.thisvis.addAircraft(this.mainplane);
  }
}

export {sim};
