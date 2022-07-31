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

    private readonly _onLoadCompleteEvent = new EventContainer<() => void>();
    private readonly _onProcessEvent = new EventContainer<(frameTime: number) => void>();

    public awake(): void {
        this._mmdPlayer = this.gameObject.getComponent(MmdPlayer);
        this._animationSequencePlayer = this.gameObject.getComponent(AnimationSequencePlayer);
    }

    public asyncPlay(modelLoader: MmdModelLoader, cameraLoader: MmdCameraLoader): void {
        this.startCoroutine(this.playInternal(modelLoader, cameraLoader));
    }

    private *playInternal(modelLoader: MmdModelLoader, cameraLoader: MmdCameraLoader): CoroutineIterator {
        while (modelLoader.skinnedMesh === null || modelLoader.isAnimationLoading) yield null;
        while (cameraLoader.isAnimationLoading) yield null;

        const model = modelLoader.object3DContainer!;
        const modelAnimation = modelLoader.animations[0];
        const cameraLoaderDeRef = cameraLoader;
        const cameraAnimation = cameraLoader.animations[0];

        const mmdPlayer = this._mmdPlayer!;
        mmdPlayer.manualUpdate = true;
        mmdPlayer.play(
            model,
            modelAnimation,
            cameraLoaderDeRef.threeCamera!,
            cameraAnimation
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
                    this._onProcessEvent.invoke(frame);
                }
            ]
        );
        
        this._onLoadCompleteEvent.invoke();

        this._animationSequencePlayer!.play();
    }

    public get onLoadComplete(): IEventContainer<() => void> {
        return this._onLoadCompleteEvent;
    }

    public get onProcess(): IEventContainer<(frameTime: number) => void> {
        return this._onProcessEvent;
    }
}
