import { fetchTerrainTile, makeSatelliteTexture } from "./mapboxTiles"

import { decodeTerrainFromTile, generateMartiniGeometry, generateDelatinGeometry } from "./terrain"

import { mapUVs } from "./geometry"

import { MeshPhongMaterial, DoubleSide, Mesh, BufferGeometry, BufferAttribute, AmbientLight, HemisphereLight, TextGeometry, FontLoader, WebGLRenderer, PerspectiveCamera, Scene, Frustum, Matrix4, Vector3, BoxGeometry, MeshBasicMaterial, Raycaster } from "three"

import { ISlippyCoords } from "./util"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"

export const runFillScreenExample = async () => {
  const location: ISlippyCoords = {
      zoom: 10,
      x: 906,
      y: 404
    }

  const tileImg = await fetchTerrainTile(location.zoom, location.x, location.y)

  const terrain: any = decodeTerrainFromTile(tileImg)

  const material = new MeshPhongMaterial({
    // map: texture,
    color: '#888888',
    wireframe: true,
    side: DoubleSide
  });
  const texture = makeSatelliteTexture(location.zoom, location.x, location.y, true)

  window.addEventListener('keydown', (e)=> {
    if(e.key=='w'){
      // toggle wireframe
      material.wireframe? material.wireframe = false : material.wireframe = true
      material.needsUpdate = true
    }
    if(e.key=='s'){
      // toggle satellite texture
      material.map? material.map = null : material.map = texture
      material.needsUpdate = true
    }
  })

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

    const skyColor = 0xFFFFFF;
    const groundColor = 0xAAAAAA;
    const intensity = 1;
    const light = new HemisphereLight(skyColor, groundColor, intensity);
    scene.add(light);

    light.position.set(220, 199, 164);

    camera.position.set(220, 199, 164);


  const maxError = 10

  const tinBufferGeo = generateDelatinGeometry(terrain, tileImg.width+1, maxError)
  const tinGeo = mapUVs(tinBufferGeo)
  const tinMesh = new Mesh(tinGeo, material)
  scene.add(tinMesh)

  scene.add(new HemisphereLight('#999999', '#ccffcc', 0.1))

  camera.updateMatrix();
  camera.updateMatrixWorld();
  const frustum = new Frustum();
  frustum.setFromProjectionMatrix(new Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
  console.log(camera)

  // Your 3d point to check
  var pos = new Vector3(0,0,0);
  if (frustum.containsPoint(pos)) {
      console.log('point in')
  } else {
      console.log('out')
  }

  const boxGeo = new BoxGeometry(10,10,10)
  const box = new Mesh(boxGeo, new MeshBasicMaterial({color: '#FF0000'}))
//   scene.add(box)


  animate()

    function animate() {
      requestAnimationFrame(animate);

      controls.update();


      renderer.render(scene, camera);

    }
}