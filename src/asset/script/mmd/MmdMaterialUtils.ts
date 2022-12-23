import * as THREE from "three/src/Three";

import { MMDToonMaterial } from "./MmdMaterial";

export class MmdMaterialUtils {
    public static convert(mmdMaterial: MMDToonMaterial): THREE.MeshStandardMaterial {
        const material = new THREE.MeshStandardMaterial();
        material.copy(mmdMaterial);
        // material.color.copy(mmdMaterial.diffuse);
        material.opacity = mmdMaterial.opacity;
        material.emissive.set(0x000000);
        material.transparent = mmdMaterial.transparent;
        material.fog = mmdMaterial.fog;
        material.map = mmdMaterial.map;
        material.envMap = mmdMaterial.envMap;
        material.envMapIntensity = 0;
        material.normalMap?.dispose();
        material.normalMap = null;
        material.roughness = 1;
        material.metalness = 0;
        material.side = mmdMaterial.side;
        material.needsUpdate = true;

        mmdMaterial.dispose();
        mmdMaterial.gradientMap?.dispose();
        mmdMaterial.matcap?.dispose();

        return material;
    }


    public static forceDisposeObjectMembers(object: any): void {
        const values = Object.values(object);
        for (let i = 0; i < values.length; ++i) {
            const value = values[i];
            if ((value as { dispose?: () => void }).dispose) {
                (value as { dispose: () => void }).dispose();
            }

            if (value instanceof Array) {
                for (let j = 0; j < value.length; ++j) {
                    const arrayValue = value[j];
                    if ((arrayValue as { dispose?: () => void }).dispose) {
                        (arrayValue as { dispose: () => void }).dispose();
                    }
                }
            }
        }
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
