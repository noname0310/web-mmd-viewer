import * as THREE from "three/src/Three";

export type MMDToonMaterial = THREE.Material & {
    isMMDToonMaterial: boolean;
    diffuse: THREE.Color;
    opacity: number;
    specular: THREE.Color;
    shininess: number;
    emissive: THREE.Color;
    transparent: boolean; // depends on opacity < 1.0
    fog: boolean;
    blending: THREE.Blending;
    blendSrc: THREE.BlendingDstFactor;
    blendDst: THREE.BlendingDstFactor;
    blendSrcAlpha: THREE.BlendingDstFactor;
    blendDstAlpha: THREE.BlendingDstFactor;
    side: THREE.Side; // depends on opacity < 1.0
    map: THREE.Texture | null;
    envMap: THREE.Texture | null;
    combine: THREE.Combine;
    gradientMap: THREE.Texture | null;
    matcap: THREE.Texture | null;
    matcapCombine: THREE.Combine;

    userData: {
        outlineParameters: {
            thickness: number; // depends on visible
            color: [number, number, number];
            alpha: number;
            visible: boolean;
        };
        // eslint-disable-next-line @typescript-eslint/naming-convention
        MMD: {
            mapFileName?: string;
        };
    };
};

export interface MmdMaterialLike {
    diffuse?: THREE.Color;
    opacity: number;
    transparent: boolean;
    specular?: THREE.Color;
    shininess?: number;
    emissive?: THREE.Color;
    userData?: {
        outlineParameters?: {
            thickness: number;
            color: [number, number, number];
            alpha: number;
            visible: boolean;
        };
    };
    side: THREE.Side;
}
