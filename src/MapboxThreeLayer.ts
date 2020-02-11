import { Camera, Scene, DirectionalLight, WebGLRenderer, Matrix4, Vector3 } from "three"
import {GLTFLoader, GLTF} from 'three/examples/jsm/loaders/GLTFLoader'
import { Map, CustomLayerInterface } from "mapbox-gl"

export class MapboxThreeLayer implements CustomLayerInterface {
    id = '3d-model'
    type: "custom" = "custom"
    renderingMode: "3d" | "2d" | undefined = "3d"

    camera: Camera
    scene: Scene
    map: Map
    renderer?: WebGLRenderer

    constructor(map: Map) {
        this.map = map
        this.camera = new Camera()
        this.scene = new Scene()

        // create two three.js lights to illuminate the model
        this.makeLights()

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

        const loader = new GLTFLoader();

        loader.load('https://docs.mapbox.com/mapbox-gl-js/assets/34M_17/34M_17.gltf', (gltf: GLTF) => {
            this.scene.add(gltf.scene)
        })

        this.renderer = new WebGLRenderer({
            canvas: this.map.getCanvas(),
            context: gl,
            antialias: true,
        })

        this.renderer.autoClear = false
    }

    render(gl: WebGLRenderingContext, matrix: any) {

    }
}