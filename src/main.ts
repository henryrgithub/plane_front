import './style.css'
import { vis } from './vis'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <a href="https://vitejs.dev" target="_blank">
    </a>
    <a href="https://www.typescriptlang.org/" target="_blank">
    </a>
    <h1>Little Plane</h1>
  </div>
`
let blah = new vis();
document.body.appendChild(blah.renderer.domElement);
