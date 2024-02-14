// todo:
// - pitch ctrl derivs

import * as mathjs from 'mathjs';
import * as THREE from 'three';

class Plane {
  wingspan: number;
  length: number;
  chord: number;
  model: THREE.Group;

  //flightTensor: [[number]];
  constructor() {
    /*this.flightTensor = [

    ]*/
    this.wingspan = 0.9;
    this.length = 0.6;
    this.chord = 0.08;
    const boxgeo = new THREE.BoxGeometry(
      this.wingspan,
      this.length,
      this.length * this.chord
    );
    const conegeo = new THREE.ConeGeometry(
      this.wingspan * 0.1,
      this.chord * 1.1,
      50,
      16
    );
    const mat = new THREE.MeshNormalMaterial();
    const boxmesh = new THREE.Mesh(boxgeo, mat);
    const conemesh = new THREE.Mesh(conegeo, mat);
    this.model = new THREE.Group();
    this.model.add(boxmesh);
    this.model.add(conemesh);
  }
}

export {Plane};
