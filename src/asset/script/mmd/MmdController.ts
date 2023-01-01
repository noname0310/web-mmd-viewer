import { Camera, Component, CoroutineIterator, EventContainer, IEventContainer, ReadonlyVector3, WritableVector3 } from "the-world-engine";
import { Vector3 } from "three/src/Three";
import { AnimationKey, AnimationSequence, AnimationTrack, InterpolationKind, RangedAnimation } from "tw-engine-498tokio";
import { AnimationSequencePlayer } from "tw-engine-498tokio/dist/asset/script/animation/player/AnimationSequencePlayer";

import { MmdCameraAnimationClip, MmdCameraAnimationLoader } from "./loader/MmdCameraAnimationLoader";
import { MmdAnimationSequenceInstance } from "./loader/MMDLoaderOverride";
import { MmdModelAnimationLoader } from "./loader/MmdModelAnimationLoader";
import { MmdCamera } from "./MmdCamera";
import { MmdModel } from "./MmdModel";
import { MmdPlayer } from "./MmdPlayer";

export class MmdController extends Component {
    public static readonly requiredComponents = [AnimationSequencePlayer];

    private readonly _mmdPlayers: MmdPlayer[] = [];
    private _animationSequencePlayer: AnimationSequencePlayer | null = null;

    private readonly _models: MmdModel[] = [];
    private _mmdCamera: MmdCamera | null = null;

    private _physicsUnitStep = 1 / 65;
    private _physicsMaximumStepCount = 3;
    private readonly _gravity = new Vector3(0, -9.8 * 10, 0);

    private readonly _onLoadCompleteEvent = new EventContainer<() => void>();

    private _initializeFunction: (() => void) | null = null;
    private _readyToPlay = false;

    public awake(): void {
        this._animationSequencePlayer = this.gameObject.getComponent(AnimationSequencePlayer);
    }

    public start(): void {
        this._readyToPlay = true;
        if (this._initializeFunction !== null) {
            this._initializeFunction();
            this._initializeFunction = null;
        }
    }

    public asyncPlay(modelAnimationName: string | string[], cameraAnimationName?: string, forceWaitAnimationLoad = false): void {
        if (!this._readyToPlay) {
            this._initializeFunction = (): void => {
                this.asyncPlay(modelAnimationName, cameraAnimationName, forceWaitAnimationLoad);
            };
            return;
        }

        if (this._models.length === 0) throw new Error("model is empty");
        if (cameraAnimationName) {
            if (this._mmdCamera === null) throw new Error("camera is null");
        }

        this.startCoroutine(this.playInternal(modelAnimationName, cameraAnimationName, forceWaitAnimationLoad));
    }

    private *playInternal(modelAnimationName: string | string[], cameraAnimationName?: string, forceWaitAnimationLoad?: boolean): CoroutineIterator {
        let camera: Camera | null = null;
        let cameraAnimation: MmdCameraAnimationClip | null = null;

        if (cameraAnimationName) {
            const mmdCamera = this._mmdCamera!;
            while (mmdCamera.isAnimationLoading(cameraAnimationName)) yield null;
            while (forceWaitAnimationLoad && !mmdCamera.animations.has(cameraAnimationName)) yield null;

            camera = mmdCamera.camera;
            cameraAnimation = mmdCamera.animations.get(cameraAnimationName)!;
        }

        const cameraAnimationInstance = camera !== null && cameraAnimation !== null
            ? MmdCameraAnimationLoader.createInstance(camera, cameraAnimation)
            : null;

        const models = this._models!;
        for (let i = 0; i < models.length; ++i) {
            const model = models[i];
            const animationName = modelAnimationName instanceof Array ? modelAnimationName[i] : modelAnimationName;
            while (model.skinnedMesh === null || model.isAnimationLoading(animationName)) yield null;
            while (forceWaitAnimationLoad && !model.animations.has(animationName)) yield null;
        }

        const mmdPlayers = this._mmdPlayers;
        const mmdPlayerCount = mmdPlayers.length;
        if (mmdPlayerCount !== models.length) {
            throw new Error("mmdPlayer count must be equal to model count");
        }

        const animationSequenceInstances: MmdAnimationSequenceInstance[] = [];

        let endFrame = 0;
        for (let i = 0; i < mmdPlayerCount; ++i) {
            const mmdPlayer = mmdPlayers[i];
            const model = models[i];
            const skinnedMeshContainer = model.object3DContainer!;
            const animationName = modelAnimationName instanceof Array ? modelAnimationName[i] : modelAnimationName;
            const modelAnimation = model.animations.get(animationName)!;

            mmdPlayer.manualUpdate = true;
            mmdPlayer.play(
                skinnedMeshContainer,
                { animation: modelAnimation.modelAnimationClip, unitStep: this._physicsUnitStep, maxStepNum: this._physicsMaximumStepCount }
            );

            const animationClipInstance = MmdModelAnimationLoader.createInstance(model, mmdPlayer, modelAnimation);
            animationSequenceInstances.push(animationClipInstance.mmdAnimationSequenceInstance);

            endFrame = Math.max(endFrame, mmdPlayer.animationEndFrame);
        }
        if (cameraAnimation !== null) {
            endFrame = Math.max(endFrame, cameraAnimation.endFrame * (60 / cameraAnimation.frameRate));
        }

        const firstMmdPlayer = mmdPlayers[0];
        const firstPropertyAnimationInstance = animationSequenceInstances[0];
        const firstModel = models[0];

        this._animationSequencePlayer!.setAnimationAndBind(
            new AnimationSequence([
                new RangedAnimation(AnimationTrack.createScalarTrack([
                    new AnimationKey(0, 0, InterpolationKind.Linear),
                    new AnimationKey(endFrame, endFrame, InterpolationKind.Linear)
                ]))
            ]), [
            models.length === 1
                ? (frame: number): void => {
                    firstMmdPlayer.process(frame);
                    firstPropertyAnimationInstance.process(frame / 2);
                    firstModel.parameterController?.apply();
                    cameraAnimationInstance?.process(frame);
                }
                : (frame: number): void => {
                    for (let i = 0; i < mmdPlayerCount; ++i) {
                        mmdPlayers[i].process(frame);
                        animationSequenceInstances[i].process(frame / 2);
                        models[i].parameterController?.apply();
                    }
                    cameraAnimationInstance?.process(frame);
                }
        ]
        );

        this._onLoadCompleteEvent.invoke();

        this._animationSequencePlayer!.play();
    }

