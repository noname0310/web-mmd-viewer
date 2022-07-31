import { Component, Object3DContainer } from "the-world-engine";
import { MMDAnimationHelper } from "three/examples/jsm/animation/MMDAnimationHelper";
import { IAnimationContainer, IAnimationInstance } from "tw-engine-498tokio";

export class MmdPlayer extends Component implements IAnimationInstance {
    private readonly _helper = new MMDAnimationHelper();

    private _isPlaying = false;
    private _elapsedTime = 0;
    private _model: Object3DContainer<THREE.SkinnedMesh<THREE.BufferGeometry, THREE.Material|THREE.Material[]>>|null = null;
    private _manualUpdate = false;
    private _manualUpdateFps = 60;

    private _useIk = true;
    private _useGrant = true;
    private _usePhysics = true;

    public awake(): void {
        this._helper
            .enable("ik", this._useIk)
            .enable("grant", this._useGrant)
            .enable("physics", this._usePhysics);
    }

    public update(): void {
        if (!this._isPlaying) return;
        if (this._manualUpdate) return;

        const deltaTime = this.engine.time.deltaTime;
        this._elapsedTime = this._elapsedTime += deltaTime;
        this._helper.update(deltaTime);
        this._model!.updateWorldMatrix();
    }

    public play(
        model: Object3DContainer<THREE.SkinnedMesh<THREE.BufferGeometry, THREE.Material|THREE.Material[]>>,
        modelAnimation: THREE.AnimationClip,
        camera?: THREE.Camera,
        cameraAnimation?: THREE.AnimationClip,
        audio?: THREE.Audio,
        audioDelay = 0
    ): void {
        if (model.object3D === null) {
            throw new Error("model is null");
        }

        this._helper.add(model.object3D, { animation: modelAnimation! });

        if (camera && cameraAnimation) {
            this._helper.add(camera, { animation: cameraAnimation! });
        }

        if (audio) this._helper.add(audio, { delayTime: audioDelay });

        this._isPlaying = true;
        this._elapsedTime = 0;
        this._model = model;
    }

    public stop(): void {
        this._isPlaying = false;
    }

    public get isPlaying(): boolean {
        return this._isPlaying;
    }

    public get elapsedTime(): number {
        return this._elapsedTime;
    }
    
    public get manualUpdate(): boolean {
        return this._manualUpdate;
    }

    public set manualUpdate(value: boolean) {
        this._manualUpdate = value;
    }

    public get manualUpdateFps(): number {
        return this._manualUpdateFps;
    }

    public set manualUpdateFps(value: number) {
        this._manualUpdateFps = value;
    }

    public get useIk(): boolean {
        return this._useIk;
    }

    public set useIk(value: boolean) {
        this._useIk = value;
        this._helper.enable("ik", value);
    }

    public get useGrant(): boolean {
        return this._useGrant;
    }

    public set useGrant(value: boolean) {
        this._useGrant = value;
        this._helper.enable("grant", value);
    }

    public get usePhysics(): boolean {
        return this._usePhysics;
    }

    public set usePhysics(value: boolean) {
        this._usePhysics = value;
        this._helper.enable("physics", value);
    }

    public get animationContainer(): IAnimationContainer<unknown> {
        throw new Error("there is no AnimationContainer of MmdPlayer");
    }

    public frameIndexHint(): void {
        // there is no hint
    }
    
    public process(frameTime: number): void {
        const time = frameTime / this._manualUpdateFps;
        this._helper.update(time - this._elapsedTime);
        this._model!.updateWorldMatrix();

        this._elapsedTime = time;
    }
}
