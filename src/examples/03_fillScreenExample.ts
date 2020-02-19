import { ISlippyCoords } from "../util";
import { fetchTerrainTile, makeSatelliteTexture } from "../mapboxTiles";
import { decodeTerrainFromTile, generateDelatinGeometry } from "../terrain";
import { MeshPhongMaterial, DoubleSide, WebGLRenderer, PerspectiveCamera, Scene, HemisphereLight, Mesh, Frustum, Matrix4, Vector3, BoxGeometry, MeshBasicMaterial } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { mapUVs } from "../geometry";
import { initThreeCanvasScene } from "../threeSetup";

interface ITileData {
  mesh?: Mesh
  visible: boolean
  rendered: boolean
}

export const runFillScreenExample = async () => {

  const zoom = 2

  const tileCount = 2 ** (zoom)

  const tileData: ITileData[][] = []

  for (let x = 0; x < tileCount; x++) {
    tileData[x] = []
    for (let y = 0; y < tileCount; y++) {
      tileData[x][y] = {visible: false, rendered: false }
    }
  }



  const {scene, renderer, camera} = initThreeCanvasScene()

  scene.add(new HemisphereLight('#999999', '#ccffcc', 0.1))

  async function addTile(x: number, y:number){
    const texture = makeSatelliteTexture(zoom,x,y, true)
    const material = new MeshPhongMaterial({
      // map: texture,
      color: '#888888',
      wireframe: true,
      side: DoubleSide
    });

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

    const tileImg = await fetchTerrainTile(zoom,x,y)
    const terrain: any = decodeTerrainFromTile(tileImg,70)
    const maxError = 10

    const tinBufferGeo = generateDelatinGeometry(terrain, tileImg.width+1, maxError)
    const tinGeo = mapUVs(tinBufferGeo)
    const tinMesh = new Mesh(tinGeo, material)
    tinMesh.position.set(256*x,0, 256*y)
    scene.add(tinMesh)
    tileData[x][y].mesh = tinMesh
    tileData[x][y].rendered = true
    tileData[x][y].visible = true
  }

  for (let x = 0; x < tileCount; x++) {
    for (let y = 0; y < tileCount; y++) {
      addTile(x,y)
    }
  }

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
}