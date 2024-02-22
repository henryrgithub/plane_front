import './style.css';
import {Sim} from './sim';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="renderWindow">
  </div>
`;
const localSim = new Sim();
const renderWindow = document.querySelector('.renderWindow');

if (renderWindow != null) localSim.attachTo(renderWindow);
