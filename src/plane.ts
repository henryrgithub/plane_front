// TODO:
// - calc aero forces on aero bodies (only foils done atm)
// - incorporate wind vel (probably just vec, turbulence not worth it)
// - make the planet the frame
import * as THREE from "three";
import {
  FromSchema,
} from "json-schema-to-ts";
//import {matrixMult3x3} from './helpers.ts';
import { createAirfoilGeometry } from "./airfoilGeometry.js";
import { log } from "console";

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
      },
    },
    surfaces: {
      type: "array",
      items: {
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
export type SurfaceSpecs = FromSchema<typeof planeSchema.properties.surfaces.items>;
export type FoilSpecs = FromSchema<typeof planeSchema.properties.surfaces.items.properties.foilSections.items>;

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
      this.heightm,
    );
    //const material = new THREE.MeshNormalMaterial();
    const material = new THREE.MeshPhongMaterial({ color: '#8AC' });
    const boxMesh = new THREE.Mesh(boxGeo, material);
    boxMesh.castShadow = true;
    boxMesh.translateX(-this.lengthm / 2);
    this.model = boxMesh;
  }
}

class Airfoil {
  private static readonly SWEEP_LE_RAD_STANDIN = 0;
  private static readonly SWEEP_TE_RAD_STANDIN = 0;
  private static readonly COEFF_DRAG_FLAT_PARALLEL = 0.005;
  private static readonly COEFF_DRAG_FLAT_PERPENDIC = 1.2;

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
  private posAeroCenter: number[];
  private centroid: number[];
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
    const aeroCenterChord = this.rootChordm + aeroCenterPosY *
      (Math.tan(this.sweepTErad) - Math.tan(this.sweepLErad));
    const aeroCenterPosX = -Math.tan(this.sweepLErad) * aeroCenterPosY -
      0.25 * aeroCenterChord;
    this.posAeroCenter = [aeroCenterPosX, aeroCenterPosY, 0.0];
    const centroidX = -Math.tan(this.sweepLErad) * aeroCenterPosY -
      0.5 * aeroCenterChord;
    this.centroid = [centroidX, aeroCenterPosY, 0.0];

