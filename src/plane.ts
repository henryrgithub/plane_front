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
  private static readonly MATERIAL = new THREE.MeshNormalMaterial();
  private wingspan: number;
  private length: number;
  private chord: number;
  private model: THREE.Group;

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
    const model = new THREE.Group();
    const boxGeo = new THREE.BoxGeometry(wingspan, length, length * chord);
    model.add(new THREE.Mesh(boxGeo, Plane.MATERIAL));
    const coneGeo = new THREE.ConeGeometry(wingspan * 0.1, chord * 1.1, 50, 1);
    model.add(new THREE.Mesh(coneGeo, Plane.MATERIAL));
    return model;
  }
}
