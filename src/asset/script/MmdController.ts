import { Camera, Component, CoroutineIterator, EventContainer, IEventContainer, ReadonlyVector3, WritableVector3 } from "the-world-engine";
import { Vector3 } from "three/src/Three";
import { AnimationKey, AnimationSequence, AnimationTrack, InterpolationKind, RangedAnimation } from "tw-engine-498tokio";
import { AnimationSequencePlayer } from "tw-engine-498tokio/dist/asset/script/animation/player/AnimationSequencePlayer";

import { MmdCameraAnimationBuilder, MmdCameraAnimationClip, MmdCameraAnimationClipInstance } from "./MmdCameraAnimationBuilder";
import { MmdCameraLoader } from "./MmdCameraLoader";
import { MmdModelLoader } from "./MmdModelLoader";
import { MmdPlayer } from "./MmdPlayer";

export class MmdController extends Component {
    public static readonly requiredComponents = [AnimationSequencePlayer];

    private readonly _mmdPlayers: MmdPlayer[] = [];
    private _animationSequencePlayer: AnimationSequencePlayer|null = null;

    private readonly _modelLoaders: MmdModelLoader[] = [];
    private _cameraLoader: MmdCameraLoader|null = null;

    private _physicsUnitStep = 1 / 65;
    private _physicsMaximumStepCount = 3;
    private readonly _gravity = new Vector3(0, -9.8 * 10, 0);

    private readonly _onLoadCompleteEvent = new EventContainer<() => void>();

    private _initializeFunction: (() => void)|null = null;
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

    public asyncPlay(modelAnimationName: string, cameraAnimationName?: string): void {
        if (!this._readyToPlay) {
            this._initializeFunction = (): void => {
                this.asyncPlay(modelAnimationName, cameraAnimationName);
            };
            return;
        }

        if (this._modelLoaders.length === 0) throw new Error("modelLoader is empty");
        if (cameraAnimationName) {
            if (this._cameraLoader === null) throw new Error("cameraLoader is null");
        }

        this.startCoroutine(this.playInternal(modelAnimationName, cameraAnimationName));
    }

    private *playInternal(modelAnimationName: string, cameraAnimationName?: string): CoroutineIterator {
        let threeCamera: Camera|null = null;
        let cameraAnimation: MmdCameraAnimationClip|null = null;
        let cameraAnimationInstance: MmdCameraAnimationClipInstance|null = null;

        if (cameraAnimationName) {
            const cameraLoader = this._cameraLoader!;
            while (cameraLoader.isAnimationLoading(cameraAnimationName)) yield null;

            threeCamera = cameraLoader.threeCamera;
            cameraAnimation = cameraLoader.animations.get(cameraAnimationName)!;
            cameraAnimationInstance = MmdCameraAnimationBuilder.createInstance(threeCamera!, cameraAnimation);
        }

        const modelLoaders = this._modelLoaders!;
        for (let i = 0; i < modelLoaders.length; ++i) {
            const modelLoader = modelLoaders[i];
            while (modelLoader.skinnedMesh === null || modelLoader.isAnimationLoading(modelAnimationName)) yield null;
        }

        if (modelLoaders.length === 1) {
            const modelLoader = modelLoaders[0];
            const model = modelLoader.object3DContainer!;
            const modelAnimation = modelLoader.animations.get(modelAnimationName)!;

            if (this._mmdPlayers.length === 0) {
                throw new Error("you need one or more MmdPlayer for playing animation");
            }
            const mmdPlayer = this._mmdPlayers[0];
            mmdPlayer.manualUpdate = true;
            mmdPlayer.play(
                model,
                { animation: modelAnimation, unitStep: this._physicsUnitStep, maxStepNum: this._physicsMaximumStepCount }
            );
            const endFrame = mmdPlayer.animationEndFrame;

            this._animationSequencePlayer!.setAnimationAndBind(
                new AnimationSequence([
                    new RangedAnimation(AnimationTrack.createScalarTrack([
                        AnimationKey.createValueType(0, 0, InterpolationKind.Linear),
                        AnimationKey.createValueType(endFrame, endFrame, InterpolationKind.Linear)
                    ]))
                ]), [
                    (frame: number): void => {
                        mmdPlayer.process(frame);
                        cameraAnimationInstance?.process(frame);
                    }
                ]
            );
        } else {
            const mmdPlayers = this._mmdPlayers;
            const mmdPlayerCount = mmdPlayers.length;
            if (mmdPlayerCount !== modelLoaders.length) {
                throw new Error("mmdPlayer count must be equal to modelLoader count");
            }

            let endFrame = 0;
            for (let i = 0; i < mmdPlayerCount; ++i) {
                const mmdPlayer = mmdPlayers[i];
                const modelLoader = modelLoaders[i];
                const model = modelLoader.object3DContainer!;
                const modelAnimation = modelLoader.animations.get(modelAnimationName)!;

                mmdPlayer.manualUpdate = true;
                mmdPlayer.play(
                    model,
                    { animation: modelAnimation, unitStep: this._physicsUnitStep, maxStepNum: this._physicsMaximumStepCount }
                );
                endFrame = Math.max(endFrame, mmdPlayer.animationEndFrame);
            }

            this._animationSequencePlayer!.setAnimationAndBind(
                new AnimationSequence([
                    new RangedAnimation(AnimationTrack.createScalarTrack([
                        AnimationKey.createValueType(0, 0, InterpolationKind.Linear),
                        AnimationKey.createValueType(endFrame, endFrame, InterpolationKind.Linear)
                    ]))
                ]), [
                    (frame: number): void => {
                        for (let i = 0; i < mmdPlayerCount; ++i) {
                            mmdPlayers[i].process(frame);
                            cameraAnimationInstance?.process(frame);
                        }
                    }
                ]
            );
        }
        
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

    public get modelLoaders(): readonly MmdModelLoader[] {
        return this._modelLoaders;
    }

    public addModelLoader(modelLoader: MmdModelLoader): void {
        this._modelLoaders.push(modelLoader);
    }
    
    public get cameraLoader(): MmdCameraLoader|null {
        return this._cameraLoader;
    }

    public set cameraLoader(value: MmdCameraLoader|null) {
        this._cameraLoader = value;
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