    this.aeroAream2 = (this.rootChordm + this.tipChordm) * this.lengthm / 2;
    const airfoilGeo = createAirfoilGeometry(
      this.lengthm,
      this.sweepLErad,
      this.sweepTErad,
      this.rootChordm,
      this.thicknessUL * this.rootChordm,
      this.thicknessUL * this.tipChordm,
    );
    //const material = new THREE.MeshNormalMaterial();
    const color = new THREE.Color(Math.floor(Math.random() * (256 ** 3)));
    //const simpleMaterial = new THREE.MeshBasicMaterial({color:color});
    const simpleMaterial = new THREE.MeshPhongMaterial({ color: '#8AC' });
    //const simpleMaterial = new THREE.MeshBasicMaterial({
    //  color: color,
    //  side: THREE.DoubleSide,
    //});
    const airfoilMesh = new THREE.Mesh(airfoilGeo, simpleMaterial);
    airfoilMesh.castShadow = true;
    this.model = airfoilMesh;
  }

  getTipCoords(): number[] {
    return this.tipCoords;
  }
  //findForceandMoment(relWindmps: THREE.Vector3,airDenskgPerm3: number, angleOfAttackdeg: number,combinedFlow: number): ForceMovementStruct {
  findForceandMoment(relWindLinmps: THREE.Vector3,airDenskgPerm3: number, rot: THREE.Vector3, coMPos: THREE.Vector3): ForceMovementStruct {
    let relcoMPos = coMPos;
    let coMLeverAdj = new THREE.Vector3(-this.centroid[0],-this.centroid[1],0);
    relcoMPos.sub(coMLeverAdj);
    relcoMPos.negate();
    let rotWindmps = rot.clone();
    rotWindmps.cross(relcoMPos);

    let relWindmps = relWindLinmps.clone().add(rotWindmps);

    let angleOfAttackdeg = Math.atan(-(relWindmps.getComponent(2))/relWindmps.getComponent(0))*180/Math.PI;
    let combinedFlow = Math.sqrt((relWindmps.getComponent(2)**2) + (relWindmps.getComponent(0)**2));
    let aoADefined = this.checkAoA(angleOfAttackdeg);
    let zeroCoordForceMoment = new ForceMovementStruct(new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,0));
    if(aoADefined){
      let dynPressPa = airDenskgPerm3 * (combinedFlow ** 2) / 2
      let cL = this.interpolateCoeff(this.cLCurve,angleOfAttackdeg);
      let lift =  cL * dynPressPa * this.aeroAream2;
      let cD = this.interpolateCoeff(this.cDCurve,angleOfAttackdeg);
      let drag =  cD * dynPressPa * this.aeroAream2;
      let cM = this.interpolateCoeff(this.cMCurve,angleOfAttackdeg);
      let moment = cM * dynPressPa * this.aeroAream2 * (this.rootChordm + this.tipChordm)/2;
      let mainAeroForce = new THREE.Vector3(-drag,0,lift);
      let mainAeroMoment = new THREE.Vector3(0,-moment,0);

      let cross = Airfoil.COEFF_DRAG_FLAT_PARALLEL * airDenskgPerm3 * (relWindmps.getComponent(1) ** 2) * this.aeroAream2;
      let crossAeroForce = new THREE.Vector3(0,cross,0);
      let crossAeroMoment = new THREE.Vector3(0,0,0);
            
      let mainAeroForceMomentUntranslated = new ForceMovementStruct(mainAeroForce,mainAeroMoment);
      let crossAeroForceMomentUntranslated = new ForceMovementStruct(crossAeroForce,crossAeroMoment);

      let mainAeroForceMomentTranslated = mainAeroForceMomentUntranslated.translate(this.posAeroCenter);
      let crossAeroForceMomentTranslated = crossAeroForceMomentUntranslated.translate(this.centroid);

      let combinedForceMoment = mainAeroForceMomentTranslated.sumWith(crossAeroForceMomentTranslated);
      zeroCoordForceMoment = combinedForceMoment.translate(this.rootCoords);
      //return zeroCoordForceMoment;
      //return combinedForceMoment;
    }
    else{
      let cross = Airfoil.COEFF_DRAG_FLAT_PARALLEL * airDenskgPerm3 * (relWindmps.getComponent(1) ** 2) * this.aeroAream2;
      let drag = Airfoil.COEFF_DRAG_FLAT_PARALLEL * airDenskgPerm3 * (relWindmps.getComponent(0) ** 2) * this.aeroAream2;
      let lift = Airfoil.COEFF_DRAG_FLAT_PERPENDIC * airDenskgPerm3 * (relWindmps.getComponent(2) ** 2) * this.aeroAream2;

      let aeroForce = new THREE.Vector3(drag,cross,lift);
      let aeroMoment = new THREE.Vector3(0,0,0);
      let aeroForceMomentUntranslated = new ForceMovementStruct(aeroForce,aeroMoment);
      let aeroForceMomentTranslated = aeroForceMomentUntranslated.translate(this.centroid);
      zeroCoordForceMoment = aeroForceMomentTranslated.translate(this.rootCoords);
      //return zeroCoordForceMoment;
    }
    return zeroCoordForceMoment;
  }
  interpolateCoeff(coeffArray: number[][], angleOfAttackdeg: number): number {
    let aoAs = coeffArray.map((x) => x[0]);
    let i = aoAs.findIndex((x) => x > angleOfAttackdeg) - 1;
    let xStep = aoAs[i+1] - aoAs[i];
    let xDiff = angleOfAttackdeg - aoAs[i];
    let cZero = coeffArray[i][1];
    let cOne = coeffArray[i+1][1];
    let yStep = cOne - cZero;
    return cZero + yStep * (xDiff / xStep);
  }

  checkAoA(aoAdeg: number): boolean {
    //console.log("max AoA " + this.name + ": " + this.cLCurve[this.cLCurve.length-1][0]); 
    //console.log("min AoA " + this.name + ": " + this.cLCurve[0][0]);
    if ((aoAdeg < this.cLCurve[this.cLCurve.length-1][0]) && 
        (aoAdeg > this.cLCurve[0][0])){
      return true;
    }
    return false;
  }

  //calcForces
}

