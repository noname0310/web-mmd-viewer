import { Pmd, Pmx } from "@noname0310/mmd-parser";
import * as THREE from "three/src/Three";

import { GeometryBuilder, MMDLoaderOverride } from "./MMDLoaderOverride";

export interface MeshBuilder {
    crossOrigin: string;
    geometryBuilder: GeometryBuilder;
    meterialBuilder: object;

    setCrossOrigin(crossOrigin: string): this;
    build(
        data: Pmd | Pmx,
        resourcePath: string,
        onProgress?: (event: ProgressEvent) => void,
        onError?: (event: ErrorEvent) => void
    ): THREE.SkinnedMesh;
}

export class MmdModelLoader {
    private readonly _mmdLoader: MMDLoaderOverride;
    private readonly _meshBuilder: MeshBuilder;

    public constructor(manager?: THREE.LoadingManager) {
        this._mmdLoader = new MMDLoaderOverride(manager);
        this._meshBuilder = this._mmdLoader.meshBuilder as MeshBuilder;
    }

    public loadDataFromUrl(
        url: string,
        onLoad: (data: Pmd | Pmx) => void,
        onProgress?: (event: ProgressEvent<EventTarget>) => void,
        onError?: (event: ErrorEvent | Error) => void
    ): void {
        const loader = this._mmdLoader;

        const modelExtension = (loader as any)._extractExtension(url).toLowerCase() as string;

        // Should I detect by seeing header?
        if (modelExtension !== "pmd" && modelExtension !== "pmx") {
            if (onError) onError(new Error("THREE.MMDLoader: Unknown model file extension ." + modelExtension + "."));
            return;
        }

        if (modelExtension === "pmd") {
            loader.loadPMD(url, (data) => {
                onLoad(data as Pmd);
            }, onProgress, onError);
        } else {
            loader.loadPMX(url, (data) => {
                onLoad(data as Pmx);
            }, onProgress, onError);
        }
    }

    public loadModelFromData(
        data: Pmd | Pmx,
        url?: string,
        onProgress?: (event: ProgressEvent<EventTarget>) => void,
        onError?: (event: ErrorEvent | Error) => void
    ): THREE.SkinnedMesh {
        const loader = this._mmdLoader;
        const builder = this._meshBuilder.setCrossOrigin(loader.crossOrigin);

        // resource path
        let resourcePath: string;
        if (loader.resourcePath !== "") {
            resourcePath = loader.resourcePath;
        } else if (loader.path !== "") {
            resourcePath = loader.path;
        } else if (url !== undefined) {
            resourcePath = THREE.LoaderUtils.extractUrlBase(url);
        } else {
            console.warn("THREE.MMDLoader: Using relative URLs as resourcePath.");
            resourcePath = "";
        }

        return builder.build(data, resourcePath, onProgress, onError);
    }

    public loadModelFromUrl(
        url: string,
        onLoad: (mesh: THREE.SkinnedMesh) => void,
        onProgress?: (event: ProgressEvent<EventTarget>) => void,
        onError?: (event: ErrorEvent | Error) => void
    ): void {
        this.loadDataFromUrl(url, (data) => {
            onLoad(this.loadModelFromData(data, url, onProgress, onError));
        }, onProgress, onError);
    }

    public get forceAllInterpolateToCubic(): boolean {
        return this._mmdLoader.forceAllInterpolateToCubic;
    }

    public set forceAllInterpolateToCubic(value: boolean) {
        this._mmdLoader.forceAllInterpolateToCubic = value;
    }
}