    public addMmdPlayer(mmdPlayer: MmdPlayer): void {
        this._mmdPlayers.push(mmdPlayer);
    }

    public removeMmdPlayer(mmdPlayer: MmdPlayer): void {
        const index = this._mmdPlayers.indexOf(mmdPlayer);
        if (index >= 0) {
            this._mmdPlayers.splice(index, 1);
        }
    }

    public removeAllMmdPlayers(): void {
        this._mmdPlayers.length = 0;
    }

    public get models(): readonly MmdModel[] {
        return this._models;
    }

    public addModel(model: MmdModel): void {
        this._models.push(model);
    }

    public removeModel(model: MmdModel): void {
        const index = this._models.indexOf(model);
        if (index >= 0) {
            this._models.splice(index, 1);
        }
    }

    public removeAllModel(): void {
        this._models.length = 0;
    }

    public get mmdCamera(): MmdCamera | null {
        return this._mmdCamera;
    }

    public set mmdCamera(value: MmdCamera | null) {
        this._mmdCamera = value;
    }

    public get physicsUnitStep(): number {
        return this._physicsUnitStep;
    }

    public set physicsUnitStep(value: number) {
        this._physicsUnitStep = value;

        const mmdPlayers = this._mmdPlayers;
        for (let i = 0; i < mmdPlayers.length; ++i) {
            const mmdPlayer = mmdPlayers[i];
            const mixer = mmdPlayer.mixer;
            if (mixer && mixer.physics) {
                mixer.physics.unitStep = value;
            }
        }
    }

    public get physicsMaximumStepCount(): number {
        return this._physicsMaximumStepCount;
    }

    public set physicsMaximumStepCount(value: number) {
        this._physicsMaximumStepCount = value;

        const mmdPlayers = this._mmdPlayers;
        for (let i = 0; i < mmdPlayers.length; ++i) {
            const mmdPlayer = mmdPlayers[i];
            const mixer = mmdPlayer.mixer;
            if (mixer && mixer.physics) {
                mixer.physics.maxStepNum = value;
            }
        }
    }

    public get gravity(): ReadonlyVector3 {
        return this._gravity;
    }

    public set gravity(value: ReadonlyVector3) {
        (this._gravity as WritableVector3).copy(value);

        const mmdPlayers = this._mmdPlayers;
        for (let i = 0; i < mmdPlayers.length; ++i) {
            const mmdPlayer = mmdPlayers[i];
            const mixer = mmdPlayer.mixer;
            if (mixer && mixer.physics) {
                (mixer.physics.gravity as WritableVector3).copy(value);
            }
        }
    }

    public get onLoadComplete(): IEventContainer<() => void> {
        return this._onLoadCompleteEvent;
    }
}
