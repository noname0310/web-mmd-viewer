import { Component, CoroutineIterator, EventContainer, IEventContainer } from "the-world-engine";
import { AnimationKey, AnimationSequence, AnimationTrack, InterpolationKind, RangedAnimation } from "tw-engine-498tokio";
import { AnimationSequencePlayer } from "tw-engine-498tokio/dist/asset/script/animation/player/AnimationSequencePlayer";

import { MmdCameraLoader } from "./MmdCameraLoader";
import { MmdModelLoader } from "./MmdModelLoader";
import { MmdPlayer } from "./MmdPlayer";

export class MmdController extends Component {
    public static readonly requiredComponents = [MmdPlayer, AnimationSequencePlayer];

    private _mmdPlayer: MmdPlayer|null = null;
    private _animationSequencePlayer: AnimationSequencePlayer|null = null;

    private _modelLoader: MmdModelLoader|null = null;
    private _cameraLoader: MmdCameraLoader|null = null;

    private readonly _onLoadCompleteEvent = new EventContainer<() => void>();

    private _initializeFunction: (() => void)|null = null;
    private _readyToPlay = false;

    public awake(): void {
        this._mmdPlayer = this.gameObject.getComponent(MmdPlayer);
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

        if (this._modelLoader === null) throw new Error("modelLoader is null");
        if (cameraAnimationName) {
            if (this._cameraLoader === null) throw new Error("cameraLoader is null");
        }

        this.startCoroutine(this.playInternal(modelAnimationName, cameraAnimationName));
    }

    private *playInternal(modelAnimationName: string, cameraAnimationName?: string): CoroutineIterator {
        let threeCamera: THREE.Camera|null = null;
        let cameraAnimation: THREE.AnimationClip|null = null;

        if (cameraAnimationName) {
            const cameraLoader = this._cameraLoader!;
            while (cameraLoader.isAnimationLoading(cameraAnimationName)) yield null;

            threeCamera = cameraLoader.threeCamera;
            cameraAnimation = cameraLoader.animations.get(cameraAnimationName)!;
        }

        const modelLoader = this._modelLoader!;
        while (modelLoader.skinnedMesh === null || modelLoader.isAnimationLoading(modelAnimationName)) yield null;

        const model = modelLoader.object3DContainer!;
        const modelAnimation = modelLoader.animations.get(modelAnimationName)!;

        const mmdPlayer = this._mmdPlayer!;
        mmdPlayer.manualUpdate = true;
        mmdPlayer.play(
            model,
            modelAnimation,
            threeCamera ?? undefined,
            cameraAnimation ?? undefined
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
                }
            ]
        );
        
        this._onLoadCompleteEvent.invoke();

        this._animationSequencePlayer!.play();
    }

    public get modelLoader(): MmdModelLoader|null {
        return this._modelLoader;
    }

    public set modelLoader(value: MmdModelLoader|null) {
        this._modelLoader = value;
    }
    
    public get cameraLoader(): MmdCameraLoader|null {
        return this._cameraLoader;
    }

    public set cameraLoader(value: MmdCameraLoader|null) {
        this._cameraLoader = value;
    }

    public get onLoadComplete(): IEventContainer<() => void> {
        return this._onLoadCompleteEvent;
    }
}
