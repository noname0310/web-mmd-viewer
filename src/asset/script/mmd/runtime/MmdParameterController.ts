import { Pmd, Pmx } from "@noname0310/mmd-parser";

import { MMDToonMaterial } from "../MmdMaterial";
import { MmdMaterialMorphController } from "../morph/MmdMaterialMorphController";
import { MmdMorphController } from "../morph/MmdMorphController";

type LoadingTexture = THREE.Texture & {
    readyCallbacks?: ((texture: THREE.Texture) => void)[];
};

export class MmdParameterController {
    public readonly materialMorphs: readonly MmdMaterialMorphController[];
    public readonly morph: MmdMorphController;
    private readonly _skinnedMesh: THREE.SkinnedMesh;

    public constructor(data: Pmd | Pmx, skinnedMesh: THREE.SkinnedMesh) {
        const materials = skinnedMesh.material as THREE.Material[];

        const materialMorphController = [];
        for (let i = 0; i < materials.length; ++i) {
            const materialData = data.materials[i];
            materialMorphController.push(new MmdMaterialMorphController(materials[i], materialData.diffuse[3]));
        }

        this.materialMorphs = materialMorphController;
        this.morph = new MmdMorphController(data);
        this._skinnedMesh = skinnedMesh;
    }

    public asyncTransparentInitialize(onComplete?: () => void): void {
        const materials = this._skinnedMesh.material as THREE.Material[];

        let leftTextureCount = 0;
        for (let i = 0; i < materials.length; ++i) {
            const material = materials[i] as MMDToonMaterial;
            if (material.map) {
                const texture = material.map as LoadingTexture;
                if (texture.readyCallbacks) {
                    leftTextureCount += 1;
                    texture.readyCallbacks.push(() => {
                        this.materialMorphs[i].texTransparent = material.transparent;
                        leftTextureCount -= 1;
                        if (leftTextureCount === 0) {
                            onComplete?.();
                        }
                    });
                }
            }
        }
    }

    public rebindMeterials(): void {
        const materials = this._skinnedMesh.material as THREE.Material[];
        for (let i = 0; i < materials.length; ++i) {
            this.materialMorphs[i].rebind(materials[i]);
        }
    }

    public apply(): void {
        this.morph.apply(this.materialMorphs);
    }
}
