import * as THREE from 'three';
import * as plane from './plane';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';

export class Vis {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  aircraft: THREE.Group;
  camControls: OrbitControls;

  constructor() {
    const width = window.innerWidth,
      height = window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(70, width / height, 0.01, 10);
    this.camera.position.z = 1;

    this.scene = new THREE.Scene();

    this.aircraft = new THREE.Group();
    this.aircraft.name = 'aircraft';
    this.scene.add(this.aircraft);

    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.camControls = new OrbitControls(this.camera, this.renderer.domElement);
    this.camControls.update();
    this.renderer.setSize(width, height);
    this.renderer.setAnimationLoop(this.animation);
  }
  animation = (time: DOMHighResTimeStamp) => {
    // time is dead for now but will be used for physics sim
    this.renderer.render(this.scene, this.camera);
  };
  addAircraft(planein: plane.Plane) {
    this.aircraft.add(planein.model);
  }
}
