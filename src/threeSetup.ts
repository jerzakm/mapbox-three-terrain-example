import { WebGLRenderer, PerspectiveCamera, Scene, HemisphereLight } from "three"
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls"

export const initThreeCanvasScene = () => {
    const threeCanvas = document.createElement('canvas')
    threeCanvas.height = 1080
    threeCanvas.width = 1920
    threeCanvas.style.position = 'fixed'
    threeCanvas.style.left = '0px'
    document.body.appendChild(threeCanvas)

    const renderer = new WebGLRenderer({ canvas: threeCanvas, alpha: true });

    const fov = 90;
    const aspect = 2;
    const near = 0.1;
    const far = 5000;

    const camera = new PerspectiveCamera(fov, aspect, near, far);

    const scene = new Scene();

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.update();

    const skyColor = 0xFFFFFF;
    const groundColor = 0xAAAAAA;
    const intensity = 1;
    const light = new HemisphereLight(skyColor, groundColor, intensity);
    scene.add(light);

    light.position.set(220, 199, 164);

    camera.position.set(220, 199, 164);

    animate()

    function animate() {
      requestAnimationFrame(animate);

      controls.update();

      renderer.render(scene, camera);

    }

    return {renderer, scene, camera}
  }

