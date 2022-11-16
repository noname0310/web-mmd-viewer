import { Color, LinearEncoding } from "three/src/Three";

export class RendererState {
    public clearAlpha: number;
    public clearColor: Color;
    public renderTarget: THREE.WebGLRenderTarget | null;
    public outputEncoding: THREE.TextureEncoding;
    public overrideMaterial: THREE.Material | null;
    public shadowsEnabled: boolean;
    public autoClear: boolean;
    public autoClearColor: boolean;
    public autoClearDepth: boolean;
    public autoClearStencil: boolean;
    public background: THREE.Color | THREE.Texture | null;
    public matrixAutoUpdate: boolean;

    public constructor() {
        this.clearAlpha = 0;
        this.clearColor = new Color();
        this.renderTarget = null;
        this.outputEncoding = LinearEncoding;
        this.overrideMaterial = null;
        this.shadowsEnabled = false;

        this.autoClear = true;
        this.autoClearColor = true;
        this.autoClearDepth = true;
        this.autoClearStencil = true;

        this.background = null;
        this.matrixAutoUpdate = true;
    }

    public copy(renderer: THREE.WebGLRenderer, scene: THREE.Scene): void {
        if (renderer) {
            this.clearAlpha = renderer.getClearAlpha();
            this.clearColor = renderer.getClearColor(this.clearColor);
            this.renderTarget = renderer.getRenderTarget();

            this.shadowsEnabled = renderer.shadowMap.enabled;
            this.outputEncoding = renderer.outputEncoding;
            this.autoClear = renderer.autoClear;
            this.autoClearColor = renderer.autoClearColor;
            this.autoClearDepth = renderer.autoClearDepth;
            this.autoClearStencil = renderer.autoClearStencil;
        }

        if (scene) {
            this.overrideMaterial = scene.overrideMaterial;
            this.background = scene.background;
            this.matrixAutoUpdate = scene.matrixAutoUpdate;
        }
    }

    public restore(renderer: THREE.WebGLRenderer, scene: THREE.Scene): void {
        if (renderer) {
            renderer.setClearAlpha(this.clearAlpha);
            renderer.setClearColor(this.clearColor);
            renderer.setRenderTarget(this.renderTarget);

            renderer.shadowMap.enabled = this.shadowsEnabled;
            renderer.outputEncoding = this.outputEncoding;
            renderer.autoClear = this.autoClear;
            renderer.autoClearColor = this.autoClearColor;
            renderer.autoClearDepth = this.autoClearDepth;
            renderer.autoClearStencil = this.autoClearStencil;
        }

        if (scene) {
            scene.overrideMaterial = this.overrideMaterial;
            scene.background = this.background;
            scene.matrixAutoUpdate = this.matrixAutoUpdate;
        }

        this.renderTarget = null;
        this.overrideMaterial = null;
    }
}
