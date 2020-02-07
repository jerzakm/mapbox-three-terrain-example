export const fetchImage = (src: string):Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const image = new Image;
      image.crossOrigin = "anonymous";
      image.src = src;
      image.onload = () => resolve(image);
      image.onerror = reject;
    });
}