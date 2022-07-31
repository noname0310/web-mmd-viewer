import { Camera, Component, Coroutine, CoroutineIterator, DuckThreeCamera, EventContainer, IEventContainer, WaitUntil } from "the-world-engine";
import { MMDLoader } from "three/examples/jsm/loaders/MMDLoader";

export class MmdCameraLoader extends Component {
    public override readonly requiredComponents = [Camera];

    private readonly _loader = new MMDLoader();

    private _camera: THREE.Camera|null = null;
    private readonly _animations: THREE.AnimationClip[] = [];
    private _loadingAnimations = 0;
    private readonly _onProgressEvent = new EventContainer<(event: ProgressEvent<EventTarget>) => void>();

    private readonly _animationLoadingCoroutines: Coroutine[] = [];

    private _isReadyToLoad = false;
    private readonly _initLoadAnimationFunc: (() => void)[] = [];

    public awake(): void {
        this._isReadyToLoad = true;
    }

    public start(): void {
        const camera = this.gameObject.getComponent(Camera)!;

        this._camera = DuckThreeCamera.createInterface(camera, false).toThreeCamera();
        
        const initLoadAnimationFunc = this._initLoadAnimationFunc;
        for (let i = 0; i < initLoadAnimationFunc.length; ++i) {
            initLoadAnimationFunc[i]();
        }
    }

    public onDisable(): void {
        if (this.enabled) {
            this._animationLoadingCoroutines.length = 0;
            this._loadingAnimations = 0;
        }
    }

    public asyncLoadAnimation(
        url: string,
        onComplete?: (animation: THREE.AnimationClip) => void
    ): void {
        if (!this._isReadyToLoad) {
            this._initLoadAnimationFunc.push(() => this.asyncLoadAnimation(url, onComplete));
            return;
        }

        const coroutine = this.startCoroutine(
            this.loadAnimationInternal(
                url,
                (event) => this._onProgressEvent.invoke(event),
                onComplete
            )
        );
        this._animationLoadingCoroutines.push(coroutine);
    }

    private *loadAnimationInternal(
        url: string|string[],
        onProgress?: (event: ProgressEvent<EventTarget>) => void,
        onComplete?: (animation: THREE.AnimationClip) => void
    ): CoroutineIterator {
        if (this._camera === null) throw new Error("Unreachable");

        this._loadingAnimations += 1;

        let animation: THREE.AnimationClip|null = null;
        this._loader.loadAnimation(url as any, this._camera, object => animation = object as THREE.AnimationClip, onProgress);
        yield new WaitUntil(() => animation !== null);
        this._animations.push(animation!);

        this._loadingAnimations -= 1;

        onComplete?.(animation!);
    }

    public get threeCamera(): THREE.Camera|null {
        return this._camera;
    }
    
    public get isAnimationLoading(): boolean {
        return 0 < this._loadingAnimations;
    }

    public get animations(): readonly THREE.AnimationClip[] {
        return this._animations;
    }

    public get onProgress(): IEventContainer<(event: ProgressEvent<EventTarget>) => void> {
        return this._onProgressEvent;
    }
}