class AeroSurface {
  public model: THREE.Group;
  public name: string;
  public rotationAdj: THREE.Matrix4;
  private isMirror: boolean;
  private rootPosm: number[];
  private rotationrad: number;
  private foilSections: Airfoil[];
  constructor(specsIn: SurfaceSpecs, mirror: boolean) {
    this.isMirror = mirror;
    this.rootPosm = specsIn.rootPosm;
    this.rotationrad = specsIn.rotationrad;
    this.name = specsIn.name;


    this.model = new THREE.Group();
    this.model.translateX(this.rootPosm[0]);
    this.model.translateY(this.rootPosm[1]);
    this.model.translateZ(this.rootPosm[2]);
    this.model.rotateX(this.rotationrad);
    this.foilSections = [];
    this.rotationAdj = new THREE.Matrix4().identity(); //identity technically not needed as cunstructor initializes to identity
    for (const foilSpec of specsIn.foilSections) {
      const foil = new Airfoil(foilSpec, [0, 0, 0]);
      this.foilSections.push(foil);
      this.model.add(foil.model);
    }
    if (mirror) {
      this.rotationAdj.set(-1,0,0,0,
                          0,-1,0,0,
                          0,0,1,0,
                          0,0,0,1);
      this.model.scale.multiply(new THREE.Vector3(1, -1, 1));
      this.model.translateY(this.rootPosm[1] * (-2));
    }
      
  }
  //findForceandMoment(relWindmps: THREE.Vector3, airDenskgPerm3: number, rot: THREE.Vector3, coM: number[]): ForceMovementStruct{
  findForceandMoment(relWindmps: THREE.Vector3, airDenskgPerm3: number, rot: THREE.Vector3, coM: THREE.Vector3): ForceMovementStruct{
    
//      let angleOfAttackdeg = Math.atan(-(relWindmps.getComponent(2))/relWindmps.getComponent(0))*180/Math.PI;
//      let combinedFlow = Math.sqrt((relWindmps.getComponent(2)**2) + (relWindmps.getComponent(0)**2));
      let sumInfluences = new ForceMovementStruct(new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,0));
      let relCoords = [this.model.position.getComponent(0),this.model.position.getComponent(1),this.model.position.getComponent(2)]
      let relCoordsVec = new THREE.Vector3(relCoords[0],relCoords[1],relCoords[2]);
      
      //let relCoMpos = new THREE.Vector3(coM[0],coM[1],coM[2]);
      //relCoMpos.sub(relCoordsVec);
      //relCoMpos.negate();
      let relCoMpos = coM;
      let leverTranslation = new THREE.Vector3(this.rootPosm[0],this.rootPosm[1] * Math.cos(this.rotationrad) + this.rootPosm[2] * Math.sin(this.rotationrad),
                                               this.rootPosm[2] * Math.cos(this.rotationrad) + this.rootPosm[1] * Math.sin(this.rotationrad));
      relCoMpos.sub(leverTranslation);


