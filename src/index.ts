import * as style from './_scss/style'

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { mapUVs } from './geometry';
import { decodeTerrainFromTile, generateTerrainGeometry } from './terrain';
import { fetchTerrainTile } from './mapboxTiles';
import { BufferGeometry, Geometry, PerspectiveCamera, Scene, TextureLoader, MeshPhongMaterial, Mesh, HemisphereLight, WebGLRenderer, RepeatWrapping, NearestFilter, DoubleSide } from 'three';

export const mapboxToken = 'pk.eyJ1IjoiamVyemFrbSIsImEiOiJjangxaHF4MGcwN3ZqNGJubzl2Zzdva3N5In0.DRchXs3ESLUuoH9Kh_N-ow'

const location = {
  zoom: 10,
  x: 906,
  y: 404
}

runThreeExample()

async function runThreeExample() {

  const tileImg = await fetchTerrainTile(location.zoom, location.x, location.y)

  const terrain:any = decodeTerrainFromTile(tileImg)

  //geometry width is +1 for better seaming
  const bufferGeometry = generateTerrainGeometry(terrain, tileImg.width+1)
  const geometry = mapUVs(bufferGeometry)

  initThree(geometry)
}

function initThree(geometry: Geometry) {
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
  controls.target.set(0, 5, 0);
  controls.update();

  const texture = new TextureLoader().load(`https://a.tiles.mapbox.com/v4/mapbox.satellite/${location.zoom}/${location.x}/${location.y}@2x.png?access_token=${mapboxToken}`);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.minFilter = NearestFilter
  texture.magFilter = NearestFilter
  texture.repeat.set(1, -1);

  const material = new MeshPhongMaterial({
    map: texture,
    // color: '#ffffff',
    // wireframe: true
    side: DoubleSide,
  });


  const mesh = new Mesh(geometry, material);

  scene.add(mesh);

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
}