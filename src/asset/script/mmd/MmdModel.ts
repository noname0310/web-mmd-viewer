import { Vmd } from "@noname0310/mmd-parser";
import { Component, Coroutine, CoroutineIterator, EventContainer, IEventContainer, Object3DContainer, WaitUntil } from "the-world-engine";
import * as THREE from "three/src/Three";

import { MMDLoaderOverride } from "./loader/MMDLoaderOverride";
import { MmdModelAnimationClip, MmdModelAnimationLoader } from "./loader/MmdModelAnimationLoader";
import { MMDToonMaterial } from "./MmdMaterial";
import { MmdMaterialUtils } from "./MmdMaterialUtils";

export type SkinnedMeshContainer = Object3DContainer<THREE.SkinnedMesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]>>;

export class MmdModel extends Component {
    private readonly _loadingManager = new THREE.LoadingManager();
    private readonly _loader = new MMDLoaderOverride(this._loadingManager);
    private readonly _animationLoader = new MmdModelAnimationLoader();
    private _object3DContainer: SkinnedMeshContainer | null = null;
    private readonly _animations: Map<string, MmdModelAnimationClip> = new Map();
    private readonly _loadingAnimations = new Set<string>();
    private readonly _onProgressEvent = new EventContainer<(objectType: "model" | "animation", event: ProgressEvent<EventTarget>) => void>();
    private readonly _onDisposeObject3DEvent = new EventContainer<(object3D: THREE.SkinnedMesh) => void>();
    private readonly _defaultPoseMap = new Map<THREE.Object3D, { position: THREE.Vector3, quaternion: THREE.Quaternion, scale: THREE.Vector3 }>();

    private readonly _animationLoadingCoroutines: Coroutine[] = [];

    private _isReadyToLoad = false;
    private _initLoadModelFunc: ((onComplete: () => void) => void) | null = null;
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
            this._loadingAnimations.clear();
        }
    }

    public asyncLoadModel(
        url: string,
        onComplete?: (object: THREE.SkinnedMesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]>) => void
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

        this._loadingAnimations.clear();
        this._animations.clear();
        this.startCoroutine(
            this.loadModelInternal(
                url,
                (event) => this._onProgressEvent.invoke("model", event),
                onComplete
            )
        );
    }

    public asyncLoadAnimation(
        animationName: string,
        url: string | string[],
        onComplete?: (animation: MmdModelAnimationClip) => void
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
                (event) => this._onProgressEvent.invoke("animation", event),
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

        if (this._object3DContainer!.object3D === null) {
            throw new Error("Model is not loaded yet.");
        }

        const animation = this._animationLoader.loadAnimation(
            vmd,
            this._object3DContainer!.object3D,
            this._loader.forceAllInterpolateToCubic
        );
        this._animations.set(animationName, animation);
    }

    public removeAnimation(animationName: string): void {
        this._animations.delete(animationName);
    }

    private *loadModelInternal(
        url: string,
        onProgress?: (event: ProgressEvent<EventTarget>) => void,
        onComplete?: (object: THREE.SkinnedMesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]>) => void
    ): CoroutineIterator {
        let model: THREE.SkinnedMesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]> | null = null;
        this._loader.load(url, object => {
            model = object;
            if (!this.exists || !this.gameObject.activeInHierarchy) {
                model.geometry.dispose();
                if (model.material instanceof Array) {
                    const materials = model.material;
                    for (let i = 0; i < materials.length; ++i) {
                        MmdMaterialUtils.disposeTexture(materials[i] as MMDToonMaterial);
                        materials[i].dispose();
                    }
                } else {
                    MmdMaterialUtils.disposeTexture(model.material as MMDToonMaterial);
                    model.material.dispose();
                }
            }
        }, onProgress);
        yield new WaitUntil(() => model !== null);
        this._object3DContainer!.setObject3D(model!, object3D => {
            object3D.geometry.dispose();
            if (object3D.material instanceof Array) {
                for (let i = 0; i < object3D.material.length; ++i) {
                    MmdMaterialUtils.disposeTexture(object3D.material[i] as MMDToonMaterial);
                    object3D.material[i].dispose();
                }
            } else {
                MmdMaterialUtils.disposeTexture(object3D.material as MMDToonMaterial);
                object3D.material.dispose();
            }
            this._onDisposeObject3DEvent.invoke(object3D);
        });

        this._defaultPoseMap.clear();
        model!.traverse(object => {
            if ((object as THREE.Bone).isBone) {
                const bone = object as THREE.Bone;
                this._defaultPoseMap.set(bone, {
                    position: bone.position.clone(),
                    quaternion: bone.quaternion.clone(),
                    scale: bone.scale.clone()
                });
            }
        });

        onComplete?.(model!);
    }

    private *loadAnimationInternal(
        animationName: string,
        url: string | string[],
        onProgress?: (event: ProgressEvent<EventTarget>) => void,
        onComplete?: (animation: MmdModelAnimationClip) => void
    ): CoroutineIterator {
        if (this._object3DContainer!.object3D === null) {
            throw new Error("Model is not loaded yet.");
        }

        let animation: MmdModelAnimationClip | null = null;
        this._animationLoader.loadAnimationFromUrl(
            url,
            this._object3DContainer!.object3D,
            this._loader.forceAllInterpolateToCubic,
            object => animation = object,
            onProgress
        );
        yield new WaitUntil(() => animation !== null);
        this._animations.set(animationName, animation!);

        this._loadingAnimations.delete(animationName);

        onComplete?.(animation!);
    }

    public isAnimationLoading(animationName: string): boolean {
        return this._loadingAnimations.has(animationName);
    }

    public poseToDefault(): void {
        if (this._object3DContainer!.object3D === null) return;

        this._object3DContainer!.object3D.traverse(object => {
            if ((object as THREE.Bone).isBone) {
                const bone = object as THREE.Bone;
                const defaultPose = this._defaultPoseMap.get(bone);
                if (defaultPose === undefined) return;

                bone.position.copy(defaultPose.position);
                bone.quaternion.copy(defaultPose.quaternion);
                bone.scale.copy(defaultPose.scale);
            }
        });

        this._object3DContainer!.object3D.updateMatrixWorld(true);
    }

    public setUrlModifier(urlModifier: (url: string) => string): void {
        this._loadingManager.setURLModifier(urlModifier);
    }

    public get skinnedMesh(): THREE.SkinnedMesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]> | null {
        return this._object3DContainer?.object3D ?? null;
    }

    public get object3DContainer(): SkinnedMeshContainer | null {
        return this._object3DContainer;
    }

    public get animations(): ReadonlyMap<string, MmdModelAnimationClip> {
        return this._animations;
    }

    public get onProgress(): IEventContainer<(objectType: "model" | "animation", event: ProgressEvent<EventTarget>) => void> {
        return this._onProgressEvent;
    }

    public get onDisposeObject3D(): IEventContainer<(object3D: THREE.SkinnedMesh) => void> {
        return this._onDisposeObject3DEvent;
    }

    public get forceAllInterpolateToCubic(): boolean {
        return this._loader.forceAllInterpolateToCubic;
    }

    public set forceAllInterpolateToCubic(value: boolean) {
        if (this._isReadyToLoad) {
            throw new Error("Cannot set forceAllInterpolateToCubic after awake.");
        }
        this._loader.forceAllInterpolateToCubic = value;
    }
}
