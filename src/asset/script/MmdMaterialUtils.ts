import * as THREE from "three/src/Three";

export type MMDToonMaterial = THREE.Material & {
    isMMDToonMaterial: boolean;
    map: THREE.Texture | null;
    envMap: THREE.Texture | null;
    gradientMap: THREE.Texture | null;
    matcap: THREE.Texture | null;
    emissive?: THREE.ColorRepresentation;
};

export class MmdMaterialUtils {
    public static convert(mmdMaterial: MMDToonMaterial): THREE.MeshStandardMaterial {
        const material = new THREE.MeshStandardMaterial();
        material.copy(mmdMaterial);
        material.map = mmdMaterial.map;
        material.envMap = mmdMaterial.envMap;
        material.envMapIntensity = 0;
        material.normalMap?.dispose();
        material.normalMap = null;
        material.roughness = 1;
        material.metalness = 0;
        material.emissive = new THREE.Color(0x000000);
        material.needsUpdate = true;

        mmdMaterial.dispose();
        mmdMaterial.gradientMap?.dispose();
        mmdMaterial.matcap?.dispose();

        return material;
    }

    public static disposeTexture(material: MMDToonMaterial): void {
        if (!material.isMMDToonMaterial) return;
        material.map?.dispose();
        material.envMap?.dispose();
        material.gradientMap?.dispose();
        material.matcap?.dispose();
    }

    public static disposeConvertedMaterialTexture(material: THREE.MeshStandardMaterial): void {
        if (!material.isMeshStandardMaterial) return;
        material.map?.dispose();
        material.envMap?.dispose();
        material.normalMap?.dispose();
        material.roughnessMap?.dispose();
        material.metalnessMap?.dispose();
        material.alphaMap?.dispose();
        material.aoMap?.dispose();
        material.emissiveMap?.dispose();
        material.bumpMap?.dispose();
        material.displacementMap?.dispose();
        material.lightMap?.dispose();
    }
}
