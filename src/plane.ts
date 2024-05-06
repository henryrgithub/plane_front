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
import {
  FromSchema,
  JSONSchema,
  ExtendedJSONSchema,
  FromExtendedSchema,
} from 'json-schema-to-ts';
import {matrixMult3x3} from './helpers';

enum InterruptTypes {
  YAW = 'YAW',
  PITCH = 'PITCH',
  ROLL = 'ROLL',
}

export const bodySchema = {
  $id: 'http://example.com/schemas/bodySchema.json',
  type: 'object',
  properties: {
    name: {type: 'string'},
    posm: {
      type: 'array',
      items: {type: 'number'},
      minItems: 3,
      maxItems: 3,
    },
    lengthm: {type: 'number'},
    heightm: {type: 'number'},
    widthm: {type: 'number'},
    coeffFricUL: {type: 'number'},
  },
  required: ['name', 'posm', 'lengthm', 'heightm', 'widthm', 'coeffFricUL'],
  additionalProperties: false,
} as const;
export type BodySpecs = FromSchema<typeof bodySchema>;

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
    masskg: {
      type: 'number',
    },
    comPosm: {
      type: 'array',
      items: {
        type: 'number',
      },
      minItems: 3,
      maxItems: 3,
    },
    thrustN: {
      type: 'number',
    },
    rotInertiakgm2: {
      type: 'array',
      items: {
        type: 'number',
      },
      minItems: 3,
      maxItems: 3,
    },
    bodies: {
      type: 'array',
      items: {
        //$ref: 'bodySchema.json',
        //$ref: 'http://example.com/schemas/bodySchema.json',
        type: 'object',
        properties: {
          name: {type: 'string'},
          posm: {
            type: 'array',
            items: {type: 'number'},
            minItems: 3,
            maxItems: 3,
          },
          lengthm: {type: 'number'},
          heightm: {type: 'number'},
          widthm: {type: 'number'},
          coeffFricUL: {type: 'number'},
        },
        required: [
          'name',
          'posm',
          'lengthm',
          'heightm',
          'widthm',
          'coeffFricUL',
        ],
        additionalProperties: false,
        //type: 'number',
      },
    },
    surfaces: {
      type: 'array',
      items: {
        //$ref: 'surfaceSchema.json',
        type: 'object',
        properties: {
          name: {type: 'string'},
          mirrored: {type: 'boolean'},
          rootPosm: {
            type: 'array',
            items: {type: 'number'},
            minItems: 3,
            maxItems: 3,
          },
          rotationrad: {type: 'number'},
          foilSections: {
            type: 'array',
            items: {
              //$ref: 'airfoilSchema.json',
              type: 'object',
              properties: {
                name: {type: 'string'},
                rootChordm: {type: 'number'},
                lengthm: {type: 'number'},
                thicknessUL: {type: 'number'},
                cLCurve: {
                  type: 'array',
                  items: {
                    type: 'array',
                    items: {type: 'number'},
                    minItems: 2,
                    maxItems: 2,
                  },
                  minItems: 10,
                },
                cDCurve: {
                  type: 'array',
                  items: {
                    type: 'array',
                    items: {type: 'number'},
                    minItems: 2,
                    maxItems: 2,
                  },
                  minItems: 10,
                },
                cMCurve: {
                  type: 'array',
                  items: {
                    type: 'array',
                    items: {type: 'number'},
                    minItems: 2,
                    maxItems: 2,
                  },
                  minItems: 10,
                },
              },
              required: [
                'name',
                'rootChordm',
                'lengthm',
                'thicknessUL',
                'cLCurve',
                'cDCurve',
                'cMCurve',
              ],
              additionalProperties: false,
              //type: 'airfoilSchema',
            },
            minItems: 1,
          },
          isControlSurface: {type: 'boolean'},
          relActuationPosm: {type: 'number'},
          actuationAxes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                axis: {
                  type: 'string',
                  enum: Object.keys(InterruptTypes),
                },
                invertControl: {type: 'boolean'},
                maxActuation: {type: 'number'},
              },
            },
          },
        },
        required: [
          'name',
          'mirrored',
          'rootPosm',
          'rotationrad',
          'foilSections',
          'isControlSurface',
        ],
        additionalProperties: false,
      },
      minItems: 1,
    },
  },
  required: [
    'bodies',
    'surfaces',
    'created',
    'updated',
    'controlLoops',
    'masskg',
    'comPosm',
    'thrustN',
    'rotInertiakgm2',
  ],
  additionalProperties: false,
} as const;

