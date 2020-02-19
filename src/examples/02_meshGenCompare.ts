import { ISlippyCoords } from "../util";
import { fetchTerrainTile, makeSatelliteTexture } from "../mapboxTiles";
import { decodeTerrainFromTile, generateDelatinGeometry, generateMartiniGeometry } from "../terrain";
import { MeshPhongMaterial, DoubleSide, Mesh, HemisphereLight, FontLoader, TextGeometry, Vector3 } from "three";
import { initThreeCanvasScene } from "../threeSetup";
import { mapUVs } from "../geometry";

export const runMeshGenCompare = async () => {
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
    console.log(camera)
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

  const {renderer,scene,camera} = initThreeCanvasScene()

  const maxError = 10

  const tinBufferGeo = generateDelatinGeometry(terrain, tileImg.width+1, maxError)
  const tinGeo = mapUVs(tinBufferGeo)
  const tinMesh = new Mesh(tinGeo, material)
  scene.add(tinMesh)

  const martiniBufferGeo = generateMartiniGeometry(terrain, tileImg.width+1, maxError)
  const martiniGeo = mapUVs(martiniBufferGeo)
  const martiniMesh = new Mesh(martiniGeo, material)
  martiniMesh.position.set(0,0,257)
  scene.add(martiniMesh)

  scene.add(new HemisphereLight('#999999', '#ccffcc', 0.1))

  const textMaterial = new MeshPhongMaterial({
    color: '#121212',
    side: DoubleSide
  });

  const loader = new FontLoader();
  loader.load( 'helvetiker_regular.typeface.json', function ( font ) {
    const options = {
      font: font,
      size: 40,
      height: 1,
      curveSegments: 12,
      bevelEnabled: true,
      bevelThickness: 2,
      bevelSize: 1,
      bevelOffset: 0,
      bevelSegments: 2
    }
    const g1 = new TextGeometry( `delatin`, options );
    const m1 = new Mesh(g1, textMaterial)
    m1.position.set(10,20,220)
    m1.rotateY(90 * (Math.PI/180))
    scene.add(m1)

    const g2 = new TextGeometry( `martini`, options );
    const m2 = new Mesh(g2, textMaterial)
    m2.position.set(10,20,450)
    m2.rotateY(90 * (Math.PI/180))
    scene.add(m2)
  } );
}