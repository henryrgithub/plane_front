import {Vis} from './vis';
import {Plane} from './plane';

export class Sim {
  vis: Vis;
  mainPlane: Plane;

  constructor() {
    this.vis = new Vis();
    this.mainPlane = new Plane(1.1, 0.4, 0.1);
    this.vis.addAircraftModels(this.mainPlane);
  }

  attachTo(element: Element) {
    this.vis.attachTo(element);
  }
}
