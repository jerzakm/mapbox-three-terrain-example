import { fetchTerrainTile, makeSatelliteTexture } from "../mapboxTiles"

import { decodeTerrainFromTile, generateMartiniGeometry } from "../terrain"

import { mapUVs } from "../geometry"

import { MeshPhongMaterial, DoubleSide, Mesh } from "three"

import { initThreeCanvasScene } from "../threeSetup"
import { ISlippyCoords } from "../util"

export const runSingleTileExample = async () => {

    const location: ISlippyCoords = {
        zoom: 10,
        x: 906,
        y: 404
      }

    const tileImg = await fetchTerrainTile(location.zoom, location.x, location.y)

    const terrain: any = decodeTerrainFromTile(tileImg)

    //geometry width is +1 for better seaming
    const bufferGeometry = generateMartiniGeometry(terrain, tileImg.width + 1, 50)
    const geometry = mapUVs(bufferGeometry)

    const texture = makeSatelliteTexture(location.zoom, location.x, location.y, true)

    const material = new MeshPhongMaterial({
      map: texture,
      // color: '#ffffff',
      // wireframe: true
      side: DoubleSide,
    });

    const mesh = new Mesh(geometry, material);

    const {scene} = initThreeCanvasScene()

    scene.add(mesh)
  }