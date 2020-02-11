import * as style from './_scss/style'

import { mapUVs } from './geometry';
import { decodeTerrainFromTile, generateTerrainGeometry } from './terrain';
import { fetchTerrainTile, makeSatelliteTexture } from './mapboxTiles';
import { MeshPhongMaterial, Mesh, DoubleSide } from 'three';
import { initThreeCanvasScene } from './threeSetup';

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

  const texture=  makeSatelliteTexture(location.zoom, location.x, location.y, true)

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