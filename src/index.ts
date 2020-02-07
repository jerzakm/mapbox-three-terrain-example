import * as style from './_scss/style'
import * as THREE from 'three'
import * as Martini from '@mapbox/martini'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import { WireframeGeometry } from 'three';
import { fetchImage } from './util';
import { mapUVs } from './geometry';
import { generateTerrainGeometry, decodeTerrain } from './terrain';

// set up mesh generator for a certain 2^k+1 grid size
const martini = new Martini.default(257);

const mapboxToken = 'pk.eyJ1IjoiamVyemFrbSIsImEiOiJjangxaHF4MGcwN3ZqNGJubzl2Zzdva3N5In0.DRchXs3ESLUuoH9Kh_N-ow'
const location = '10/906/404'

const martiniOptions = {
  terrainExaggeration: 1.5,
  metersPerPixel: 124.73948277849482
}

const canvas = document.createElement('canvas')
canvas.height = screen.height
canvas.width = screen.width

const threeCanvas = document.createElement('canvas')
threeCanvas.height = 1080
threeCanvas.width = 1920
threeCanvas.style.position = 'fixed'
threeCanvas.style.left = '0px'
// threeCanvas.style.top = '256px'
const renderer = new THREE.WebGLRenderer({canvas: threeCanvas, alpha: true});
document.body.appendChild(threeCanvas)

const ctx = canvas.getContext('2d')

start()

async function start() {
    const imgUrl = `https://a.tiles.mapbox.com/v4/mapbox.terrain-rgb/${location}.png?access_token=${mapboxToken}`

    const tileImg = await fetchImage(imgUrl)
    const tileSize = tileImg.width
    const gridSize = tileSize+1

    if(ctx){
        ctx.drawImage(tileImg, 0, 0);
        const data = ctx.getImageData(0, 0, tileSize, tileSize).data;
        const terrain = decodeTerrain(data, tileSize)

        // generate RTIN hierarchy from terrain data (an array of size^2 length)
        const tile = martini.createTile(terrain);

        // get a mesh (vertices and triangles indices) for a 10m error
        const meshMartini = tile.getMesh(10);

        let response = []
        response.push(meshMartini)
        response.push(terrain)

        const geometry = generateTerrainGeometry(gridSize, tileSize, terrain, martiniOptions)

        initThree(response)
    }
}

function initThree(martini: any){
  const meshMartini = martini[0];
  const terrain = martini[1];
  const martiniGeo = new THREE.BufferGeometry();

  let i, j;

  const vertices = [];
  for (i = 0, j = 0; i < meshMartini.vertices.length / 2; i++) {
    let x = meshMartini.vertices[i * 2],
      y = meshMartini.vertices[i * 2 + 1];
    vertices.push(x);
    vertices.push(terrain[y * 257 + x] / 100);
    vertices.push(y);
  }

  let terrainMaterial = new THREE.MeshStandardMaterial();

  martiniGeo.setIndex(new THREE.BufferAttribute(meshMartini.triangles, 1));
  martiniGeo.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(vertices), 3)
  );

  // martiniGeo.attributes.position.needsUpdate = true;
  martiniGeo.computeVertexNormals();
  martiniGeo.computeBoundingBox();
  martiniGeo.normalizeNormals();

  const fov = 90;
  const aspect = 2;  // the canvas default
  const near = 0.1;
  const far = 5000;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

  const scene = new THREE.Scene();


  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 5, 0);
  controls.update();
  const texture = new THREE.TextureLoader().load( `https://a.tiles.mapbox.com/v4/mapbox.satellite/${location}@2x.png?access_token=${mapboxToken}` );
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set( 1, -1 );


  const material = new THREE.MeshPhongMaterial({
    map: texture,
    // color: '#ffffff',
    // wireframe: true
    // side: THREE.DoubleSide,
  });

  const geometry = new THREE.Geometry().fromBufferGeometry(martiniGeo)
  mapUVs(geometry)
  geometry.uvsNeedUpdate = true;
  let mesh = new THREE.Mesh(geometry, material);




  // mesh.matrixAutoUpdate = true;
  scene.add(mesh);



  const skyColor = 0xB1E1FF;  // light blue
  const groundColor = 0xB97A20;  // brownish orange
  const intensity = 1;
  const light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
  scene.add(light);


  // martiniGeo.index.needsUpdate = true
  light.position.set( 220, 199, 164 );

  camera.position.set( 220, 199, 164 );
  camera.lookAt(mesh.position)



  animate()

  function animate() {
    requestAnimationFrame( animate );

    controls.update();

    renderer.render( scene, camera );

  }
}