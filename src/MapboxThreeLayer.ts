import { Camera, Scene, DirectionalLight, WebGLRenderer, Mesh, Matrix4, Vector3 } from "three"
import { Map, CustomLayerInterface, LngLatLike } from "mapbox-gl"
import mapboxgl from "mapbox-gl"

export class MapboxThreeLayer implements CustomLayerInterface {
    id = '3d-model'
    type: "custom" = "custom"
    renderingMode: "3d" | "2d" | undefined = "3d"

    camera: Camera
    scene: Scene
    map: Map
    modelTransform: any
    renderer?: WebGLRenderer

    constructor(map: Map, mesh: Mesh, modelOrigin: LngLatLike) {
        this.map = map
        this.camera = new Camera()
        this.scene = new Scene()

        this.scene.add(mesh)

        // create two three.js lights to illuminate the model
        this.makeLights()

        const modelAltitude = 0;
        const modelRotate = [Math.PI / 2, 0, 0];

        const modelAsMercatorCoordinate = mapboxgl.MercatorCoordinate.fromLngLat(modelOrigin,modelAltitude);

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
}