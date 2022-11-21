import { MMDParser, Vmd } from "@noname0310/mmd-parser";
import * as THREE from "three/src/Three";
import { AnimationClipBindInfo } from "tw-engine-498tokio";
import { AnimationClipBindItem } from "tw-engine-498tokio/dist/asset/script/animation/bind/AnimationClipBindInfo";

import { MmdPlayer } from "../MmdPlayer";
import { AnimationBuilder, MMDLoaderOverride, MmdPropertyAnimationClip, MmdPropertyAnimationClipInstance } from "./MMDLoaderOverride";

export class MmdModelAnimationClip {
    public readonly modelAnimationClip: THREE.AnimationClip;
    public readonly propertyAnimationClip: MmdPropertyAnimationClip;

    public constructor(
        modelAnimationClip: THREE.AnimationClip,
        propertyAnimationClip: MmdPropertyAnimationClip
    ) {
        this.modelAnimationClip = modelAnimationClip;
        this.propertyAnimationClip = propertyAnimationClip;
    }
}

export class MmdModelAnimationClipInstance {
    public readonly modelAnimationClip: THREE.AnimationClip;
    public readonly propertyAnimationClipInstance: MmdPropertyAnimationClipInstance;

    public constructor(
        modelAnimationClip: THREE.AnimationClip,
        propertyAnimationClipInstance: MmdPropertyAnimationClipInstance
    ) {
        this.modelAnimationClip = modelAnimationClip;
        this.propertyAnimationClipInstance = propertyAnimationClipInstance;
    }
}

export class MmdModelAnimationLoader {
    private readonly _mmdLoader: MMDLoaderOverride;
    private readonly _animationBuilder: AnimationBuilder;
    private readonly _fileLoader = new THREE.FileLoader();

    public constructor() {
        this._mmdLoader = new MMDLoaderOverride();
        this._animationBuilder = new AnimationBuilder(this._mmdLoader);
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

        return new MmdModelAnimationClip(modelAnimationClip, propertyAnimationClip);
    }

    public static createInstance(mesh: THREE.SkinnedMesh, player: MmdPlayer, animation: MmdModelAnimationClip): MmdModelAnimationClipInstance {
        const bindInfo: AnimationClipBindItem<string, (value: boolean) => void>[] = [
            {
                trackName: "visible",
                target: (value: boolean) => mesh.visible = value
            }
        ];

        const trackMap = animation.propertyAnimationClip.trackMap;
        for (const [key ] of trackMap) {
            if (key === "visible") continue;

            if (player.isIkExists(key)) {
                bindInfo.push({
                    trackName: key,
                    target: (value: boolean) => player.setIkEnabled(key, value)
                });
            } else {
                console.warn(`IK ${key} is not found.`);
            }
        }

        const [propertyAnimationClipInstance, bindResult] = animation.propertyAnimationClip.tryCreateInstance(new AnimationClipBindInfo(bindInfo));

        if (!bindResult.isBindSuccess) {
            console.warn("Failed to bind animation clip.");

            const bindFailTrackNames = bindResult.bindFailTrackNames;
            for (let i = 0, il = bindFailTrackNames.length; i < il; i++) {
                console.warn(`Failed to bind track: ${bindFailTrackNames[i]}`);
            }
        }

        return new MmdModelAnimationClipInstance(
            animation.modelAnimationClip,
            propertyAnimationClipInstance
        );
    }
}
