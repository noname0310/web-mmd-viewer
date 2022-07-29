import { Camera, Component, DuckThreeCamera } from "the-world-engine";
import { OrbitControls as ThreeOrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { Vector3 } from "three/src/Three";

export class OrbitControls extends Component {
    private _camera: Camera|null = null;
    private _orbitControls: ThreeOrbitControls|null = null;

    public target = new Vector3();
    public minDistance = 20;
    public maxDistance = 50;

    public awake(): void {
        this._camera = this.gameObject.getComponent(Camera);
    }

    public start(): void {
        const controls = this._orbitControls = new ThreeOrbitControls(
            (this._camera as any).threeCamera || DuckThreeCamera.createInterface(this._camera!), //todo fix this
            this.engine.domElement
        );
        controls.listenToKeyEvents(window);

        controls.enableDamping = false;
        controls.dampingFactor = 0.05;

        controls.screenSpacePanning = true;

        controls.minDistance = this.minDistance;
        controls.maxDistance = this.maxDistance;

        controls.maxPolarAngle = Math.PI / 2;

        controls.target = this.target;
    }

    public update(): void {
        this._orbitControls!.update();
    }

    public onDestroy(): void {
        this._orbitControls!.dispose();
        this._orbitControls = null;
        this._camera = null;
    }
}
