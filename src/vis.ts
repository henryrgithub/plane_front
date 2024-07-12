import * as THREE from 'three';
import {Plane} from './plane';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';

export class Vis {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private light: THREE.DirectionalLight;
  private camera: THREE.PerspectiveCamera;
  private aircraftModels: THREE.Group;
  private ground: THREE.Group;
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
    this.camera.position.set( 0, -1, 1.5 );

    this.scene = new THREE.Scene();

    const color = 0xFFFFFF;
		const intensity = 3;
		this.light = new THREE.DirectionalLight( color, intensity );
    this.light.castShadow = true;
    this.light.shadow.mapSize.width = 512; // default
    this.light.shadow.mapSize.height = 512;
		this.light.position.set( 5, 0, 10 );
    //this.light.rotateX(1.7);
		this.light.target.position.set( 0 , 0, 0 );
		this.scene.add( this.light );
		this.scene.add( this.light.target );

    this.aircraftModels = new THREE.Group();
    this.aircraftModels.name = 'aircraftModels';
    this.scene.add(this.aircraftModels);

    this.ground = this.makeGround();
    this.ground.name = 'ground';
    this.scene.add(this.ground);

    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.shadowMap.enabled = true;
    //this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.camControls = new OrbitControls(this.camera, this.renderer.domElement);
    this.camControls.update();

    this.animationCallbacks = [];
    this.addAnimationCallback(this.drawFrame);
  }

  makeGround(): THREE.Group {
    const planeSize = 20;
    const loader = new THREE.TextureLoader();
    const texture = loader.load( 'https://cdn.polyhaven.com/asset_img/primary/brown_mud_leaves_01.png' );
    //const texture = loader.load( 'https://threejs.org/manual/examples/resources/images/checker.png' );
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.NearestFilter;
    //texture.colorSpace = THREE.SRGBColorSpace;
    const repeats = planeSize / 2;
    texture.repeat.set( repeats, repeats );
    const planeGeo = new THREE.PlaneGeometry( planeSize, planeSize );
    const planeMat = new THREE.MeshPhongMaterial( {
      //color: 0x49eb34
      map: texture,
      side: THREE.DoubleSide,
    } );
    const mesh = new THREE.Mesh( planeGeo, planeMat );
    mesh.receiveShadow = true;

    const groundGroup = new THREE.Group();
    groundGroup.add(mesh);
    return groundGroup;

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
