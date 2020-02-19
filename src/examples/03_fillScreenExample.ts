import { ISlippyCoords } from "../util";
import { fetchTerrainTile, makeSatelliteTexture } from "../mapboxTiles";
import { decodeTerrainFromTile, generateDelatinGeometry } from "../terrain";
import { MeshPhongMaterial, DoubleSide, WebGLRenderer, PerspectiveCamera, Scene, HemisphereLight, Mesh, Frustum, Matrix4, Vector3, BoxGeometry, MeshBasicMaterial } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { mapUVs } from "../geometry";
import { initThreeCanvasScene } from "../threeSetup";

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

  const {scene, renderer, camera} = initThreeCanvasScene()


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


}