export type PlaneSpecs = FromSchema<
  typeof planeSchema,
  {
    //references: [typeof bodySchema];
    //references: [typeof surfaceSchema, typeof airfoilSchema, typeof bodySchema];
  }
>;
export const surfaceSchema = {
  $id: 'http://example.com/schemas/surfaceSchema.json',
  type: 'object',
  properties: {
    name: {type: 'string'},
    mirrored: {type: 'boolean'},
    rootPosm: {
      type: 'array',
      items: {type: 'number'},
      minItems: 3,
      maxItems: 3,
    },
    rotationrad: {type: 'number'},
    foilSections: {
      type: 'array',
      items: {
        $ref: 'airfoilSchema.json',
        //type: 'airfoilSchema',
      },
      minItems: 1,
    },
    isControlSurface: {type: 'boolean'},
    relActuationPosm: {type: 'number'},
    actuationAxes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          axis: {
            type: 'string',
            enum: Object.keys(InterruptTypes),
          },
          invertControl: {type: 'boolean'},
          maxActuation: {type: 'number'},
        },
      },
    },
  },
  required: [
    'name',
    'mirrored',
    'rootPosm',
    'rotationrad',
    'foilSections',
    'isControlSurface',
  ],
  additionalProperties: false,
} as const;
export type surfaceSpecs = FromSchema<
  typeof surfaceSchema,
  {
    references: [typeof airfoilSchema];
  }
>;

export const airfoilSchema = {
  $id: 'http://example.com/schemas/airfoilSchema.json',
  type: 'object',
  properties: {
    name: {type: 'string'},
    rootChordm: {type: 'number'},
    lengthm: {type: 'number'},
    thicknessUL: {type: 'number'},
    cLCurve: {
      type: 'array',
      items: {
        type: 'array',
        items: {type: 'number'},
        minItems: 2,
        maxItems: 2,
      },
      minItems: 10,
    },
    cDCurve: {
      type: 'array',
      items: {
        type: 'array',
        items: {type: 'number'},
        minItems: 2,
        maxItems: 2,
      },
      minItems: 10,
    },
    cMCurve: {
      type: 'array',
      items: {
        type: 'array',
        items: {type: 'number'},
        minItems: 2,
        maxItems: 2,
      },
      minItems: 10,
    },
  },
  required: [
    'name',
    'rootChordm',
    'lengthm',
    'thicknessUL',
    'cLCurve',
    'cDCurve',
    'cMCurve',
  ],
  additionalProperties: false,
} as const;
export type FoilSpecs = FromSchema<typeof airfoilSchema>;

class FlightState {
  public velocitymPers: number[];
  public rotRatesradPers: number[];
  public accelerationsmPers2: number[];
  public angAccelerationsradPers2: number[];

  constructor(startingVel = [10, 0, 0]) {
    this.velocitymPers = startingVel;
    this.rotRatesradPers = [0, 0, 0];
    this.accelerationsmPers2 = [0, 0, 0];
    this.angAccelerationsradPers2 = [0, 0, 0];
  }
}

class AeroBody {
  model: THREE.Mesh;
  private lengthm: number;
  private widthm: number;
  private heightm: number;
  private posm: number[];
  private coeffFricUL: number;
  constructor(specsIn: BodySpecs) {
    this.lengthm = specsIn.lengthm;
    this.widthm = specsIn.widthm;
    this.heightm = specsIn.heightm;
    this.posm = specsIn.posm;
    this.coeffFricUL = specsIn.coeffFricUL;
    const boxGeo = new THREE.BoxGeometry(
      this.lengthm,
      this.widthm,
      this.heightm
    );
    const material = new THREE.MeshNormalMaterial();
    const boxMesh = new THREE.Mesh(boxGeo, material);
    boxMesh.translateX(-this.lengthm / 2);
    this.model = boxMesh;
  }
}

class Airfoil {
  private static readonly SWEEP_LE_RAD_STANDIN = 0;
  private static readonly SWEEP_TE_RAD_STANDIN = 0;

