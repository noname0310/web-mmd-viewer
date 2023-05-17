import { Component } from "the-world-engine";
import { MMDAnimationHelperAddParameter, MMDAnimationHelperMixer } from "three/examples/jsm/animation/MMDAnimationHelper";

import { MMDAnimationHelperOverride } from "./loader/MMDAnimationHelperOverride";
import { MmdAnimationSequenceInstance } from "./loader/MMDLoaderOverride";
import { MmdModelAnimationClip, MmdModelAnimationLoader } from "./loader/MmdModelAnimationLoader";
import { MMdPhysicsOverride } from "./loader/MMDPhysicsOverride";
import { MmdModel, MmdSkinnedMeshContainer } from "./MmdModel";

export interface MMDAnimationModelParameter extends Omit<MMDAnimationHelperAddParameter, "gravity"> {
    animation: THREE.AnimationClip | THREE.AnimationClip[];
    gravity?: THREE.Vector3;
}

export interface MMDAnimationCameraParameter extends
    Omit<MMDAnimationHelperAddParameter, "physics" | "warmup" | "unitStep" | "maxStepNum" | "gravity"> {
    animation: THREE.AnimationClip | THREE.AnimationClip[];
}

export class MmdPlayer extends Component {
    private readonly _helper = new MMDAnimationHelperOverride({ pmxAnimation: true } as any);

    private _isPlaying = false;
    private _elapsedTime = 0;
    private _manualUpdate = false;
    private _manualUpdateFps = 60;
    private _animationEndFrame = 0;

    private _useIk = true;
    private _useGrant = true;
    private _usePhysics = true;

    private _currentMesh: THREE.SkinnedMesh | null = null;
    private _currentMeshContainer: MmdSkinnedMeshContainer | null = null;
    private _currentModel: MmdModel | null = null;
    private _currentCamera: THREE.Camera | null = null;
    private _currentAudio: THREE.Audio | null = null;
    private _currentAnimationSequenceInstance: MmdAnimationSequenceInstance | null = null;

    public awake(): void {
        this._helper
            .enable("ik", this._useIk)
            .enable("grant", this._useGrant)
            .enable("physics", this._usePhysics);

        this._helper.onBeforePhysics = (mesh): void => {
            if (!this._useIk) {
                mesh.updateWorldMatrix(true, true);
            }
        };
    }

    public update(): void {
        if (!this._isPlaying) return;
        if (this._manualUpdate) return;

        const deltaTime = this.engine.time.deltaTime;
        this._elapsedTime = this._elapsedTime += deltaTime;
        this._helper.update(deltaTime);
        this._currentMeshContainer!.updateWorldMatrix();

        this._currentAnimationSequenceInstance!.process((this._elapsedTime * this._manualUpdateFps) / 2);
        this._currentModel!.parameterController?.apply();
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
        this._currentAnimationSequenceInstance = null;
    }

    public play(
        model: MmdModel,
        modelAnimation: MmdModelAnimationClip,
        modelParams?: Omit<MMDAnimationModelParameter, "animation">,
        camera?: THREE.Camera,
        cameraParams?: MMDAnimationCameraParameter,
        audio?: THREE.Audio,
        audioDelay = 0
    ): void {
        const skinnedMesh = model.skinnedMesh;
        if (skinnedMesh === null) {
            throw new Error("MmdPlayer: model is not loaded");
        }

        this.onDestroy();

        const fullModelParams = {
            ...modelParams,
            animation: modelAnimation.modelAnimationClip
        };

        this._helper.add(skinnedMesh, fullModelParams as MMDAnimationHelperAddParameter);

        if (camera && cameraParams) {
            this._helper.add(camera, cameraParams);
        }

        if (audio) this._helper.add(audio, { delayTime: audioDelay });

        this._currentMesh = skinnedMesh;
        this._currentMeshContainer = model.object3DContainer;
        this._currentModel = model;
        this._currentCamera = camera ?? null;
        this._currentAudio = audio ?? null;
        this._currentAnimationSequenceInstance =
            MmdModelAnimationLoader.createInstance(model, this, modelAnimation).mmdAnimationSequenceInstance;

        this._isPlaying = true;
        this._elapsedTime = 0;

        let duration = 0;

        if (fullModelParams.animation instanceof Array) {
            const animations = fullModelParams.animation as THREE.AnimationClip[];
            for (let i = 0; i < animations.length; ++i) {
                if (animations[i].duration === -1) {
                    const tracks = animations[i].tracks;
                    for (let j = 0; j < tracks.length; ++j) {
                        const track = tracks[j];
                        if (track.times.length === 0) continue;
                        duration = Math.max(duration, track.times[track.times.length - 1]);
                    }
                } else {
                    duration = Math.max(duration, animations[i].duration);
                }
            }
        } else {
            if (fullModelParams.animation.duration === -1) {
                const tracks = fullModelParams.animation.tracks;
                for (let j = 0; j < tracks.length; ++j) {
                    const track = tracks[j];
                    if (track.times.length === 0) continue;
                    duration = Math.max(duration, track.times[track.times.length - 1]);
                }
            } else {
                duration = Math.max(duration, fullModelParams.animation.duration);
            }
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

    public get mixer(): Omit<MMDAnimationHelperMixer, "duration"> | null {
        if (!this._currentMeshContainer || !this._currentMeshContainer.object3D) return null;
        return this._helper.objects.get(this._currentMeshContainer.object3D) as Omit<MMDAnimationHelperMixer, "duration">;
    }

    public isIkEnabled(ikBoneName: string): boolean {
        if (!this._currentMeshContainer || !this._currentMeshContainer.object3D) return false;
        return this._helper.isIkEnabled(this._currentMeshContainer.object3D, ikBoneName);
    }

    public setIkEnabled(ikBoneName: string, enabled: boolean): void {
        if (!this._currentMeshContainer || !this._currentMeshContainer.object3D) return;
        this._helper.setIkEnabled(this._currentMeshContainer.object3D, ikBoneName, enabled);
    }

    public isIkExists(ikBoneName: string): boolean {
        if (!this._currentMeshContainer || !this._currentMeshContainer.object3D) return false;
        return this._helper.isIkExists(this._currentMeshContainer.object3D, ikBoneName);
    }

    public process(frameTime: number): void {
        const trimedFrameTime = Math.min(frameTime, this._animationEndFrame);

        const time = trimedFrameTime / this._manualUpdateFps;
        this._helper.update(time - this._elapsedTime);
        this._currentMeshContainer!.updateWorldMatrix();

        this._currentAnimationSequenceInstance!.process(frameTime / 2);
        this._currentModel!.parameterController?.apply();

        this._elapsedTime = time;
    }
}
