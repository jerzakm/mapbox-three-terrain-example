export const fetchImage = (src: string):Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const image = new Image;
      image.crossOrigin = "anonymous";
      image.src = src;
      image.onload = () => resolve(image);
      image.onerror = reject;
    });
}

export const slippyToCoords = (x: number, y:number, zoom: number) => {
  const n = 2 ** zoom
  const longitude = x / n * 360 - 180
  const lat_rad = Math.atan(Math.sinh(Math.PI * (1-2*y/n)))
  const latitude = lat_rad * (180/Math.PI)

  return [longitude, latitude]
}