  public model: THREE.Mesh;
  private name: string;
  private lengthm: number;
  private relTipPosm: number[];
  private thicknessUL: number;
  private rootChordm: number;
  private sweepLErad: number;
  private sweepTErad: number;
  private tipChordm: number;
  private aeroAream2: number;
  private forcePos: number[];
  private cLCurve: number[][];
  private cDCurve: number[][];
  private cMCurve: number[][];
  constructor(specsIn: FoilSpecs) {
    this.name = specsIn.name;
    this.lengthm = specsIn.lengthm;
    this.rootChordm = specsIn.rootChordm;
    this.thicknessUL = specsIn.thicknessUL;
    this.cLCurve = specsIn.cLCurve;
    this.cDCurve = specsIn.cDCurve;
    this.cMCurve = specsIn.cMCurve;
    this.sweepLErad = Airfoil.SWEEP_LE_RAD_STANDIN;
    this.sweepTErad = Airfoil.SWEEP_TE_RAD_STANDIN;

    const tipXPosm = -Math.tan(this.sweepLErad) * this.lengthm;
    this.relTipPosm = [tipXPosm, this.lengthm, 0.0];
    this.tipChordm =
      this.lengthm * (Math.tan(this.sweepTErad) - Math.tan(this.sweepLErad));
    const taperRatio = this.tipChordm / this.rootChordm;
    const aeroCenterPosY =
      ((this.lengthm / 3) * (1 + 2 * taperRatio)) / (1 + taperRatio);
    const aeroCenterChord =
      aeroCenterPosY * (Math.tan(this.sweepTErad) - Math.tan(this.sweepLErad));
    const aeroCenterPosX =
      -Math.tan(this.sweepLErad) * aeroCenterPosY - 0.25 * aeroCenterChord;
    this.forcePos = [aeroCenterPosX, aeroCenterPosY, 0.0];

    this.aeroAream2 = this.lengthm * this.rootChordm;
    const boxGeo = new THREE.BoxGeometry(
      this.rootChordm,
      this.lengthm,
      this.rootChordm * this.thicknessUL
    );
    const material = new THREE.MeshNormalMaterial();
    const boxMesh = new THREE.Mesh(boxGeo, material);
    boxMesh.translateX(-this.lengthm / 2);
    this.model = boxMesh;
  }

  //calcForces
}

//class AeroForces

class AeroSurface {
  public model: THREE.Group;
  private rootPosm: number[];
  private rotationrad: number;
  private foilSections: Airfoil[];
  constructor(specsIn: surfaceSpecs) {
    this.rootPosm = specsIn.rootPosm;
    this.rotationrad = specsIn.rotationrad;

    this.model = new THREE.Group();
    this.model.translateX(this.rootPosm[0]);
    this.model.translateY(this.rootPosm[1]);
    this.model.translateZ(this.rootPosm[2]);
    this.model.rotateX(this.rotationrad);
    this.foilSections = [];
    for (const foilSpec of specsIn.foilSections) {
      const foil = new Airfoil(foilSpec);
      this.foilSections.push(foil);
      this.model.add(foil.model);
    }
  }
}

export class Plane {
  private static readonly MATERIAL = new THREE.MeshNormalMaterial();
  private aeroBodies: AeroBody[];
  private aeroSurfaces: AeroSurface[];
  model: THREE.Group;
  private planeSpecs: PlaneSpecs;
  private flightState: FlightState;

  constructor(specsIn: PlaneSpecs) {
    this.planeSpecs = specsIn;
    this.model = this.genStandinGeometry(1.1, 0.4, 0.1);
    this.flightState = new FlightState();
    this.aeroSurfaces = [];
    this.aeroBodies = [];
    for (const bodySpec of specsIn.bodies) {
      const body = new AeroBody(bodySpec);
      this.aeroBodies.push(body);
      this.model.add(body.model);
    }
    for (const surfaceSpec of specsIn.surfaces) {
      const surf = new AeroSurface(surfaceSpec);
      this.aeroSurfaces.push(surf);
      this.model.add(surf.model);
    }
  }

  simFrame(timeStep: number) {
    this.perturbPlane(timeStep);
  }

  perturbPlane(timeStep: number) {}

  moveFrame = (time: DOMHighResTimeStamp) => {
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
