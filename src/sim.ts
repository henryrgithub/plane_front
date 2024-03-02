import {Vis} from './vis';
import {Plane} from './plane';

export class Sim {
  private vis: Vis;
  private mainPlane: Plane;

  constructor() {
    this.vis = new Vis();
    this.mainPlane = new Plane();
    this.vis.addAircraftModels(this.mainPlane);
  }

  attachTo(element: Element) {
    this.vis.attachTo(element);
  }
}
