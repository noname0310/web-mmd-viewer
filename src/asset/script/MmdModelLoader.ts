import { Component, Coroutine, CoroutineIterator, EventContainer, IEventContainer, Object3DContainer, WaitUntil } from "the-world-engine";
import { MMDLoader } from "three/examples/jsm/loaders/MMDLoader";
import * as THREE from "three/src/Three";

type SkinnedMeshContainer = Object3DContainer<THREE.SkinnedMesh<THREE.BufferGeometry, THREE.Material|THREE.Material[]>>;

export class MmdModelLoader extends Component {
    private readonly _loader = new MMDLoader();
    private _object3DContainer: SkinnedMeshContainer|null = null;
    private _animations: THREE.AnimationClip[] = [];
    private _loadingAnimations = 0;
    private readonly _onProgressEvent = new EventContainer<(objectType: "model"|"animation", event: ProgressEvent<EventTarget>) => void>();

    private _animationLoadingCoroutines: Coroutine[] = [];

    private _isReadyToLoad = false;
    private _initLoadModelFunc: ((onComplete: () => void) => void)|null = null;
    private readonly _initLoadAnimationFunc: (() => void)[] = [];

    public awake(): void {
        this._isReadyToLoad = true;
        this._object3DContainer = this.gameObject.addComponent<SkinnedMeshContainer>(Object3DContainer);

        this._initLoadModelFunc?.(() => {
            const initLoadAnimationFunc = this._initLoadAnimationFunc;
            for (let i = 0; i < initLoadAnimationFunc.length; ++i) {
                initLoadAnimationFunc[i]();
            }
        });
    }

    public onDisable(): void {
        if (this.enabled) {
            this._animationLoadingCoroutines.length = 0;
            this._loadingAnimations = 0;
        }
    }

    public asyncLoadModel(
        url: string,
        onComplete?: (object: THREE.SkinnedMesh<THREE.BufferGeometry, THREE.Material|THREE.Material[]>) => void
    ): void {
        if (!this._isReadyToLoad) {
            this._initLoadModelFunc = (initOnComplete: () => void): void => this.asyncLoadModel(url, (): void => {
                initOnComplete();
                onComplete?.(this.skinnedMesh!);
            });
            return;
        }

        const animationLoadingCoroutines = this._animationLoadingCoroutines;
        for (let i = 0; i < animationLoadingCoroutines.length; ++i) {
            this.stopCoroutine(animationLoadingCoroutines[i]);
        }
        this._animationLoadingCoroutines.length = 0;
        
        this._loadingAnimations = 0;
        this._animations.length = 0;
        this.startCoroutine(
            this.loadModelInternal(
                url,
                (event) => this._onProgressEvent.invoke("model", event),
                onComplete
            )
        );
    }

    public asyncLoadAnimation(
        url: string|string[],
        onComplete?: (animation: THREE.AnimationClip) => void
    ): void {
        if (!this._isReadyToLoad) {
            this._initLoadAnimationFunc.push(() => this.asyncLoadAnimation(url, onComplete));
            return;
        }

        const coroutine = this.startCoroutine(
            this.loadAnimationInternal(
                url,
                (event) => this._onProgressEvent.invoke("animation", event),
                onComplete
            )
        );
        this._animationLoadingCoroutines.push(coroutine);
    }

    private *loadModelInternal(
        url: string,
        onProgress?: (event: ProgressEvent<EventTarget>) => void,
        onComplete?: (object: THREE.SkinnedMesh<THREE.BufferGeometry, THREE.Material|THREE.Material[]>) => void
    ): CoroutineIterator {
        let model: THREE.SkinnedMesh<THREE.BufferGeometry, THREE.Material|THREE.Material[]>|null = null;
        this._loader.load(url, object => model = object, onProgress);
        yield new WaitUntil(() => model !== null);
        this._object3DContainer!.object3D = model;
        onComplete?.(model!);
    }

    private *loadAnimationInternal(
        url: string|string[],
        onProgress?: (event: ProgressEvent<EventTarget>) => void,
        onComplete?: (animation: THREE.AnimationClip) => void
    ): CoroutineIterator {
        if (this._object3DContainer!.object3D === null) {
            throw new Error("Model is not loaded yet.");
        }

        this._loadingAnimations += 1;

        let animation: THREE.AnimationClip|null = null;
        this._loader.loadAnimation(url as any, this._object3DContainer!.object3D, object => animation = object as THREE.AnimationClip, onProgress);
        yield new WaitUntil(() => animation !== null);
        this._animations.push(animation!);

        this._loadingAnimations -= 1;

        onComplete?.(animation!);
    }

    public get skinnedMesh(): THREE.SkinnedMesh<THREE.BufferGeometry, THREE.Material|THREE.Material[]>|null {
        return this._object3DContainer?.object3D ?? null;
    }

    public get object3DContainer(): SkinnedMeshContainer|null {
        return this._object3DContainer;
    }

    public get isAnimationLoading(): boolean {
        return 0 < this._loadingAnimations;
    }

    public get animations(): readonly THREE.AnimationClip[] {
        return this._animations;
    }

    public get onProgress(): IEventContainer<(objectType: "model"|"animation", event: ProgressEvent<EventTarget>) => void> {
        return this._onProgressEvent;
    }
}
