// todo:
// - Create pitch control derivatives
// -- This will allow plane-specific physics calculations
// -- Implement these derivatives as a tensor to allow sensible matrix mult
// -- Use mathjs for matrix mult implementation
// - Create geometry more dynamically
// -- Import structure that represents shape of plane, conver to group of extrudeGeometries
// -- Have default geometry
// -- Remove boxMesh and coneMesh

import * as THREE from 'three';

export class Plane {
  wingspan: number;
  length: number;
  chord: number;
  model: THREE.Group;

  constructor(wingspan: number, length: number, chord: number) {
    this.wingspan = wingspan;
    this.length = length;
    this.chord = chord;
    this.model = this.genStandinGeometry(wingspan, length, chord);
  }

  genStandinGeometry(
    wingspan: number,
    length: number,
    chord: number
  ): THREE.Group {
    const boxGeo = new THREE.BoxGeometry(wingspan, length, length * chord);
    const coneGeo = new THREE.ConeGeometry(wingspan * 0.1, chord * 1.1, 50, 1);
    const mat = new THREE.MeshNormalMaterial();
    const boxMesh = new THREE.Mesh(boxGeo, mat);
    const coneMesh = new THREE.Mesh(coneGeo, mat);
    const model = new THREE.Group();
    model.add(boxMesh);
    model.add(coneMesh);
    return model;
  }
}
