import {Vis} from './vis';
import {Plane} from './plane';

export class Sim {
  private vis: Vis;
  private planes: Plane[];
  private static readonly SIMRATEHZ = 120;
  private static readonly MAXFRAMERATEHZ = 60;
  private simPast: number;

  constructor() {
    this.vis = new Vis();
    this.planes = [];
    this.simPast = 1/Sim.MAXFRAMERATEHZ;
    this.vis.addAnimationCallback(this.simOnFrame)
  }

  simOnFrame = (time: DOMHighResTimeStamp) => {
    for (const plane of this.planes){
      for (let i = 0; i < (Sim.SIMRATEHZ/Sim.MAXFRAMERATEHZ);i++){
        plane.simFrame(1000/Sim.SIMRATEHZ);
      }
    }
  }

  addPlane(planeIn: Plane) {
    this.planes.push(planeIn);
    this.vis.addAircraftModels(planeIn);
  }

  attachTo(element: Element) {
    this.vis.attachTo(element);
  }
}
