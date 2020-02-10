import * as style from './_scss/style'
import * as THREE from 'three'

const martini = require('@mapbox/martini')

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { WireframeGeometry } from 'three';
import { fetchImage } from './util';
import { mapUVs } from './geometry';
import { decodeTerrain, generateTerrainGeometry } from './terrain';
import { fetchTerrainTile } from './mapboxTiles';

// set up mesh generator for a certain 2^k+1 grid size
const martiniInstance = new martini.default(257);

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

start()

async function start() {
  const tileImg = await fetchTerrainTile(location.zoom, location.x, location.y)
  const tileSize = tileImg.width

  const textureCanvas = document.createElement('canvas')
  textureCanvas.height = screen.height
  textureCanvas.width = screen.width
  const ctx = textureCanvas.getContext('2d')

  if (ctx) {
    ctx.drawImage(tileImg, 0, 0);
    const data = ctx.getImageData(0, 0, tileSize, tileSize).data;
    const terrain = decodeTerrain(data, tileSize)

    // generate RTIN hierarchy from terrain data (an array of size^2 length)
    const tile = martiniInstance.createTile(terrain);
    // get a mesh (vertices and triangles indices) for a 10m error
    const meshMartini = tile.getMesh(10);

    let response = []
    response.push(meshMartini)
    response.push(terrain)

    initThree(response)
  }
}

function initThree(martini: any) {
  const terrain = martini[1];

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

  const geoTest = generateTerrainGeometry(terrain, 257)

  const geometry = new THREE.Geometry().fromBufferGeometry(geoTest)
  mapUVs(geometry)
  geometry.uvsNeedUpdate = true;
  let mesh = new THREE.Mesh(geometry, material);

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