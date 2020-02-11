import * as style from './_scss/style'

import { mapUVs } from './geometry';
import { decodeTerrainFromTile, generateTerrainGeometry } from './terrain';
import { fetchTerrainTile, makeSatelliteTexture } from './mapboxTiles';
import { MeshPhongMaterial, Mesh, DoubleSide, Camera } from 'three';
import { initThreeCanvasScene } from './threeSetup';
import mapboxgl, { CustomLayerInterface } from "mapbox-gl";
import { slippyToCoords } from './util';

import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader'

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

  // parameters to ensure the model is georeferenced correctly on the map
  const modelOrigin:any = coords;
  const modelAltitude = 0;
  const modelRotate = [Math.PI / 2, 0, 0];

  const modelAsMercatorCoordinate = mapboxgl.MercatorCoordinate.fromLngLat(modelOrigin,modelAltitude);

  // transformation parameters to position, rotate and scale the 3D model onto the map
  const modelTransform = {
    translateX: modelAsMercatorCoordinate.x,
    translateY: modelAsMercatorCoordinate.y,
    translateZ: modelAsMercatorCoordinate.z,
    rotateX: modelRotate[0],
    rotateY: modelRotate[1],
    rotateZ: modelRotate[2],
    /* Since our 3D model is in real world meters, a scale transform needs to be
    * applied since the CustomLayerInterface expects units in MercatorCoordinates.
    */
   //https://observablehq.com/@mourner/martin-real-time-rtin-terrain-mesh meters per pixel in martini?
    scale: modelAsMercatorCoordinate.meterInMercatorCoordinateUnits()*124.73948277849482
  };

    const customLayer: CustomLayerInterface = {
    id: '3d-model',
    type: 'custom',
    renderingMode: '3d',
    onAdd: function(map, gl) {
      this.camera = new THREE.Camera();
      this.scene = new THREE.Scene();

      // create two three.js lights to illuminate the model
      var directionalLight = new THREE.DirectionalLight(0xffffff);
      directionalLight.position.set(0, -70, 100).normalize();
      this.scene.add(directionalLight);

      var directionalLight2 = new THREE.DirectionalLight(0xffffff);
      directionalLight2.position.set(0, 70, 100).normalize();
      this.scene.add(directionalLight2);

      // use the three.js GLTF loader to add the 3D model to the three.js scene
      this.map = map;

      this.scene.add(mesh)

      // use the Mapbox GL JS map canvas for three.js
      this.renderer = new THREE.WebGLRenderer({
      canvas: map.getCanvas(),
      context: gl,
      antialias: true
      });
      this.renderer.autoClear = false;
    },
    render: function(gl, matrix) {
      var rotationX = new THREE.Matrix4().makeRotationAxis(
      new THREE.Vector3(1, 0, 0),
      modelTransform.rotateX
      );
      var rotationY = new THREE.Matrix4().makeRotationAxis(
      new THREE.Vector3(0, 1, 0),
      modelTransform.rotateY
      );
      var rotationZ = new THREE.Matrix4().makeRotationAxis(
      new THREE.Vector3(0, 0, 1),
      modelTransform.rotateZ
      );

      var m = new THREE.Matrix4().fromArray(matrix);
      var l = new THREE.Matrix4()
      .makeTranslation(
      modelTransform.translateX,
      modelTransform.translateY,
      modelTransform.translateZ
      )
      .scale(
      new THREE.Vector3(
      modelTransform.scale,
      -modelTransform.scale,
      modelTransform.scale
      )
      )
      .multiply(rotationX)
      .multiply(rotationY)
      .multiply(rotationZ);

      this.camera.projectionMatrix = m.multiply(l);
      this.renderer.state.reset();
      this.renderer.render(this.scene, this.camera);
      this.map.triggerRepaint();
      }
    };

    map.on('style.load', function() {
      map.addLayer(customLayer, 'waterway-label');
      // const testLayer = new MapboxThreeLayer(map)
      // map.addLayer(testLayer, 'waterway-label')
      let toggled = true
      window.addEventListener('click', ()=> {
        if(toggled){
          map.removeLayer('3d-model')
          toggled= false
        } else {
          map.addLayer(customLayer, 'waterway-label');
          toggled = true
        }
      })
    });
}