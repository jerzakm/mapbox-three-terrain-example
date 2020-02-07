import * as style from './_scss/style'
import * as THREE from 'three'
import * as Martini from '@mapbox/martini'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import { WireframeGeometry } from 'three';
// set up mesh generator for a certain 2^k+1 grid size
const martini = new Martini.default(257);

let geometry = new THREE.BufferGeometry();

const mapboxToken = 'pk.eyJ1IjoiamVyemFrbSIsImEiOiJjangxaHF4MGcwN3ZqNGJubzl2Zzdva3N5In0.DRchXs3ESLUuoH9Kh_N-ow'
const location = '10/906/404'
const terrainExaggeration = 1.5
const metersPerPixel = 124.73948277849482

const canvas = document.createElement('canvas')
// canvas.style.width = '1920px'
// canvas.style.height = '1080px'
canvas.height = 1080
canvas.width = 1920
canvas.style.position = 'fixed'
canvas.style.left = '0px'
canvas.style.top = '0px'
// document.body.appendChild(canvas)

const threeCanvas = document.createElement('canvas')
threeCanvas.height = 1080
threeCanvas.width = 1920
threeCanvas.style.position = 'fixed'
threeCanvas.style.left = '0px'
// threeCanvas.style.top = '256px'
const renderer = new THREE.WebGLRenderer({canvas: threeCanvas, alpha: true});
renderer.shadowMap.enabled = true;
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
        const terrain = new Float32Array(gridSize * gridSize);

        // decode terrain values
        for (let y = 0; y < tileSize; y++) {
            for (let x = 0; x < tileSize; x++) {
            const k = (y * tileSize + x) * 4;
            const r = data[k + 0];
            const g = data[k + 1];
            const b = data[k + 2];
            const a = data[k + 3];
            terrain[y * gridSize + x] = (r * 256 * 256 + g * 256.0 + b) / 10.0 - 10000.0;
            }
        }
        // backfill right and bottom borders
        for (let x = 0; x < gridSize - 1; x++) {
            terrain[gridSize * (gridSize - 1) + x] = terrain[gridSize * (gridSize - 2) + x];
        }
        for (let y = 0; y < gridSize; y++) {
            terrain[gridSize * y + gridSize - 1] = terrain[gridSize * y + gridSize - 2];
        }

        // generate RTIN hierarchy from terrain data (an array of size^2 length)
        const tile = martini.createTile(terrain);

        // get a mesh (vertices and triangles indices) for a 10m error
        const meshMartini = tile.getMesh(10);

        let response = []
        response.push(meshMartini)
        response.push(terrain)
        console.log(response)


        drawGrid(terrain, 1,1, ctx)
        const errors = calcErrors(gridSize, tileSize, terrain)
        makeGeometry(gridSize, tileSize, terrain)

        initThree(response)
    }
}

function fetchImage(src: string):Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image;
      image.crossOrigin = "anonymous";
      image.src = src;
      image.onload = () => resolve(image);
      image.onerror = reject;
    });
}

const turbo = (x:any) => [
    34.61 + x * (1172.33 - x * (10793.56 - x * (33300.12 - x * (38394.49 - x * 14825.05)))),
    23.31 + x * (557.33 + x * (1225.33 - x * (3574.96 - x * (1073.77 + x * 707.56)))),
    27.2 + x * (3211.1 - x * (15327.97 - x * (27814 - x * (22569.18 - x * 6838.66))))
  ]

function drawGrid(data:any, cutoff = 1.0, max = 1.0, ctx:any) {
    const size = Math.sqrt(data.length);
    ctx.canvas.style.imageRendering = 'pixelated';
    if (!ctx.canvas.style.imageRendering) ctx.canvas.style.imageRendering = 'crisp-edges';
    const imgData = ctx.getImageData(0, 0, size, size);
    const minZ = data.reduce((a, b) => Math.min(a, b));
    const maxZ = data.reduce((a, b) => Math.max(a, b));

    console.log(size)

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const k = y * size + x;
        const [r, g, b] = turbo(Math.min(max, max * Math.min((data[k] - minZ) / (maxZ - minZ), cutoff) / cutoff));
        imgData.data[4 * k + 0] = r;
        imgData.data[4 * k + 1] = g;
        imgData.data[4 * k + 2] = b;
        imgData.data[4 * k + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 256, 0);
  }

