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
import {FromSchema} from 'json-schema-to-ts';

enum InterruptTypes {
  YAW,
  PITCH,
  ROLL,
}

export const planeSchema = {
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
      type: 'object',
      oneOf: [
        {
          type: 'object',
          properties: {
            wingspanMeters: {type: 'number'},
            lengthMeters: {type: 'number'},
            chordMeters: {type: 'number'},
          },
          required: ['wingspanMeters', 'lengthMeters', 'chordMeters'],
          additionalProperties: false,
        },
      ],
    },
    controlLoops: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          frequencyHz: {type: 'integer'},
          interrupts: {
            type: 'array',
            items: {
              type: 'string',
              enum: Object.keys(InterruptTypes),
            },
          },
        },
        required: ['frequencyHz', 'interrupts'],
        additionalProperties: false,
      },
    },
  },
  required: ['created', 'updated', 'planeGeometry', 'controlLoops'],
  additionalProperties: false,
} as const;

export type PlaneSpecs = FromSchema<typeof planeSchema>;

export function genBasicPlane(): PlaneSpecs {
  const basicGeometry = {
    wingspanMeters: 1.1,
    lengthMeters: 0.4,
    chordMeters: 0.1,
  };
  const interrupts = ['YAW', 'PITCH', 'ROLL'];
  const controlLoop = {
    frequencyHz: 600,
    interrupts: interrupts,
  };
  const controlLoops = [controlLoop];
  const plane: PlaneSpecs = {
    created: '2024-02-27T05:27:00.000Z',
    updated: '2024-02-27T05:27:00.000Z',
    planeGeometry: basicGeometry,
    controlLoops: controlLoops,
  };
  return plane;
}

export class Plane {
  private static readonly MATERIAL = new THREE.MeshNormalMaterial();
  model: THREE.Group;
  private planeSpecs: PlaneSpecs;
  private localVel: number[];

  constructor(specsIn: PlaneSpecs) {
    this.planeSpecs = specsIn;
    this.model = this.genStandinGeometry(
      this.planeSpecs.planeGeometry.wingspanMeters,
      this.planeSpecs.planeGeometry.lengthMeters,
      this.planeSpecs.planeGeometry.chordMeters
    );
    this.localVel = Array(6).fill(0.0);
  }

  simFrame = (time: DOMHighResTimeStamp) => {
    const pos = new THREE.Vector3();
    this.model.getWorldPosition(pos);
    this.model.position.setZ(1 * Math.sin(time / 1000));
  };

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
