import { Pmd, Pmx } from "@noname0310/mmd-parser";
import { MmdMaterialMorphController } from "../morph/MmdMaterialMorphController";
import { MmdMorphController } from "../morph/MmdMorphController";

export class MmdParameterController {
    public readonly materialMorphs: readonly MmdMaterialMorphController[];
    public readonly morph: MmdMorphController;
    private readonly _skinnedMesh: THREE.SkinnedMesh;
    
    public constructor(data: Pmd | Pmx, skinnedMesh: THREE.SkinnedMesh) {
        const materials = skinnedMesh.material as THREE.Material[];

        const materialMorphController = [];
        for (let i = 0; i < materials.length; ++i) {
            materialMorphController.push(new MmdMaterialMorphController(materials[i]));
        }

        this.materialMorphs = materialMorphController;
        this.morph = new MmdMorphController(data);
        this._skinnedMesh = skinnedMesh;
    }

    public rebindMeterials(): void {
        const materials = this._skinnedMesh.material as THREE.Material[];
        for (let i = 0; i < materials.length; ++i) {
            this.materialMorphs[i].rebind(materials[i]);
        }
    }
}