function  calcErrors(gridSize: number, tileSize: number, terrain: Float32Array) {
    const errors = new Float32Array(gridSize * gridSize);

    const numSmallestTriangles = tileSize * tileSize;
    const numTriangles = numSmallestTriangles * 2 - 2; // 2 + 4 + 8 + ... 2^k = 2 * 2^k - 2
    const lastLevelIndex = numTriangles - numSmallestTriangles;

    // iterate over all possible triangles, starting from the smallest level
    for (let i = numTriangles - 1; i >= 0; i--) {

      // get triangle coordinates from its index in an implicit binary tree
      let id = i + 2;
      let ax = 0, ay = 0, bx = 0, by = 0, cx = 0, cy = 0;
      if (id & 1) {
        bx = by = cx = tileSize; // bottom-left triangle
      } else {
        ax = ay = cy = tileSize; // top-right triangle
      }
      while ((id >>= 1) > 1) {
        const mx = (ax + bx) >> 1;
        const my = (ay + by) >> 1;

        if (id & 1) { // left half
          bx = ax; by = ay;
          ax = cx; ay = cy;
        } else { // right half
          ax = bx; ay = by;
          bx = cx; by = cy;
        }
        cx = mx; cy = my;
      }

      // calculate error in the middle of the long edge of the triangle
      const interpolatedHeight = (terrain[ay * gridSize + ax] + terrain[by * gridSize + bx]) / 2;
      const middleIndex = ((ay + by) >> 1) * gridSize + ((ax + bx) >> 1);
      const middleError = Math.abs(interpolatedHeight - terrain[middleIndex]);

      if (i >= lastLevelIndex) { // smallest triangles
        errors[middleIndex] = middleError;

      } else { // bigger triangles; accumulate error with children
        const leftChildError = errors[((ay + cy) >> 1) * gridSize + ((ax + cx) >> 1)];
        const rightChildError = errors[((by + cy) >> 1) * gridSize + ((bx + cx) >> 1)];
        errors[middleIndex] = Math.max(errors[middleIndex], middleError, leftChildError, rightChildError);
      }
    }

    return errors;
  }

function makeGeometry(gridSize: number, tileSize: number, terrain: Float32Array){
  const vertices = new Float32Array(gridSize * gridSize * 3);
  const indices = new Uint32Array(tileSize * tileSize * 6);
  let index = 0;

  for (let y = 0; y <= tileSize; y++) {
    for (let x = 0; x <= tileSize; x++) {
      const i = y * gridSize + x;
      vertices[3 * i + 0] = x / tileSize - 0.5;
      vertices[3 * i + 1] = 0.5 - y / tileSize;
      vertices[3 * i + 2] = terrain[i] / metersPerPixel / tileSize * terrainExaggeration;

      indices[index++] = i + 1;
      indices[index++] = i;
      indices[index++] = i + gridSize;
      indices[index++] = i + 1;
      indices[index++] = i + gridSize;
      indices[index++] = i + gridSize + 1;
    }
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.computeVertexNormals();
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
  boxUnwrapUVs(geometry)
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
    texture.needsUpdate = true
    material.needsUpdate = true

    controls.update();

    renderer.render( scene, camera );

  }
}

function boxUnwrapUVs(geometry) {
  if (!geometry.boundingBox) geometry.computeBoundingBox();
  var sz = geometry.boundingBox.getSize(new THREE.Vector3());
  var center = geometry.boundingBox.getCenter(new THREE.Vector3())
  var min = geometry.boundingBox.min;
  if (geometry.faceVertexUvs[0].length == 0) {
    for (var i = 0; i < geometry.faces.length; i++) {
      geometry.faceVertexUvs[0].push([new THREE.Vector2(), new THREE.Vector2(), new THREE.Vector2()]);
    }
  }
  for (var i = 0; i < geometry.faces.length; i++) {
    var face = geometry.faces[i];
    var faceUVs = geometry.faceVertexUvs[0][i]
    var va = geometry.vertices[geometry.faces[i].a]
    var vb = geometry.vertices[geometry.faces[i].b]
    var vc = geometry.vertices[geometry.faces[i].c]
    var vab = new THREE.Vector3().copy(vb).sub(va)
    var vac = new THREE.Vector3().copy(vc).sub(va)
    //now we have 2 vectors to get the cross product of...
    var vcross = new THREE.Vector3().copy(vab).cross(vac);
    //Find the largest axis of the plane normal...
    vcross.set(Math.abs(vcross.x), Math.abs(vcross.y), Math.abs(vcross.z))
    var majorAxis = vcross.x > vcross.y ? (vcross.x > vcross.z ? 'x' : vcross.y > vcross.z ? 'y' : vcross.y > vcross.z) : vcross.y > vcross.z ? 'y' : 'z'
    //Take the other two axis from the largest axis
    var uAxis = majorAxis == 'x' ? 'y' : majorAxis == 'y' ? 'x' : 'x';
    var vAxis = majorAxis == 'x' ? 'z' : majorAxis == 'y' ? 'z' : 'y';
    faceUVs[0].set((va[uAxis] - min[uAxis]) / sz[uAxis], (va[vAxis] - min[vAxis]) / sz[vAxis])
    faceUVs[1].set((vb[uAxis] - min[uAxis]) / sz[uAxis], (vb[vAxis] - min[vAxis]) / sz[vAxis])
    faceUVs[2].set((vc[uAxis] - min[uAxis]) / sz[uAxis], (vc[vAxis] - min[vAxis]) / sz[vAxis])
  }
  geometry.elementsNeedUpdate = geometry.verticesNeedUpdate = true;
}