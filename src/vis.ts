import * as THREE from 'three';
import {Plane} from './plane';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';

export class Vis {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  aircraftModels: THREE.Group;
  camControls: OrbitControls;
  static readonly camFov = 70;
  static readonly camAspectDefault = 1; //should be overwritten on attach or resize
  static readonly camNearFrustum = 0.01;
  static readonly camFarFrustum = 10;

  constructor() {
    this.camera = new THREE.PerspectiveCamera(
      Vis.camFov,
      Vis.camAspectDefault,
      Vis.camNearFrustum,
      Vis.camFarFrustum
    );
    this.camera.position.z = 1;

    this.scene = new THREE.Scene();

    this.aircraftModels = new THREE.Group();
    this.aircraftModels.name = 'aircraftModels';
    this.scene.add(this.aircraftModels);

    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.camControls = new OrbitControls(this.camera, this.renderer.domElement);
    this.camControls.update();

    this.renderer.setAnimationLoop(time => {
      this.drawFrame(time);
    });
  }

  drawFrame(time: DOMHighResTimeStamp) {
    // time is dead for now but will be used for physics sim
    this.renderer.render(this.scene, this.camera);
  }

  addaircraftModels(plane: Plane) {
    this.aircraftModels.add(plane.model);
  }

  attachTo(element: Element) {
    element.appendChild(this.renderer.domElement);
    this.resize(element);
    window.onresize = () => {
      this.resize(element);
    };
  }
  resize(element: Element) {
    const width = element.clientWidth;
    const height = element.clientHeight;
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }
}
