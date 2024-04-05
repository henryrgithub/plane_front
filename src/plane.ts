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
import * as defaultPlane from './default-plane.json';
import {validate} from 'jsonschema';
import {FromSchema} from 'json-schema-to-ts';
//import * as planeSchema from './plane.schema.json';

const planeSchema = {
  type: 'object',
  properties: {
    created: {
      type: 'string',
      description: 'DateTime first created',
    },
    updated: {
      type: 'string',
      description: 'DateTime last modified',
    },
    planeGeometry: {
      oneOf: [
        {
          basicGeometry: {
            type: 'object',
            properties: {
              wingspanMeters: 'number',
              lengthMeters: 'number',
              chordMeters: 'number',
            },
          },
        },
      ],
    },
    controlLoops: {
      type: 'array',
      items: {
        frequencyHz: 'integer',
        interrupts: {
          anyOf: [{pitch: 'bool'}, {yaw: 'bool'}, {roll: 'bool'}],
        },
      },
    },
  },
} as const;

type PlaneSpecs = FromSchema<typeof planeSchema>;

function genBasicPlane(): PlaneSpecs {
  const basicGeometry = {
    wingspan: 1.1,
    length: 0.4,
    chord: 0.1,
  };
  const interrupts = ['yaw', 'pitch', 'roll'];
  const controlLoop = {
    frequency: 600,
    interrupts: interrupts,
  };
  const controlLoops = [controlLoop];
  const plane = {
    created: '2024-02-27T05:27:00.000Z',
    updated: '2024-02-27T05:27:00.000Z',
    basicGeometry: basicGeometry,
    controlLoops: controlLoops,
  };
  return plane;
}

export class Plane {
  private static readonly MATERIAL = new THREE.MeshNormalMaterial();
  private static readonly defaultWingspan = 1.1;
  private static readonly defaultLength = 0.4;
  private static readonly defaultChord = 0.1;
  model: THREE.Group;
  private planeSpecs: PlaneSpecs;

  constructor() {
    this.planeSpecs = this.importPlane(defaultPlane);
    //this.planeSpecs = this.importPlane(JSON.stringify(defaultPlane));
    if (this.planeSpecs.basicGeometry) {
      this.model = this.genStandinGeometry(
        this.planeSpecs.basicGeometry?.wingspan,
        this.planeSpecs.basicGeometry?.length,
        this.planeSpecs.basicGeometry?.chord
      );
    } else {
      this.model = this.genStandinGeometry(
        Plane.defaultWingspan,
        Plane.defaultLength,
        Plane.defaultChord
      );
    }
  }

  importPlane(specsJson: string): PlaneSpecs {
    let planeSpecsIn;
    try {
      planeSpecsIn = JSON.parse(specsJson);
    } catch (err) {
      console.log(`JSON parse error on plane import. Specific error: ${err}`);
      return genBasicPlane();
    }
    console.log('heyo');
    console.log(validate(planeSpecsIn, planeSchema));
    return genBasicPlane();
  }

  importPlaneOld(specsJson: string): option.Option<planeSpecs> {
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
