import { Vector2, Vector3 } from "three";

export function mapUVs(geometry: any) {
    if (!geometry.boundingBox) geometry.computeBoundingBox();
    const size = geometry.boundingBox.getSize(new Vector3());
    const min = geometry.boundingBox.min;
    if (geometry.faceVertexUvs[0].length == 0) {
      for (let i = 0; i < geometry.faces.length; i++) {
        geometry.faceVertexUvs[0].push([new Vector2(), new Vector2(), new Vector2()]);
      }
    }
    for (var i = 0; i < geometry.faces.length; i++) {
      const faceUVs = geometry.faceVertexUvs[0][i]
      const va = geometry.vertices[geometry.faces[i].a]
      const vb = geometry.vertices[geometry.faces[i].b]
      const vc = geometry.vertices[geometry.faces[i].c]
      const vab = new Vector3().copy(vb).sub(va)
      const vac = new Vector3().copy(vc).sub(va)
      //now we have 2 vectors to get the cross product of...
      const vcross = new Vector3().copy(vab).cross(vac);
      //Find the largest axis of the plane normal...
      vcross.set(Math.abs(vcross.x), Math.abs(vcross.y), Math.abs(vcross.z))
      const majorAxis = vcross.x > vcross.y ? (vcross.x > vcross.z ? 'x' : vcross.y > vcross.z ? 'y' : vcross.y > vcross.z) : vcross.y > vcross.z ? 'y' : 'z'
      //Take the other two axis from the largest axis
      const uAxis = majorAxis == 'x' ? 'y' : majorAxis == 'y' ? 'x' : 'x';
      const vAxis = majorAxis == 'x' ? 'z' : majorAxis == 'y' ? 'z' : 'y';
      faceUVs[0].set((va[uAxis] - min[uAxis]) / size[uAxis], (va[vAxis] - min[vAxis]) / size[vAxis])
      faceUVs[1].set((vb[uAxis] - min[uAxis]) / size[uAxis], (vb[vAxis] - min[vAxis]) / size[vAxis])
      faceUVs[2].set((vc[uAxis] - min[uAxis]) / size[uAxis], (vc[vAxis] - min[vAxis]) / size[vAxis])
    }
    geometry.elementsNeedUpdate = geometry.verticesNeedUpdate = true;
  }