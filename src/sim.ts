import {Vis} from './vis';
import {Plane} from './plane';

export class Sim {
  thisVis: Vis;
  mainPlane: Plane;

  constructor() {
    this.thisVis = new Vis();
    this.mainPlane = new Plane(1.1, 0.4, 0.1);
    this.thisVis.addaircraftModels(this.mainPlane);
  }

  attachTo(element: HTMLElement) {
    this.thisVis.attachTo(element);
  }
}
