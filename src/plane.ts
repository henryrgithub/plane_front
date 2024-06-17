// todo:
// - Create pitch control derivatives
// -- This will allow plane-specific physics calculations
// -- Implement these derivatives as a tensor to allow sensible matrix mult
// -- Use mathjs for matrix mult implementation
// - Create geometry more dynamically
// -- Import structure that represents shape of plane, conver to group of extrudeGeometries
// -- Have default geometry
// -- Remove boxMesh and coneMesh

import * as THREE from "three";
import {
  ExtendedJSONSchema,
  FromExtendedSchema,
  FromSchema,
  JSONSchema,
} from "json-schema-to-ts";
//import {matrixMult3x3} from './helpers.ts';
import { createAirfoilGeometry } from "./airfoilGeometry.js";

enum InterruptTypes {
  YAW = "YAW",
  PITCH = "PITCH",
  ROLL = "ROLL",
}

export const planeSchema = {
  type: "object",
  properties: {
    created: {
      type: "string",
      description: "DateTime first created",
    },
    updated: {
      type: "string",
      description: "DateTime last modified",
    },
    controlLoops: {
      type: "array",
      items: {
        type: "object",
        properties: {
          frequencyHz: { type: "integer" },
          interrupts: {
            type: "array",
            items: {
              type: "string",
              enum: Object.keys(InterruptTypes),
            },
          },
        },
        required: ["frequencyHz", "interrupts"],
        additionalProperties: false,
      },
    },
    masskg: {
      type: "number",
    },
    comPosm: {
      type: "array",
      items: {
        type: "number",
      },
      minItems: 3,
      maxItems: 3,
    },
    thrustN: {
      type: "number",
    },
    rotInertiakgm2: {
      type: "array",
      items: {
        type: "number",
      },
      minItems: 3,
      maxItems: 3,
    },
    bodies: {
      type: "array",
      items: {
        //$ref: 'bodySchema.json',
        //$ref: 'http://example.com/schemas/bodySchema.json',
        type: "object",
        properties: {
          name: { type: "string" },
          posm: {
            type: "array",
            items: { type: "number" },
            minItems: 3,
            maxItems: 3,
          },
          lengthm: { type: "number" },
          heightm: { type: "number" },
          widthm: { type: "number" },
          coeffFricUL: { type: "number" },
        },
        required: [
          "name",
          "posm",
          "lengthm",
          "heightm",
          "widthm",
          "coeffFricUL",
        ],
        additionalProperties: false,
        //type: 'number',
      },
    },
    surfaces: {
      type: "array",
      items: {
        //$ref: 'surfaceSchema.json',
        type: "object",
        properties: {
          name: { type: "string" },
          mirrored: { type: "boolean" },
          rootPosm: {
            type: "array",
            items: { type: "number" },
            minItems: 3,
            maxItems: 3,
          },
          rotationrad: { type: "number" },
          foilSections: {
            type: "array",
            items: {
              //$ref: 'airfoilSchema.json',
              type: "object",
              properties: {
                name: { type: "string" },
                rootChordm: { type: "number" },
                lengthm: { type: "number" },
                thicknessUL: { type: "number" },
                cLCurve: {
                  type: "array",
                  items: {
                    type: "array",
                    items: { type: "number" },
                    minItems: 2,
                    maxItems: 2,
                  },
                  minItems: 10,
                },
                cDCurve: {
                  type: "array",
                  items: {
                    type: "array",
                    items: { type: "number" },
                    minItems: 2,
                    maxItems: 2,
                  },
                  minItems: 10,
                },
                cMCurve: {
                  type: "array",
                  items: {
                    type: "array",
                    items: { type: "number" },
                    minItems: 2,
                    maxItems: 2,
                  },
                  minItems: 10,
                },
              },
              required: [
                "name",
                "rootChordm",
                "lengthm",
                "thicknessUL",
                "cLCurve",
                "cDCurve",
                "cMCurve",
              ],
              additionalProperties: false,
              //type: 'airfoilSchema',
            },
            minItems: 1,
          },
          isControlSurface: { type: "boolean" },
          relActuationPosm: { type: "number" },
          actuationAxes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                axis: {
                  type: "string",
                  enum: Object.keys(InterruptTypes),
                },
                invertControl: { type: "boolean" },
                maxActuation: { type: "number" },
              },
            },
          },
        },
        required: [
          "name",
          "mirrored",
          "rootPosm",
          "rotationrad",
          "foilSections",
          "isControlSurface",
        ],
        additionalProperties: false,
      },
      minItems: 1,
    },
  },
  required: [
    "bodies",
    "surfaces",
    "created",
    "updated",
    "controlLoops",
    "masskg",
    "comPosm",
    "thrustN",
    "rotInertiakgm2",
  ],
  additionalProperties: false,
} as const;
export type PlaneSpecs = FromSchema<typeof planeSchema>;
export type BodySpecs = FromSchema<typeof planeSchema.properties.bodies.items>;
export type SurfaceSpecs = FromSchema<
  typeof planeSchema.properties.surfaces.items
