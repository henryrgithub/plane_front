import './style.css';
import {Sim} from './sim';
import * as defaultPlane from './default-plane.json';
import {validate} from 'jsonschema';
import {Plane, PlaneSpecs, planeSchema} from './plane';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="renderWindow">
  </div>
`;

function importPlane(specsIn: PlaneSpecs) {
  let planeSpecs = null;
  try {
    planeSpecs = specsIn as PlaneSpecs;
    const valid = validate(planeSpecs, planeSchema);
    if (!valid) throw "Plane specs don't match schema";
    localSim.addPlane(new Plane(planeSpecs));
  } catch (err) {
    console.error('Error importing plane specs, specific error:');
    console.error(err);
    alert('Error importing plane specs');
  }
}

const localSim = new Sim();
const renderWindow = document.querySelector('.renderWindow');

/*eslint eqeqeq: 0*/
if (renderWindow != null) localSim.attachTo(renderWindow);

importPlane(defaultPlane);
