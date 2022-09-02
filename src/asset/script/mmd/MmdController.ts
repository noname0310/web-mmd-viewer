import { Camera, Component, CoroutineIterator, EventContainer, IEventContainer, ReadonlyVector3, WritableVector3 } from "the-world-engine";
import { Vector3 } from "three/src/Three";
import { AnimationKey, AnimationSequence, AnimationTrack, InterpolationKind, RangedAnimation } from "tw-engine-498tokio";
import { AnimationSequencePlayer } from "tw-engine-498tokio/dist/asset/script/animation/player/AnimationSequencePlayer";

import { MmdCamera } from "./MmdCamera";
import { MmdCameraAnimationClip, MmdCameraAnimationLoader } from "./loader/MmdCameraAnimationLoader";
import { MmdModel } from "./MmdModel";
import { MmdPlayer } from "./MmdPlayer";

export class MmdController extends Component {
    public static readonly requiredComponents = [AnimationSequencePlayer];

    private readonly _mmdPlayers: MmdPlayer[] = [];
    private _animationSequencePlayer: AnimationSequencePlayer|null = null;

    private readonly _modelLoaders: MmdModel[] = [];
    private _cameraLoader: MmdCamera|null = null;

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
        let camera: Camera|null = null;
        let cameraAnimation: MmdCameraAnimationClip|null = null;

        if (cameraAnimationName) {
            const cameraLoader = this._cameraLoader!;
            while (cameraLoader.isAnimationLoading(cameraAnimationName)) yield null;

            camera = cameraLoader.camera;
            cameraAnimation = cameraLoader.animations.get(cameraAnimationName)!;
        }

        const cameraAnimationInstance = camera !== null && cameraAnimation !== null 
            ? MmdCameraAnimationLoader.createInstance(camera, cameraAnimation)
            : null;

        const modelLoaders = this._modelLoaders!;
        for (let i = 0; i < modelLoaders.length; ++i) {
            const modelLoader = modelLoaders[i];
            while (modelLoader.skinnedMesh === null || modelLoader.isAnimationLoading(modelAnimationName)) yield null;
        }

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

        const firstMmdPlayer = mmdPlayers[0];

        this._animationSequencePlayer!.setAnimationAndBind(
            new AnimationSequence([
                new RangedAnimation(AnimationTrack.createScalarTrack([
                    new AnimationKey(0, 0, InterpolationKind.Linear),
                    new AnimationKey(endFrame, endFrame, InterpolationKind.Linear)
                ]))
            ]), [
                modelLoaders.length === 1
                    ? (frame: number): void => {
                        firstMmdPlayer.process(frame);
                        cameraAnimationInstance?.process(frame);
                    }
                    : (frame: number): void => {
                        for (let i = 0; i < mmdPlayerCount; ++i) {
                            mmdPlayers[i].process(frame);
                            cameraAnimationInstance?.process(frame);
                        }
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

    public get modelLoaders(): readonly MmdModel[] {
        return this._modelLoaders;
    }

    public addModelLoader(modelLoader: MmdModel): void {
        this._modelLoaders.push(modelLoader);
    }
    
    public get cameraLoader(): MmdCamera|null {
        return this._cameraLoader;
    }

    public set cameraLoader(value: MmdCamera|null) {
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