      for (const foil of this.foilSections) {
        let foilInfluence = foil.findForceandMoment(relWindmps,airDenskgPerm3, rot, relCoMpos);
        sumInfluences = sumInfluences.sumWith(foilInfluence);
      }
      if(this.isMirror){
        sumInfluences = sumInfluences.mirrorAcrossXZ();
      }
      sumInfluences=sumInfluences.translate(relCoords);
      return sumInfluences;
  }
  //isAoADefineddeg(aoaDeg: number){
}
class ForceMovementStruct{
  public forceN: THREE.Vector3;
  public momentNm: THREE.Vector3;
  constructor(forceN: THREE.Vector3, momentNm: THREE.Vector3){
    this.forceN = forceN;
    this.momentNm = momentNm;
  }
  translate(translateFromParam: number[], translateTo: boolean = false): ForceMovementStruct{
    let translateFrom = translateFromParam;
    if(translateTo){
      for (let i of translateFrom) {
        i = -i;
      }
    }
    let forceN = this.forceN.clone();
    let momentNm = this.momentNm.clone();
    let vectorDist = new THREE.Vector3(translateFrom[0],translateFrom[1], translateFrom[2]);
    let translationMomentNm = vectorDist.clone().cross(forceN);
    //let translationMomentNm = forceN.clone().cross(vectorDist);
    let totMoment = momentNm.clone().add(translationMomentNm);
    return new ForceMovementStruct(forceN,totMoment);
  }
  sumWith(toSum: ForceMovementStruct):ForceMovementStruct{
    let forceN = this.forceN.clone().add(toSum.forceN.clone());
    let momentNm = this.momentNm.clone().add(toSum.momentNm.clone());
    return new ForceMovementStruct(forceN,momentNm);
  }
  mirrorAcrossXZ(): ForceMovementStruct{
    let forceN = this.forceN.clone();
    let momentNm = this.momentNm.clone();
    momentNm.setX(-1 * momentNm.getComponent(0));
    momentNm.setZ(-1 * momentNm.getComponent(2));
    return new ForceMovementStruct(forceN,momentNm);
  }
}

class FlightState {
  public velocitymPers: THREE.Vector3;
  public rotRatesradPers: THREE.Vector3;

  constructor(startingVel: THREE.Vector3 = new THREE.Vector3(10,0,1.2), startingRate: THREE.Vector3 = new THREE.Vector3() ) {
    this.velocitymPers = startingVel;
    this.rotRatesradPers = startingRate;
//    this.velocitymPers = new THREE.Vector3;
//    this.velocitymPers.setX(10.0);
//    this.velocitymPers.setY(0.0);
//    this.velocitymPers.setZ(1.2);
//    this.rotRatesradPers = new THREE.Vector3;
  }

  


}
export class Plane {
  private static readonly FUSEHEADONCF = 0.1;
  private static readonly FUSESIDEONCF = 1.0;
  private static readonly FUSESIDONANGRAD = 0.35;
  private static readonly ASLAIRDENSKGPERM3 = 1.225;
  private aeroBodies: AeroBody[];
  private aeroSurfaces: AeroSurface[];
  model: THREE.Group;
  private planeSpecs: PlaneSpecs;
  private flightState: FlightState;
  private coMm: number[];
  private masskg: number;
  private thrustN: number;
  private rotInertiakgm2: number[];

