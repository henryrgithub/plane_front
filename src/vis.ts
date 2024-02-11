import * as THREE from 'three'

class vis {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  mesh: THREE.Mesh;

  constructor() {
    const width = window.innerWidth, height = window.innerHeight;

this.camera = new THREE.PerspectiveCamera( 70, width / height, 0.01, 10 );
this.camera.position.z = 1;

this.scene = new THREE.Scene();

const geometry = new THREE.BoxGeometry( 0.2, 0.2, 0.2 );
const material = new THREE.MeshNormalMaterial();

this.mesh = new THREE.Mesh( geometry, material );
this.scene.add( this.mesh );

this.renderer = new THREE.WebGLRenderer( { antialias: true } );
this.renderer.setSize( width, height );
this.renderer.setAnimationLoop( this.animation );
  }
animation = ( time: DOMHighResTimeStamp ) => {
	this.mesh.rotation.x = time / 2000;
	this.mesh.rotation.y = time / 1000;
	this.renderer.render( this.scene, this.camera );
}
}
export {
  vis,
}
