import { Mesh, OrthographicCamera, PlaneGeometry } from "three/src/Three";

export class FullScreenQuad {
    private _mesh: THREE.Mesh;
    private readonly _camera: THREE.Camera;

    public get camera(): THREE.Camera {
        return this._camera;
    }

    public get material(): THREE.Material {
        return this._mesh.material as THREE.Material;
    }

    public set material(value: THREE.Material) {
        this._mesh.material = value;
    }

    public constructor(material?: THREE.Material) {
        const camera = new OrthographicCamera(- 1, 1, 1, - 1, 0, 1);
        const geometry = new PlaneGeometry(2, 2);

        this._mesh = new Mesh(geometry, material);
        this._camera = camera;
    }

    public dispose(): void {
        this._mesh.geometry.dispose();
    }

    public render(renderer: THREE.WebGLRenderer): void {
        renderer.render(this._mesh, this._camera);
    }
}
