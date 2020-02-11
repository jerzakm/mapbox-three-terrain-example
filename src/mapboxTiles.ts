import { mapboxToken } from "."
import { fetchImage } from "./util"
import { RepeatWrapping, NearestFilter, TextureLoader } from "three"

export const fetchTerrainTile = (zoom: number, x: number, y: number) => {
  const imgUrl = `https://a.tiles.mapbox.com/v4/mapbox.terrain-rgb/${zoom}/${x}/${y}.png?access_token=${mapboxToken}`
  return fetchImage(imgUrl)
}

export const makeSatelliteTexture = (zoom: number, x: number, y: number, doubleRes: boolean) => {
  const texture = new TextureLoader().load(`https://a.tiles.mapbox.com/v4/mapbox.satellite/${zoom}/${x}/${y}@2x.png?access_token=${mapboxToken}`);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.minFilter = NearestFilter
  texture.magFilter = NearestFilter
  texture.repeat.set(1, -1);

  return texture
}