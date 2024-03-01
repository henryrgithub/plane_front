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
import {option} from 'fp-ts';
import data from './default-plane.json';

//const specs = require('./default-plane.json');

interface basicGeometry {
  wingspan: number;
  length: number;
  chord: number;
}

enum toControls {
  pitch,
  yaw,
  roll,
}

interface controlLoop {
  frequency: number;
  interrupts: Array<toControls>;
}
interface polyhedronInputs {
  vertices: Array<number>;
  indices: Array<number>;
  radius: number;
  detailDivisor: number;
}

interface planeSpecs {
  apiVersion: number;
  id: number;
  author: string;
  created: string;
  updated: string;
  vertexGeometry?: polyhedronInputs;
  basicGeometry?: basicGeometry;
  controlLoops: Array<controlLoop>;
}
function genBasicPlane(): planeSpecs {
  const basicGeometry = {
    wingspan: 1.1,
    length: 0.4,
    chord: 0.1,
  };
  const interrupts = [toControls.yaw, toControls.pitch, toControls.roll];
  const controlLoop = {
    frequency: 600,
    interrupts: interrupts,
  };
  const controlLoops = [controlLoop];
  const plane = {
    apiVersion: 0.1,
    id: 0,
    author: 'default',
    created: '2024-02-27T05:27:00.000Z',
    updated: '2024-02-27T05:27:00.000Z',
    basicGeometry: basicGeometry,
    controlLoops: controlLoops,
  };
  return plane;
}

export class Plane {
  private static readonly MATERIAL = new THREE.MeshNormalMaterial();
  private wingspan: number;
  private length: number;
  private chord: number;
  model: THREE.Group;
  private planeSpecs: planeSpecs;

  constructor(wingspan: number, length: number, chord: number) {
    this.wingspan = wingspan;
    this.length = length;
    this.chord = chord;
    this.model = this.genStandinGeometry(wingspan, length, chord);
    this.planeSpecs = option.getOrElse(() => genBasicPlane())(
      this.importPlane(JSON.stringify(data))
    );
  }

  importPlane(specsJson: string): option.Option<planeSpecs> {
    let planeSpecsIn;
    try {
      planeSpecsIn = JSON.parse(specsJson);
    } catch (err) {
      console.log(`JSON parse error on plane import. Specific error: ${err}`);
      return option.none;
    }
    if (planeSpecsIn.basicGeometry || planeSpecsIn.vertexGeometry)
      return option.some(planeSpecsIn);
    return option.none;
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
