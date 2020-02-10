const martini = require('@mapbox/martini')
import { BufferGeometry, BufferAttribute, Geometry } from "three";

export interface MartiniOptions {
  metersPerPixel: number,
  terrainExaggeration: number
}

export const decodeTerrain = (data: Uint8ClampedArray, tileSize: number) => {
  const gridSize = tileSize + 1
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

  return terrain
}

export const generateTerrainGeometry = (terrain: Float32Array, size: number) => {
  const martiniInstance = new martini.default(size);

  const tile = martiniInstance.createTile(terrain);

  //! todo terrain error as param
  const meshMartini = tile.getMesh(10);

  const geometry = new BufferGeometry();

  const vertices = [];
  for (let i = 0; i < meshMartini.vertices.length / 2; i++) {
    let x = meshMartini.vertices[i * 2],
      y = meshMartini.vertices[i * 2 + 1];
    vertices.push(x);
    vertices.push(terrain[y * 257 + x] / 100);
    vertices.push(y);
  }

  geometry.setIndex(new BufferAttribute(meshMartini.triangles, 1));
  geometry.setAttribute(
    "position",
    new BufferAttribute(new Float32Array(vertices), 3)
  );

  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.normalizeNormals();

  return geometry
}

export const generateTerrainMesh = () => {

}