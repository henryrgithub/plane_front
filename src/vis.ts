import * as THREE from 'three';
import {Plane} from './plane';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';

export class Vis {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private aircraftModels: THREE.Group;
  private camControls: OrbitControls;
  private static readonly camFov = 70;
  private static readonly camAspectDefault = 1; //should be overwritten on attach or resize
  private static readonly camNearFrustum = 0.01;
  private static readonly camFarFrustum = 10;
  public animationCallbacks: Function[];

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

    this.animationCallbacks = [];
    this.addAnimationCallback(this.drawFrame);
  }

  addAnimationCallback(funcIn: Function) {
    this.animationCallbacks.push(funcIn);
    this.attachFrameUpdateCallbacks();
  }

  attachFrameUpdateCallbacks() {
    this.renderer.setAnimationLoop(time => {
      for (let i = 0; i < this.animationCallbacks.length; i++) {
        this.animationCallbacks[i](time);
      }
    });
  }

  drawFrame = (time: DOMHighResTimeStamp) => {
    this.renderer.render(this.scene, this.camera);
  };

  addAircraftModels(plane: Plane) {
    this.aircraftModels.add(plane.model);
    this.addAnimationCallback(plane.moveFrame);
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