  constructor(specsIn: PlaneSpecs) {
    this.planeSpecs = specsIn;
    this.model = new THREE.Group();
    this.flightState = new FlightState();
    this.aeroSurfaces = [];
    this.aeroBodies = [];
    this.coMm = specsIn.comPosm;
    this.masskg = specsIn.masskg;
    this.thrustN = specsIn.thrustN;
    this.rotInertiakgm2 = specsIn.rotInertiakgm2;
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
    let totReacs = this.calcAeroForces();
    totReacs = totReacs.sumWith( this.calcThrustForce());
    totReacs = totReacs.sumWith(this.calcGravForce());
    this.flightState = this.updateFlightState(time,totReacs);
    //this.calcDisplacements(time);
  }
  updateFlightState(timestep: number, reactions: ForceMovementStruct): FlightState {
    let v0 = this.flightState.velocitymPers.clone();
    let accel = reactions.forceN.divideScalar(this.masskg);
    let v1 = v0.add(accel.multiplyScalar(timestep/1000));
    let r0 = this.flightState.rotRatesradPers.clone();
    let rotInertiaVec = new THREE.Vector3(this.rotInertiakgm2[0],this.rotInertiakgm2[1],this.rotInertiakgm2[2]);
    let angAccel = reactions.momentNm.divide(rotInertiaVec);
    let r1 = r0.add(angAccel.multiplyScalar(timestep/1000));
    return new FlightState(v1,r1);

  }
  calcGravForce(): ForceMovementStruct {
    let moment = new THREE.Vector3(0,0,0);
    let force = new THREE.Vector3(0,0,-this.masskg*9.81);



    let planeQuat = new THREE.Quaternion();
    this.model.getWorldQuaternion(planeQuat);
    let planeQuatInv = planeQuat.clone();
    planeQuatInv.conjugate();
    let worldQuat = new THREE.Quaternion();
    let conj = worldQuat.clone();
    conj.conjugate();
    let relrot = new THREE.Quaternion();
    relrot.multiplyQuaternions(worldQuat,planeQuatInv);
    let relRotMatrix = new THREE.Matrix4;
    relRotMatrix.makeRotationFromQuaternion(relrot);

    let forceTrans = force.applyMatrix4(relRotMatrix);
    return new ForceMovementStruct(forceTrans,moment);
  }
  calcThrustForce(): ForceMovementStruct {
    let moment = new THREE.Vector3(0,0,0);
    let force = new THREE.Vector3(-this.thrustN,0,0);
    return new ForceMovementStruct(force,moment);
  }
  calcAeroForces(windDirec: THREE.Quaternion, windVelmps: number): ForceMovementStruct {
    let planeQuat = new THREE.Quaternion();
    this.model.getWorldQuaternion(planeQuat);
    let planeQuatInv = planeQuat.clone();
    planeQuatInv.conjugate();
    let allInfluences = new ForceMovementStruct(new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,0));
    for (const surf of this.aeroSurfaces) {
      let worldQuat = new THREE.Quaternion();
      surf.model.getWorldQuaternion(worldQuat);
      let conj = worldQuat.clone();
      conj.conjugate();
      let relrot = new THREE.Quaternion();
      relrot.multiplyQuaternions(worldQuat,planeQuatInv);
      let relRotMatrix = new THREE.Matrix4;
      relRotMatrix.makeRotationFromQuaternion(relrot);
      relRotMatrix.multiply(surf.rotationAdj);
      let transformedVelmps = this.flightState.velocitymPers.clone().negate();
      let transformedRotation = this.flightState.rotRatesradPers.clone().negate();
      transformedVelmps.applyMatrix4(relRotMatrix);
      transformedRotation.applyMatrix4(relRotMatrix);
      let transformedCoM = new THREE.Vector3(this.coMm[0],this.coMm[1],this.coMm[2]);
      transformedCoM.applyMatrix4(relRotMatrix);
      let surfaceInfluence = surf.findForceandMoment(transformedVelmps,Plane.ASLAIRDENSKGPERM3,transformedRotation,transformedCoM);
      //let surfaceInfluence = surf.findForceandMoment(transformedVelmps,Plane.ASLAIRDENSKGPERM3,transformedRotation,this.coMm);
      allInfluences = allInfluences.sumWith(surfaceInfluence);
    }
    for (const body of this.aeroBodies) {
      let test = new THREE.Quaternion();
      body.model.getWorldQuaternion(test);
      //console.log(test);
    }
    allInfluences = allInfluences.translate(this.coMm,true);
    console.log(allInfluences);
    return allInfluences;
  }

  moveFrame = (time: DOMHighResTimeStamp) => {
    const pos = new THREE.Vector3();
    this.model.getWorldPosition(pos);
    this.model.position.setZ(1 * Math.sin(time / 1000));
  };
}
