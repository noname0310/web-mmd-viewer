import { Component } from "the-world-engine";
import { MMDAnimationHelperAddParameter, MMDAnimationHelperMixer } from "three/examples/jsm/animation/MMDAnimationHelper";

import { MMDAnimationHelperOverride } from "./MMDAnimationHelperOverride";
import { SkinnedMeshContainer } from "./MmdModelLoader";
import { MMdPhysicsOverride } from "./MMDPhysicsOverride";

export interface MMDAnimationModelParameter extends Omit<MMDAnimationHelperAddParameter, "gravity"> {
    animation: THREE.AnimationClip | THREE.AnimationClip[];
    gravity?: THREE.Vector3;
}

export interface MMDAnimationCameraParameter extends
    Omit<MMDAnimationHelperAddParameter, "physics"|"warmup"|"unitStep"|"maxStepNum"|"gravity"> {
    animation: THREE.AnimationClip | THREE.AnimationClip[];
}

export class MmdPlayer extends Component {
    private readonly _helper = new MMDAnimationHelperOverride();

    private _isPlaying = false;
    private _elapsedTime = 0;
    private _model: SkinnedMeshContainer|null = null;
    private _manualUpdate = false;
    private _manualUpdateFps = 60;
    private _animationEndFrame = 0;

    private _useIk = true;
    private _useGrant = true;
    private _usePhysics = true;

    private _currentMesh: THREE.SkinnedMesh|null = null;
    private _currentCamera: THREE.Camera|null = null;
    private _currentAudio: THREE.Audio|null = null;

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

    public onDestroy(): void {
        const mmdPhysics = this.mixer?.physics;
        if (mmdPhysics) {
            (mmdPhysics as MMdPhysicsOverride).dispose();
        }

        if (this._currentMesh) this._helper.remove(this._currentMesh);
        if (this._currentCamera) this._helper.remove(this._currentCamera);
        if (this._currentAudio) this._helper.remove(this._currentAudio);
        this._currentMesh = null;
        this._currentCamera = null;
        this._currentAudio = null;
    }

    public play(
        model: SkinnedMeshContainer,
        modelParams: MMDAnimationModelParameter,
        camera?: THREE.Camera,
        cameraParams?: MMDAnimationCameraParameter,
        audio?: THREE.Audio,
        audioDelay = 0
    ): void {
        if (model.object3D === null) {
            throw new Error("model is null");
        }

        this.onDestroy();

        this._helper.add(model.object3D, modelParams as MMDAnimationHelperAddParameter);

        if (camera && cameraParams) {
            this._helper.add(camera, cameraParams);
        }

        if (audio) this._helper.add(audio, { delayTime: audioDelay });

        this._currentMesh = model.object3D;
        this._currentCamera = camera ?? null;
        this._currentAudio = audio ?? null;

        this._isPlaying = true;
        this._elapsedTime = 0;
        this._model = model;


        let duration = 0;

        if (modelParams.animation instanceof Array) {
            const animations = modelParams.animation as THREE.AnimationClip[];
            for (let i = 0; i < animations.length; ++i) {
                duration = Math.max(duration, animations[i].duration);
            }
        } else {
            duration = modelParams.animation.duration;
        }

        if (camera && cameraParams) {
            if (cameraParams.animation instanceof Array) {
                const animations = cameraParams.animation as THREE.AnimationClip[];
                for (let i = 0; i < animations.length; ++i) {
                    duration = Math.max(duration, animations[i].duration);
                }
            } else {
                duration = Math.max(duration, cameraParams.animation.duration);
            }
        }

        duration = Math.max(duration, audio?.duration ?? 0);

        
        this._animationEndFrame = Math.floor(duration * this._manualUpdateFps);
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

    public get animationEndFrame(): number {
        return this._animationEndFrame;
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

    public get mixer(): Omit<MMDAnimationHelperMixer, "duration">|null {
        if (!this._model || !this._model.object3D) return null;
        return this._helper.objects.get(this._model.object3D) as Omit<MMDAnimationHelperMixer, "duration">;
    }
    
    public process(frameTime: number): void {
        const time = frameTime / this._manualUpdateFps;
        this._helper.update(time - this._elapsedTime);
        this._model!.updateWorldMatrix();

        this._elapsedTime = time;
    }
}
