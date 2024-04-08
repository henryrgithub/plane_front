import {Vis} from './vis';
import {Plane} from './plane';

export class Sim {
  private vis: Vis;
  //private mainPlane: Plane;
  private planes: Plane[];

  constructor() {
    this.vis = new Vis();
    this.planes = [];
    //this.mainPlane = new Plane();
    //const plane = new Plane();
    //this.vis.addAircraftModels(plane);
  }

  addPlane(planeIn: Plane) {
    this.planes.push(planeIn);
    this.vis.addAircraftModels(planeIn);
  }

  attachTo(element: Element) {
    this.vis.attachTo(element);
  }
}
