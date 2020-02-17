import { fetchTerrainTile, makeSatelliteTexture } from "./mapboxTiles"
const Delatin = require('delatin')
const martini = require('@mapbox/martini')

import { decodeTerrainFromTile, generateMartiniGeometry } from "./terrain"

import { mapUVs } from "./geometry"

import { MeshPhongMaterial, DoubleSide, Mesh, BufferGeometry, BufferAttribute, AmbientLight, HemisphereLight } from "three"

import { initThreeCanvasScene } from "./threeSetup"
import { ISlippyCoords } from "./util"
import mapboxgl, { CustomLayerInterface, LngLat } from "mapbox-gl";

export const runMeshGenCompare = async () => {
    const location: ISlippyCoords = {
        zoom: 10,
        x: 906,
        y: 404
      }

    const tileImg = await fetchTerrainTile(location.zoom, location.x, location.y)

    const terrain: any = decodeTerrainFromTile(tileImg)

    const texture = makeSatelliteTexture(location.zoom, location.x, location.y, true)
    const material = new MeshPhongMaterial({
      // map: texture,
      color: '#888888',
      wireframe: true,
      side: DoubleSide
    });

    const scene = initThreeCanvasScene()

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

}

export const generateDelatinGeometry = (terrain: Float32Array, size: number, error: number) => {

  const tin = new Delatin.default(terrain, size, size);
  tin.run(error);

  const delatinMesh = {
    vertices: new Uint16Array(tin.coords.length), //tin.coords
    triangles: new Uint32Array(tin.triangles.length) //tin.triangles
  }

  for(let i =0; i<tin.coords.length; i++){
    delatinMesh.vertices[i] = tin.coords[i]
  }
  for(let i =0; i<tin.triangles.length; i++){
    delatinMesh.triangles[i] = tin.triangles[i]
  }

  const geometry = new BufferGeometry();

  const vertices = [];
  for (let i = 0; i < delatinMesh.vertices.length / 2; i++) {
    let x = delatinMesh.vertices[i * 2],
      y = delatinMesh.vertices[i * 2 + 1];
    vertices.push(x);
    vertices.push(terrain[y * size + x] / 100);
    vertices.push(y);
  }

  geometry.setIndex(new BufferAttribute(delatinMesh.triangles, 1));
  geometry.setAttribute(
    "position",
    new BufferAttribute(new Float32Array(vertices), 3)
  );

  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.normalizeNormals();

  return geometry
}