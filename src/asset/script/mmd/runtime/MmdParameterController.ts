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
    private readonly _skinnedMesh: THREE.SkinnedMesh<THREE.BufferGeometry, THREE.Material[]>;

    public constructor(data: Pmd | Pmx, skinnedMesh: THREE.SkinnedMesh<THREE.BufferGeometry, THREE.Material[]>) {
        const materials = skinnedMesh.material;

        const materialMorphController = [];
        for (let i = 0; i < materials.length; ++i) {
            materialMorphController.push(new MmdMaterialMorphController(materials[i]));
        }

        this.materialMorphs = materialMorphController;
        this.morph = new MmdMorphController(data);
        this._skinnedMesh = skinnedMesh;
    }

    public asyncTransparentInitialize(onComplete?: () => void): void {
        const materials = this._skinnedMesh.material;

        // todo: override entire model loading process to remove this garbage
        const waitTime = 1500;

        let leftTextureCount = 0;
        for (let i = 0; i < materials.length; ++i) {
            const material = materials[i] as MMDToonMaterial;
            if (material.map) {
                const texture = material.map as LoadingTexture;
                if (texture.readyCallbacks) {
                    leftTextureCount += 1;

                    const timeOutId = setTimeout(() => {
                        console.warn(`Texture ${texture.name} is not loaded. It will be treated as opaque.`);
                        this.materialMorphs[i].texTransparent = material.transparent;
                        leftTextureCount -= 1;
                        if (leftTextureCount === 0) {
                            onComplete?.();
                        }
                    }, waitTime);

                    texture.readyCallbacks.push(() => {
                        this.materialMorphs[i].texTransparent = material.transparent;
                        leftTextureCount -= 1;
                        clearTimeout(timeOutId);
                        if (leftTextureCount === 0) {
                            onComplete?.();
                        }
                    });
                }
            }
        }
    }

    public rebindMeterials(): void {
        const materials = this._skinnedMesh.material;
        for (let i = 0; i < materials.length; ++i) {
            this.materialMorphs[i].rebind(materials[i]);
        }
    }

    public apply(): void {
        this.morph.apply(this.materialMorphs);
    }
}
