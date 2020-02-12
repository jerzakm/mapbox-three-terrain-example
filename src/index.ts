import * as style from './_scss/style'

import { mapUVs } from './geometry';
import { decodeTerrainFromTile, generateTerrainGeometry } from './terrain';
import { fetchTerrainTile, makeSatelliteTexture } from './mapboxTiles';
import { MeshPhongMaterial, Mesh, DoubleSide, Camera } from 'three';
import { initThreeCanvasScene } from './threeSetup';
import mapboxgl, { CustomLayerInterface } from "mapbox-gl";
import { slippyToCoords } from './util';

import * as THREE from 'three'
import { MapboxThreeLayer } from './MapboxThreeLayer';

export const mapboxToken = 'pk.eyJ1IjoiamVyemFrbSIsImEiOiJjangxaHF4MGcwN3ZqNGJubzl2Zzdva3N5In0.DRchXs3ESLUuoH9Kh_N-ow'

const location = {
  zoom: 10,
  x: 906,
  y: 404
}

// runThreeExample()
runMapboxExample()

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

async function runMapboxExample() {
  // based on https://docs.mapbox.com/mapbox-gl-js/example/add-3d-model/

  const coords = slippyToCoords(location.x, location.y, location.zoom)
  const latLikeCoords = {lng:coords[0], lat:coords[1]}

  mapboxgl.accessToken = 'pk.eyJ1IjoiamVyemFrbSIsImEiOiJjangxaHF4MGcwN3ZqNGJubzl2Zzdva3N5In0.DRchXs3ESLUuoH9Kh_N-ow';

  const container = document.createElement('div')
  container.style.width = '100vw'
  container.style.height = '100vh'
  document.body.appendChild(container)

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


  const map = new mapboxgl.Map({
    container: container,
    style: 'mapbox://styles/mapbox/light-v10'
  });
  map.setZoom(location.zoom);
  map.setCenter(latLikeCoords);

  map.on('style.load', function() {
    // map.addLayer(customLayer, 'waterway-label');
    const testLayer = new MapboxThreeLayer(map, mesh, latLikeCoords)
    map.addLayer(testLayer, 'waterway-label')
    // let toggled = true
    // window.addEventListener('click', ()=> {
    //   if(toggled){
    //     map.removeLayer('3d-model')
    //     toggled= false
    //   } else {
    //     map.addLayer(customLayer, 'waterway-label');
    //     toggled = true
    //   }
    // })
  });
}