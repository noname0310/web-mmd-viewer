import { EffectComposer, RenderPass } from "postprocessing";
import { Camera, CameraContainer, Component, EngineGlobalObject, IReadonlyGameScreen, WebGLGlobalObject } from "the-world-engine";
import { WebGLRenderer } from "three/src/Three";

class EffectComposerRc {
    private static readonly _map = new Map<EngineGlobalObject, EffectComposerRc>();

    private _referenceCount = 0;
    private readonly _effectComposer: EffectComposer;
    private readonly onScreenResize = (width: number, height: number): void => {
        this._effectComposer.setSize(width, height);
    };

    private constructor(engineGlobalObject: EngineGlobalObject, effectComposer: EffectComposer) {
        this._effectComposer = effectComposer;
        EffectComposerRc._map.set(engineGlobalObject, this);
    }

    public static createOraddReference(engineGlobalObject: EngineGlobalObject, webglRenderer: WebGLRenderer): EffectComposer {
        let effectComposerRc = EffectComposerRc._map.get(engineGlobalObject);
        if (effectComposerRc === undefined) {
            const effectComposer = new EffectComposer(webglRenderer);
            const screen = engineGlobalObject.screen;
            effectComposer.setSize(screen.width, screen.height);
            effectComposerRc = new EffectComposerRc(engineGlobalObject, effectComposer);
            screen.onResize.addListener(effectComposerRc.onScreenResize);
            EffectComposerRc._map.set(engineGlobalObject, effectComposerRc);
        }
        effectComposerRc._referenceCount += 1;
        return effectComposerRc._effectComposer;
    }

    public static removeReference(engineGlobalObject: EngineGlobalObject): void {
        const effectComposerRc = EffectComposerRc._map.get(engineGlobalObject);
        if (effectComposerRc !== undefined) {
            effectComposerRc._referenceCount -= 1;
            if (effectComposerRc._referenceCount === 0) {
                const screen = engineGlobalObject.screen;
                screen.onResize.removeListener(effectComposerRc.onScreenResize);
                EffectComposerRc._map.delete(engineGlobalObject);
            }
        }
    }
}

export class WebGLGlobalPostProcessVolume extends Component {
    private _renderPass: RenderPass|null = null;
    private _effectComposer: EffectComposer|null = null;

    private readonly onCameraChanged = (camera: Camera): void => {
        if (this._renderPass !== null) {
            this._renderPass.dispose();
            this._renderPass = new RenderPass(this.engine.scene.unsafeGetThreeScene(), (camera as any).threeCamera!);
            if (this._effectComposer !== null) {
                this._effectComposer.passes[0] = this._renderPass;
            }
        }
    };

    public onEnable(): void {
        const threeScene = this.engine.scene.unsafeGetThreeScene();
        const cameraContainer = this.engine.cameraContainer as CameraContainer;
        const camera = cameraContainer.camera;
        const webglGlobalObject = this.engine.webGL;

        if (camera === null) {
            throw new Error("WebGLGlobalPostProcessVolume must be loaded after camera.");
        }

        if (webglGlobalObject === null) {
            throw new Error("WebGLRenderer is not initialized.");
        }

        if (webglGlobalObject.webglRenderer === null) {
            throw new Error("You can't use WebGLRenderer wrapper for post processing.");
        }

        const renderPass = this._renderPass = new RenderPass(threeScene, (camera as any).threeCamera!);
        const effectComposer = this._effectComposer = EffectComposerRc.createOraddReference(this.engine, webglGlobalObject.webglRenderer);
        cameraContainer.onCameraChanged.addListener(this.onCameraChanged);
        this._renderPass;
        this._effectComposer;
        effectComposer.addPass(renderPass);

        this._effectComposerInitializer?.(effectComposer, threeScene, (camera as any).threeCamera!, this.engine.screen);

        (this.engine.webGL as WebGLGlobalObject).effectComposer = (effectComposer as any);
    }

    public onDisable(): void {
        if (this._renderPass !== null) {
            this._effectComposer?.removePass(this._renderPass);
            this._renderPass = null;

            const cameraContainer = this.engine.cameraContainer as CameraContainer;
            cameraContainer.onCameraChanged.removeListener(this.onCameraChanged);
        }
        if (this._effectComposer !== null) {
            EffectComposerRc.removeReference(this.engine);
            this._effectComposer = null;
        }
    }

    private _effectComposerInitializer: ((effectComposer: EffectComposer, scene: THREE.Scene, camera: THREE.Camera, screen: IReadonlyGameScreen) => void)|null = null;

    public initializer(effectComposerInitializer: (effectComposer: EffectComposer, scene: THREE.Scene, camera: THREE.Camera, screen: IReadonlyGameScreen) => void): void {
        this._effectComposerInitializer = effectComposerInitializer;
    }
}