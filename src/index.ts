import * as style from './_scss/style'
import * as THREE from 'three'

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { mapUVs } from './geometry';
import { decodeTerrainFromTile, generateTerrainGeometry } from './terrain';
import { fetchTerrainTile } from './mapboxTiles';

export const mapboxToken = 'pk.eyJ1IjoiamVyemFrbSIsImEiOiJjangxaHF4MGcwN3ZqNGJubzl2Zzdva3N5In0.DRchXs3ESLUuoH9Kh_N-ow'

const location = {
  zoom: 10,
  x: 906,
  y: 404
}

const threeCanvas = document.createElement('canvas')
threeCanvas.height = 1080
threeCanvas.width = 1920
threeCanvas.style.position = 'fixed'
threeCanvas.style.left = '0px'
const renderer = new THREE.WebGLRenderer({ canvas: threeCanvas, alpha: true });
document.body.appendChild(threeCanvas)

runThreeExample()

async function runThreeExample() {

  const tileImg = await fetchTerrainTile(location.zoom, location.x, location.y)
  const terrain = decodeTerrainFromTile(tileImg)

  initThree(terrain)
}

function initThree(terrain: Float32Array) {
  const geoTest = generateTerrainGeometry(terrain, 257)

  const geometry = new THREE.Geometry().fromBufferGeometry(geoTest)
  mapUVs(geometry)
  geometry.uvsNeedUpdate = true;

  const fov = 90;
  const aspect = 2;  // the canvas default
  const near = 0.1;
  const far = 5000;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

  const scene = new THREE.Scene();

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 5, 0);
  controls.update();

  const texture = new THREE.TextureLoader().load(`https://a.tiles.mapbox.com/v4/mapbox.satellite/${location.zoom}/${location.x}/${location.y}@2x.png?access_token=${mapboxToken}`);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.minFilter = THREE.NearestFilter
  texture.magFilter = THREE.NearestFilter
  texture.repeat.set(1, -1);

  const material = new THREE.MeshPhongMaterial({
    map: texture,
    // color: '#ffffff',
    // wireframe: true
    side: THREE.DoubleSide,
  });


  const mesh = new THREE.Mesh(geometry, material);

  scene.add(mesh);

  const skyColor = 0xFFFFFF;
  const groundColor = 0xAAAAAA;
  const intensity = 1;
  const light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
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