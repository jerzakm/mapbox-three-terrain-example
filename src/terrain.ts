import { BufferGeometry, BufferAttribute, Geometry } from "three";

export interface MartiniOptions {
    metersPerPixel: number,
    terrainExaggeration: number
}

export const decodeTerrain = (data:Uint8ClampedArray, tileSize: number) => {
  const gridSize = tileSize+1
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

export const generateTerrainGeometry = (gridSize: number, tileSize: number, terrain: Float32Array, options: MartiniOptions) => {
    const geometry = new BufferGeometry();
    const vertices = new Float32Array(gridSize * gridSize * 3);
    const indices = new Uint32Array(tileSize * tileSize * 6);
    let index = 0;

    for (let y = 0; y <= tileSize; y++) {
      for (let x = 0; x <= tileSize; x++) {
        const i = y * gridSize + x;
        vertices[3 * i + 0] = x / tileSize - 0.5;
        vertices[3 * i + 1] = 0.5 - y / tileSize;
        vertices[3 * i + 2] = terrain[i] / options.metersPerPixel / tileSize * options.terrainExaggeration;

        indices[index++] = i + 1;
        indices[index++] = i;
        indices[index++] = i + gridSize;
        indices[index++] = i + 1;
        indices[index++] = i + gridSize;
        indices[index++] = i + gridSize + 1;
      }
    }

    geometry.setAttribute('position', new BufferAttribute(vertices, 3));
    geometry.setIndex(new BufferAttribute(indices, 1));
    geometry.computeVertexNormals();

    return geometry
  }