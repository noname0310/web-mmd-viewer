import * as THREE from "three/src/Three";

export type MMDToonMaterial = THREE.Material & {
    isMMDToonMaterial: boolean;
    map: THREE.Texture | null;
    envMap: THREE.Texture | null;
    gradientMap: THREE.Texture | null;
    matcap: THREE.Texture | null;
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
        material.map?.dispose();
        material.envMap?.dispose();
    }
}
