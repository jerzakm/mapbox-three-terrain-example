import { fetchTerrainTile, makeSatelliteTexture } from "../mapboxTiles"
import { decodeTerrainFromTile, genMartiniTerrain } from "../terrain"
import { mapUVs } from "../geometry"
import { MeshPhongMaterial, DoubleSide, Mesh } from "three"
import { initThreeCanvasScene } from "../threeSetup"
import { coordsToSlippy } from "../util"

export async function singleSimpleTileExample() {

  // Check what Slippy tile contains Mount Blanc at zoom 10
  // https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames
  const location = coordsToSlippy(45.833496666, 6.858996564, 10)

  // get mapbox encoded rgb terrain file and decode it
  // https://docs.mapbox.com/help/troubleshooting/access-elevation-data/
  const tileImg = await fetchTerrainTile(location.zoom, location.x, location.y)
  const terrain: any = decodeTerrainFromTile(tileImg)

  // generate terrain geometry using martini
  const bufferGeometry = genMartiniTerrain(terrain, tileImg.width + 1)

  // map uvs to allow texturing, need more work
  const geometry = mapUVs(bufferGeometry)

  // fetch satellite image from mapbox and create three texture
  const texture = makeSatelliteTexture(location.zoom, location.x, location.y, true)

  const material = new MeshPhongMaterial({
    map: texture,
    // color: '#ffffff',
    // wireframe: true
    side: DoubleSide,
  });

  const mesh = new Mesh(geometry, material);

  const scene = initThreeCanvasScene()

  scene.add(mesh)
}