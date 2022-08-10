import { Camera, Component, Coroutine, CoroutineIterator, DuckThreeCamera, EventContainer, IEventContainer, WaitUntil } from "the-world-engine";

import { MmdCameraAnimationBuilder } from "./MmdCameraAnimationBuilder";

export class MmdCameraLoader extends Component {
    public override readonly requiredComponents = [Camera];

    private readonly _loader = new MmdCameraAnimationBuilder();

    private _camera: THREE.Camera|null = null;
    private readonly _animations: Map<string, THREE.AnimationClip> = new Map();
    private readonly _loadingAnimations = new Set<string>();
    private readonly _onProgressEvent = new EventContainer<(event: ProgressEvent<EventTarget>) => void>();

    private readonly _animationLoadingCoroutines: Coroutine[] = [];

    private _isReadyToLoad = false;
    private readonly _initLoadAnimationFunc: (() => void)[] = [];

    public awake(): void {
        this._isReadyToLoad = true;
    }

    public start(): void {
        const camera = this.gameObject.getComponent(Camera)!;

        this._camera = DuckThreeCamera.createInterface(camera);
        
        const initLoadAnimationFunc = this._initLoadAnimationFunc;
        for (let i = 0; i < initLoadAnimationFunc.length; ++i) {
            initLoadAnimationFunc[i]();
        }
    }

    public onDisable(): void {
        if (this.enabled) {
            this._animationLoadingCoroutines.length = 0;
            this._loadingAnimations.clear();
        }
    }

    public asyncLoadAnimation(
        animationName: string,
        url: string,
        onComplete?: (animation: THREE.AnimationClip) => void
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

    private *loadAnimationInternal(
        animationName: string,
        url: string|string[],
        onProgress?: (event: ProgressEvent<EventTarget>) => void,
        onComplete?: (animation: THREE.AnimationClip) => void
    ): CoroutineIterator {
        if (this._camera === null) throw new Error("Unreachable");

        let animation: THREE.AnimationClip|null = null;
        this._loader.loadAnimationFromUrl(url as any, object => animation = object as THREE.AnimationClip, onProgress);
        yield new WaitUntil(() => animation !== null);
        this._animations.set(animationName, animation!);

        this._loadingAnimations.delete(animationName);

        onComplete?.(animation!);
    }

    public isAnimationLoading(animationName: string): boolean {
        return this._loadingAnimations.has(animationName);
    }

    public get threeCamera(): THREE.Camera|null {
        return this._camera;
    }

    public get animations(): ReadonlyMap<string, THREE.AnimationClip> {
        return this._animations;
    }

    public get onProgress(): IEventContainer<(event: ProgressEvent<EventTarget>) => void> {
        return this._onProgressEvent;
    }
}
