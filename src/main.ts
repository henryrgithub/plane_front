import './style.css';
import {Sim} from './sim';
import {default as defaultPlane} from './default-plane.json';
import Ajv from 'ajv';
import {Plane, PlaneSpecs, planeSchema} from './plane';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="renderWindow">
  </div>
`;

function importPlane(specsIn: PlaneSpecs) {
  let planeSpecs = null;
  try {
    planeSpecs = specsIn as PlaneSpecs;
    const ajv = new Ajv({verbose: true, allErrors: true});
    const validate = ajv.compile(planeSchema);
    const valid = validate(planeSpecs);
    if (!valid) {
      console.log('Plane schema validation errors: ', validate.errors);
      throw "Plane specs don't match schema";
    }
    localSim.addPlane(new Plane(planeSpecs));
  } catch (err) {
    console.error('Error importing plane specs, specific error:');
    console.error(err);
  }
}

const localSim = new Sim();
const renderWindow = document.querySelector('.renderWindow');

/*eslint eqeqeq: 0*/
if (renderWindow != null) localSim.attachTo(renderWindow);

const defPlane = defaultPlane;
importPlane(defPlane);
