import './style.css';
import * as sim from './sim';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <a href="https://vitejs.dev" target="_blank">
    </a>
    <a href="https://www.typescriptlang.org/" target="_blank">
    </a>
    <!--<h1>Little Plane</h1>-->
  </div>
`;
const localsim = new sim.sim();
document.body.appendChild(localsim.thisvis.renderer.domElement);
