import { mapboxToken } from "."
import { fetchImage } from "./util"

export const fetchTerrainTile = (zoom: number, x: number, y: number) => {
  const imgUrl = `https://a.tiles.mapbox.com/v4/mapbox.terrain-rgb/${zoom}/${x}/${y}.png?access_token=${mapboxToken}`
  return fetchImage(imgUrl)
}

export const fetchSatelliteTile = (zoom: number, x: number, y: number, doubleRes: boolean) => {
  const imgUrl = `https://a.tiles.mapbox.com/v4/mapbox.terrain-rgb/${zoom}/${x}/${y}/${doubleRes ? '@2x' : ''}.png?access_token=${mapboxToken}`
  return fetchImage(imgUrl)
}