>;
export type FoilSpecs = FromSchema<
  typeof planeSchema.properties.surfaces.items.properties.foilSections.items
>;

class AeroBody {
  model: THREE.Mesh;
  private lengthm: number;
  private widthm: number;
  private heightm: number;
  private posm: number[];
  private coeffFricUL: number;
  //constructor(specsIn: BodySpecs) {
  constructor(specsIn: BodySpecs) {
    this.lengthm = specsIn.lengthm;
    this.widthm = specsIn.widthm;
    this.heightm = specsIn.heightm;
    this.posm = specsIn.posm;
    this.coeffFricUL = specsIn.coeffFricUL;
    const boxGeo = new THREE.BoxGeometry(
      this.lengthm,
      this.widthm,
      this.heightm,
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
  private rootCoords: number[];
  private tipCoords: number[];
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
  constructor(specsIn: FoilSpecs, coordsIn: number[]) {
    this.name = specsIn.name;
    this.lengthm = specsIn.lengthm;
    this.rootChordm = specsIn.rootChordm;
    this.thicknessUL = specsIn.thicknessUL;
    this.cLCurve = specsIn.cLCurve;
    this.cDCurve = specsIn.cDCurve;
    this.cMCurve = specsIn.cMCurve;
    this.sweepLErad = Airfoil.SWEEP_LE_RAD_STANDIN;
    this.sweepTErad = Airfoil.SWEEP_TE_RAD_STANDIN;
    this.rootCoords = coordsIn;

    const tipXPosm = -Math.tan(this.sweepLErad) * this.lengthm;
    this.relTipPosm = [tipXPosm, this.lengthm, 0.0];
    this.tipCoords = [
      this.relTipPosm[0] + this.rootCoords[0],
      this.relTipPosm[1] + this.rootCoords[1],
      this.relTipPosm[2] + this.rootCoords[2],
    ];
    this.tipChordm = this.rootChordm -
      this.lengthm * (Math.tan(this.sweepTErad) - Math.tan(this.sweepLErad));
    const taperRatio = this.tipChordm / this.rootChordm;
    const aeroCenterPosY = ((this.lengthm / 3) * (1 + 2 * taperRatio)) /
      (1 + taperRatio);
    const aeroCenterChord = aeroCenterPosY *
      (Math.tan(this.sweepTErad) - Math.tan(this.sweepLErad));
    const aeroCenterPosX = -Math.tan(this.sweepLErad) * aeroCenterPosY -
      0.25 * aeroCenterChord;
    this.forcePos = [aeroCenterPosX, aeroCenterPosY, 0.0];

    this.aeroAream2 = this.lengthm * this.rootChordm;

    const airfoilGeo = createAirfoilGeometry(
      this.lengthm,
      this.sweepLErad,
      this.sweepTErad,
      this.rootChordm,
      this.thicknessUL * this.rootChordm,
      this.thicknessUL * this.tipChordm,
    );

    const boxGeo = new THREE.BoxGeometry(
      this.rootChordm,
      this.lengthm,
      this.rootChordm * this.thicknessUL,
    );
    const material = new THREE.MeshNormalMaterial();
    const color = new THREE.Color(Math.floor(Math.random() * (256 ** 3)));
    //const simpleMaterial = new THREE.MeshBasicMaterial({color:color});
    const simpleMaterial = new THREE.MeshBasicMaterial({
      color: color,
      side: THREE.DoubleSide,
    });
    const boxMesh = new THREE.Mesh(boxGeo, material);
    //boxMesh.translateY(-this.lengthm);// 2);
    const airfoilMesh = new THREE.Mesh(airfoilGeo, simpleMaterial);
    this.model = airfoilMesh;
    //this.model = boxMesh;
  }

  getTipCoords(): number[] {
    return this.tipCoords;
  }

  //calcForces
}

//class AeroForces

class AeroSurface {
  public model: THREE.Group;
  private isMirror: boolean;
  private rootPosm: number[];
  private rotationrad: number;
  private foilSections: Airfoil[];
  constructor(specsIn: SurfaceSpecs, mirror: boolean) {
    this.isMirror = mirror;
    this.rootPosm = specsIn.rootPosm;
    this.rotationrad = specsIn.rotationrad;

    this.model = new THREE.Group();
    this.model.translateX(this.rootPosm[0]);
    this.model.translateY(this.rootPosm[1]);
    this.model.translateZ(this.rootPosm[2]);
    this.model.rotateX(this.rotationrad);
    this.foilSections = [];
    for (const foilSpec of specsIn.foilSections) {
      const foil = new Airfoil(foilSpec, [0, 0, 0]);
      this.foilSections.push(foil);
      this.model.add(foil.model);
    }
    if (mirror) {
      this.model.scale.multiply(new THREE.Vector3(1, -1, 1));
      this.model.translateY(this.rootPosm[1] * (-2));
    }
  }
}

class FlightState {
  public velocitymPers: number[];
  public rotRatesradPers: number[];

  constructor(startingVel = [10, 0, 0]) {
    this.velocitymPers = startingVel;
    this.rotRatesradPers = [0, 0, 0];
  }
}
export class Plane {
  private static readonly MATERIAL = new THREE.MeshNormalMaterial();
  private static readonly FUSEHEADONCF = 0.1;
  private static readonly FUSESIDEONCF = 1.0;
  private static readonly FUSESIDONANGRAD = 0.35;
  private aeroBodies: AeroBody[];
  private aeroSurfaces: AeroSurface[];
  model: THREE.Group;
  private planeSpecs: PlaneSpecs;
  private flightState: FlightState;

  constructor(specsIn: PlaneSpecs) {
    this.planeSpecs = specsIn;
    this.model = new THREE.Group();
    this.flightState = new FlightState();
    this.aeroSurfaces = [];
    this.aeroBodies = [];
    for (const bodySpec of specsIn.bodies) {
      const body = new AeroBody(bodySpec);
      this.aeroBodies.push(body);
      this.model.add(body.model);
    }
    for (const surfaceSpec of specsIn.surfaces) {
      const surf = new AeroSurface(surfaceSpec, false);
      this.aeroSurfaces.push(surf);
      this.model.add(surf.model);
      if (surfaceSpec.mirrored) {
        const mirrorSurf = new AeroSurface(surfaceSpec, true);
        this.aeroSurfaces.push(mirrorSurf);
        this.model.add(mirrorSurf.model);
      }
    }
  }

  simFrame(time: number) {
    this.calcAeroForces();
    //this.calcThurstForce();
    //this.calcAccelerations(time);
    //this.calcDisplacements(time);
  }
  calcAeroForces(): THREE.Vector3 {
    let planeQuat = new THREE.Quaternion();
    this.model.getWorldQuaternion(planeQuat);
    console.log(planeQuat);
    for (const surf of this.aeroSurfaces) {
      let test = new THREE.Quaternion();
      surf.model.getWorldQuaternion(test);
      console.log(test);
    }
    for (const body of this.aeroBodies) {
      let test = new THREE.Quaternion();
      body.model.getWorldQuaternion(test);
      //console.log(test);
    }
  }

  moveFrame = (time: DOMHighResTimeStamp) => {
    const pos = new THREE.Vector3();
    this.model.getWorldPosition(pos);
    this.model.position.setZ(1 * Math.sin(time / 1000));
  };
}
