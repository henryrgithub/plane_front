/* Based on the BoxGeometry module from threeJS, license below:

The MIT License

Copyright © 2010-2024 three.js authors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.*/

import { BufferGeometry,Float32BufferAttribute, Vector3} from 'three';


	export function createAirfoilGeometry( length, leSweepRad, teSweepRad, rootChord, roothThk, tipThk) {

    const leTipX = -Math.tan(leSweepRad)*length;
    const teTipX = -rootChord - Math.tan(teSweepRad)*length;

  //normals don't seem to work, need to use double-side materials right now
  const frontNorm = [Math.cos(leSweepRad),Math.sin(leSweepRad),0];
  const rearNorm = [-Math.cos(teSweepRad),-Math.sin(teSweepRad),0];
  const topNorm = new Vector3(0,(roothThk - tipThk)/2,-length).normalize().toArray();
  const botNorm = new Vector3(0,(roothThk - tipThk)/2,length).normalize().toArray();
  const rootNorm = [0,-1,0];
  const tipNorm = [0,1,0];

    const inputVertices = [
      [0,0,-roothThk/2,],
      [leTipX,length,-tipThk/2,],
      [leTipX,length,tipThk/2,],
      [0,0,roothThk/2,],
      [-rootChord,0,-roothThk/2,],
      [teTipX,length,-tipThk/2,],
      [teTipX,length,tipThk/2,],
      [-rootChord,0,roothThk/2],
    ];

  let positionsToUse = [];
  let normalsToUse = [];
  const indicesToUse = [];
  let index = 0;
  buildPlane(inputVertices[0],inputVertices[1],inputVertices[2],inputVertices[3],frontNorm);
  buildPlane(inputVertices[4],inputVertices[5],inputVertices[6],inputVertices[7],rearNorm);
  buildPlane(inputVertices[1],inputVertices[5],inputVertices[6],inputVertices[2],tipNorm);
  buildPlane(inputVertices[0],inputVertices[4],inputVertices[7],inputVertices[3],rootNorm);
  buildPlane(inputVertices[0],inputVertices[1],inputVertices[5],inputVertices[4],topNorm);
  buildPlane(inputVertices[3],inputVertices[2],inputVertices[6],inputVertices[7],botNorm);

  const geometry = new BufferGeometry();
  geometry.setIndex(indicesToUse);
  geometry.setAttribute( 'position', new Float32BufferAttribute( positionsToUse, 3 ) );
  geometry.setAttribute( 'normal', new Float32BufferAttribute( normalsToUse, 3 ) );

  return geometry;

  function buildPlane(p0,p1,p2,p3,normal){
    positionsToUse = positionsToUse.concat(p0,p1,p2,p3);
    for(let i = 0; i<4;i++){
      normalsToUse = normalsToUse.concat(normal);
    }
    indicesToUse.push(index,index+1,index+2);
    indicesToUse.push(index,index+2,index+3);
    index+=4;
	}
}




