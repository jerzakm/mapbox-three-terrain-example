import { Camera, Scene, WebGLRenderer, Mesh, Matrix4, Vector3, AmbientLight, HemisphereLight, DirectionalLight } from "three"
import { Map, CustomLayerInterface, LngLatLike, LngLat } from "mapbox-gl"
import mapboxgl from "mapbox-gl"
import { ISlippyCoords, coordsToSlippy, slippyToCoords } from "./util"
import { createMesh } from "."

export class MapboxThreeLayer implements CustomLayerInterface {
    id = '3d-model'
    type: "custom" = "custom"
    renderingMode: "3d" | "2d" | undefined = "3d"

    camera: Camera
    scene: Scene
    map: Map
    modelTransform: any
    slippyOrigin: ISlippyCoords
    renderer?: WebGLRenderer

    constructor(map: Map, mesh: Mesh, modelOrigin: LngLat) {
        this.map = map
        this.camera = new Camera()
        this.scene = new Scene()

        this.scene.add(mesh)

        // create two three.js lights to illuminate the model
        this.makeLights()

        const modelAltitude = 0;
        const modelRotate = [Math.PI / 2, 0, 0];

        const modelAsMercatorCoordinate = mapboxgl.MercatorCoordinate.fromLngLat(modelOrigin,modelAltitude);

        this.slippyOrigin = coordsToSlippy(modelOrigin.lat, modelOrigin.lng, 10)

        this.modelTransform = {
            translateX: modelAsMercatorCoordinate.x,
            translateY: modelAsMercatorCoordinate.y,
            translateZ: modelAsMercatorCoordinate.z,
            rotateX: modelRotate[0],
            rotateY: modelRotate[1],
            rotateZ: modelRotate[2],
            /* Since our 3D model is in real world meters, a scale transform needs to be
            * applied since the CustomLayerInterface expects units in MercatorCoordinates.
            */
            // https://observablehq.com/@mourner/martin-real-time-rtin-terrain-mesh meters per pixel in martini?
            scale: modelAsMercatorCoordinate.meterInMercatorCoordinateUnits()*124.73948277849482
        };
    }

    private makeLights() {
        const directionalLight = new DirectionalLight(0xffffff);
        directionalLight.position.set(0, -70, 100).normalize();
        this.scene.add(directionalLight);

        const directionalLight2 = new DirectionalLight(0xffffff);
        directionalLight2.position.set(0, 70, 100).normalize();
        this.scene.add(directionalLight2);

        // const globalLight = new AmbientLight()
        // this.scene.add(globalLight)

        // const hemiLight = new HemisphereLight()
        // this.scene.add(hemiLight)
    }

    onAdd(map: Map, gl: WebGLRenderingContext) {
        this.renderer = new WebGLRenderer({
            canvas: map.getCanvas(),
            context: gl,
            antialias: true
            });

        this.renderer.autoClear = false;

        this.renderer = new WebGLRenderer({
            canvas: this.map.getCanvas(),
            context: gl,
            antialias: true,
        })

        this.fillBoundsWithTiles()

        this.renderer.autoClear = false
    }

    render(gl: WebGLRenderingContext, matrix: any) {
        var rotationX = new Matrix4().makeRotationAxis(
        new Vector3(1, 0, 0),
        this.modelTransform.rotateX
        );
        var rotationY = new Matrix4().makeRotationAxis(
        new Vector3(0, 1, 0),
        this.modelTransform.rotateY
        );
        var rotationZ = new Matrix4().makeRotationAxis(
        new Vector3(0, 0, 1),
        this.modelTransform.rotateZ
        );
        var m = new Matrix4().fromArray(matrix);
        var l = new Matrix4()
        .makeTranslation(
            this.modelTransform.translateX,
            this.modelTransform.translateY,
            this.modelTransform.translateZ
        )
        .scale(
        new Vector3(
            this.modelTransform.scale,
        -this.modelTransform.scale,
        this.modelTransform.scale
        )
        )
        .multiply(rotationX)
        .multiply(rotationY)
        .multiply(rotationZ);

        this.camera.projectionMatrix = m.multiply(l);

        if(!this.renderer) {return}

        this.renderer.state.reset();
        this.renderer.render(this.scene, this.camera);
        this.map.triggerRepaint();
    }

    private async fillBoundsWithTiles() {
        const nw = this.map.getBounds().getNorthWest()
        const se = this.map.getBounds().getSouthEast()

        const nwTile = coordsToSlippy(nw.lat, nw.lng, 10)

        let maxX = nwTile.x
        let maxY = nwTile.y

        while(true){
            const sc = slippyToCoords(maxX+1, maxY+1, 10)
            const contains = this.map.getBounds().contains(sc)
            if(contains){
                maxX+=1
                maxY+=1
            } else {
                break
            }
        }

        const sArray: ISlippyCoords[] = []

        for(let j = nwTile.y; j<=maxY;j++) {
            for(let i = nwTile.x; i<=maxX;i++) {
                const mesh = await createMesh({x:i, y:j, zoom:10})
                this.addTile(mesh, {x:i, y:j, zoom:10}, 256)
            }
        }
    }

    addTile(mesh: Mesh, slippyCoords: ISlippyCoords, size: number){
        this.scene.add(mesh)
        mesh.position.set(
            (slippyCoords.x-this.slippyOrigin.x)*256+this.modelTransform.translateX,
            0,
            (slippyCoords.y-this.slippyOrigin.y)*256+this.modelTransform.translateY,
            )
    }
}