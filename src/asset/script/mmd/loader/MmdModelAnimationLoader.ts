import { MMDParser, Vmd } from "@noname0310/mmd-parser";
import * as THREE from "three/src/Three";
import { AnimationClipBindInfo, AnimationClipBindResult, AnimationSequence, RangedAnimation } from "tw-engine-498tokio";
import { AnimationClipBindItem } from "tw-engine-498tokio/dist/asset/script/animation/bind/AnimationClipBindInfo";

import { MmdModel } from "../MmdModel";
import { MmdPlayer } from "../MmdPlayer";
import { AnimationBuilder, MmdAnimationSequence, MmdAnimationSequenceInstance, MMDLoaderOverride } from "./MMDLoaderOverride";

export class MmdModelAnimationClip {
    public readonly modelAnimationClip: THREE.AnimationClip;
    public readonly mmdAnimationSequence: MmdAnimationSequence;

    public constructor(
        modelAnimationClip: THREE.AnimationClip,
        mmdAnimationSequence: MmdAnimationSequence
    ) {
        this.modelAnimationClip = modelAnimationClip;
        this.mmdAnimationSequence = mmdAnimationSequence;
    }
}

export class MmdModelAnimationClipInstance {
    public readonly modelAnimationClip: THREE.AnimationClip;
    public readonly mmdAnimationSequenceInstance: MmdAnimationSequenceInstance;

    public constructor(
        modelAnimationClip: THREE.AnimationClip,
        mmddAnimationSequenceInstance: MmdAnimationSequenceInstance
    ) {
        this.modelAnimationClip = modelAnimationClip;
        this.mmdAnimationSequenceInstance = mmddAnimationSequenceInstance;
    }
}

export class MmdModelAnimationLoader {
    private readonly _mmdLoader: MMDLoaderOverride;
    private readonly _animationBuilder: AnimationBuilder;
    private readonly _fileLoader: THREE.FileLoader;

    public constructor() {
        this._mmdLoader = new MMDLoaderOverride();
        this._animationBuilder = new AnimationBuilder(this._mmdLoader);
        this._fileLoader = new THREE.FileLoader();
    }

    public loadVmdFromUrl(
        url: string | string[],
        onLoad?: (vmd: Vmd) => void,
        onProgress?: (event: ProgressEvent<EventTarget>) => void,
        onError?: (event: ErrorEvent) => void
    ): void {
        const urls = Array.isArray(url) ? url : [url];
        this._fileLoader.setResponseType("arraybuffer");

        const vmds: Vmd[] = [];
        const vmdNum = urls.length;

        for (let i = 0, il = urls.length; i < il; i++) {
            this._fileLoader.load(urls[i], buffer => {
                vmds.push(MMDParser.parseVmd(buffer as ArrayBuffer, true));
                if (vmds.length === vmdNum) onLoad?.(MMDParser.mergeVmds(vmds));
            }, onProgress, onError);
        }
    }

    public loadAnimationFromUrl(
        url: string | string[],
        mesh: THREE.SkinnedMesh,
        forceAllInterpolateToCubic: boolean,
        onLoad: (animation: MmdModelAnimationClip) => void,
        onProgress?: (event: ProgressEvent<EventTarget>) => void,
        onError?: (event: ErrorEvent) => void
    ): void {
        this.loadVmdFromUrl(url, vmd => {
            const animation = this.loadAnimation(vmd, mesh, forceAllInterpolateToCubic);
            onLoad(animation);
        }, onProgress, onError);
    }

    public loadAnimation(
        vmd: Vmd,
        mesh: THREE.SkinnedMesh,
        forceAllInterpolateToCubic: boolean
    ): MmdModelAnimationClip {
        this._mmdLoader.forceAllInterpolateToCubic = forceAllInterpolateToCubic;

        const modelAnimationClip = this._animationBuilder.build(vmd, mesh);
        const propertyAnimationClip = this._animationBuilder.buildPropertyAnimation(vmd);
        const morphAnimationClip = this._animationBuilder.buildMorphAnimation(vmd);
        const animationSequence = new AnimationSequence([
            new RangedAnimation(propertyAnimationClip),
            new RangedAnimation(morphAnimationClip)
        ], 30);

        return new MmdModelAnimationClip(modelAnimationClip, animationSequence);
    }

    public static createInstance(model: MmdModel, player: MmdPlayer, animation: MmdModelAnimationClip): MmdModelAnimationClipInstance {
        const mesh = model.skinnedMesh;
        if (mesh === null) throw new Error("Mesh is not loaded.");
        const parameterController = model.parameterController;
        if (parameterController === null) throw new Error("Material is not loaded.");

        const propertyAnimationBindInfo: AnimationClipBindItem<string, (value: boolean) => void>[] = [
            {
                trackName: "visible",
                target: (value: boolean) => mesh.visible = value
            }
        ];

        const animationContainers = animation.mmdAnimationSequence.animationContainers;

        const propertyAnimation = animationContainers[0].animation;
        const propertyAnimationTrackMap = propertyAnimation.trackMap;
        for (const [key ] of propertyAnimationTrackMap) {
            if (key === "visible") continue;

            if (player.isIkExists(key)) {
                propertyAnimationBindInfo.push({
                    trackName: key,
                    target: (value: boolean) => player.setIkEnabled(key, value)
                });
            } else {
                console.warn(`IK ${key} is not found.`);
            }
        }

        const morphAnimationBindInfo: AnimationClipBindItem<string, (value: number) => void>[] = [];

        const morphAnimation = animationContainers[1].animation;
        const morphAnimationTrackMap = morphAnimation.trackMap;
        const morphController = parameterController.morph;
        const morphNameMap = morphController.mmdMorphNameMap;
        for (const [key ] of morphAnimationTrackMap) {
            if (morphNameMap.has(key)) {
                const morphTargetIndex = mesh.morphTargetDictionary![key];

                morphAnimationBindInfo.push({
                    trackName: key,
                    target: (value: number) => {
                        morphController.setWeight(key, value);
                        mesh.morphTargetInfluences![morphTargetIndex] = value;
                    }
                });
            } else {
                console.warn(`Morph ${key} is not found.`);
            }
        }

        const [animationSequenceInstance, bindResult] = animation.mmdAnimationSequence.tryCreateInstance([
            new AnimationClipBindInfo(propertyAnimationBindInfo),
            new AnimationClipBindInfo(morphAnimationBindInfo)
        ]);

        if (!bindResult.isBindSuccess) {
            console.warn("Failed to bind animation clip.");

            const bindResults = bindResult.bindResults;

            for (let i = 0, il = bindResults.length; i < il; i++) {
                const bindResult = bindResults[i] as AnimationClipBindResult;

                const bindFailTrackNames = bindResult.bindFailTrackNames;
                for (let i = 0, il = bindFailTrackNames.length; i < il; i++) {
                    console.warn(`Failed to bind track: ${bindFailTrackNames[i]}`);
                }
            }
        }

        return new MmdModelAnimationClipInstance(
            animation.modelAnimationClip,
            animationSequenceInstance
        );
    }
}
