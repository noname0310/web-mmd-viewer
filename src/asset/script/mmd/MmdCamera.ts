import { Vmd } from "@noname0310/mmd-parser";
import { Camera, Component, Coroutine, CoroutineIterator, EventContainer, IEventContainer, WaitUntil } from "the-world-engine";

import { MmdCameraAnimationClip, MmdCameraAnimationLoader } from "./loader/MmdCameraAnimationLoader";


export class MmdCamera extends Component {
    public override readonly requiredComponents = [Camera];

    private readonly _loader = new MmdCameraAnimationLoader();

    private _camera: Camera|null = null;
    private readonly _animations: Map<string, MmdCameraAnimationClip> = new Map();
    private readonly _loadingAnimations = new Set<string>();
    private readonly _onProgressEvent = new EventContainer<(event: ProgressEvent<EventTarget>) => void>();

    private readonly _animationLoadingCoroutines: Coroutine[] = [];

    private _isReadyToLoad = false;
    private readonly _initLoadAnimationFunc: (() => void)[] = [];

    public awake(): void {
        this._isReadyToLoad = true;
    }

    public start(): void {
        this._camera = this.gameObject.getComponent(Camera)!;

        const initLoadAnimationFunc = this._initLoadAnimationFunc;
        for (let i = 0; i < initLoadAnimationFunc.length; ++i) {
            initLoadAnimationFunc[i]();
        }
        this._initLoadAnimationFunc.length = 0;
    }

    public onDisable(): void {
        if (this.enabled) {
            this._animationLoadingCoroutines.length = 0;
            this._loadingAnimations.clear();
        }
    }

    public onDestroy(): void {
        this._camera = null;
        this._animations.clear();
        this._onProgressEvent.removeAllListeners();
        this._initLoadAnimationFunc.length = 0;
    }

    public asyncLoadAnimation(
        animationName: string,
        url: string,
        onComplete?: (animation: MmdCameraAnimationClip) => void
    ): void {
        this._loadingAnimations.add(animationName);

        if (!this._isReadyToLoad) {
            this._initLoadAnimationFunc.push(() => this.asyncLoadAnimation(animationName, url, onComplete));
            return;
        }

        const coroutine = this.startCoroutine(
            this.loadAnimationInternal(
                animationName,
                url,
                (event) => this._onProgressEvent.invoke(event),
                onComplete
            )
        );
        this._animationLoadingCoroutines.push(coroutine);
    }

    public loadAnimation(
        animationName: string,
        vmd: Vmd
    ): void {
        if (!this._isReadyToLoad) {
            this._initLoadAnimationFunc.push(() => this.loadAnimation(animationName, vmd));
            return;
        }

        const animation = this._loader.loadAnimationFromVmd(vmd);
        this._animations.set(animationName, animation);
    }

    public removeAnimation(animationName: string): void {
        this._animations.delete(animationName);
    }

    private *loadAnimationInternal(
        animationName: string,
        url: string,
        onProgress?: (event: ProgressEvent<EventTarget>) => void,
        onComplete?: (animation: MmdCameraAnimationClip) => void
    ): CoroutineIterator {
        if (this._camera === null) throw new Error("Unreachable");

        let animation: MmdCameraAnimationClip|null = null;
        this._loader.loadAnimationFromUrl(url, object => animation = object, onProgress);
        yield new WaitUntil(() => animation !== null);
        this._animations.set(animationName, animation!);

        this._loadingAnimations.delete(animationName);

        onComplete?.(animation!);
    }

    public isAnimationLoading(animationName: string): boolean {
        return this._loadingAnimations.has(animationName);
    }

    public get camera(): Camera|null {
        return this._camera;
    }

    public get animations(): ReadonlyMap<string, MmdCameraAnimationClip> {
        return this._animations;
    }

    public get onProgress(): IEventContainer<(event: ProgressEvent<EventTarget>) => void> {
        return this._onProgressEvent;
    }
}
