import { Pmd, Pmx } from "@noname0310/mmd-parser";

import { MmdMaterialMorphController } from "./MmdMaterialMorphController";
import { MmdMorph, MorphType } from "./MmdMorph";

export class MmdMorphController {
    public readonly mmdMorphNameMap: ReadonlyMap<string, number>;

    private readonly _mmdMorphs: MmdMorph[];
    private readonly _mmdMaterialMorphs: MmdMorph<MorphType.Material>[];

    private readonly _boneMmdMorphDependencyMap: Map<number, MmdMorph<MorphType.Bone>[]>;
    private readonly _materialMmdMorphDependencyMap: Map<number, MmdMorph<MorphType.Material>[]>;

    private readonly _computeSet: Set<MmdMorph<MorphType.Bone | MorphType.Material>>;

    public constructor(data: Pmd | Pmx) {
        const mmdMorphNameMap = new Map<string, number>();
        const mmdMorphs: MmdMorph[] = [];
        const mmdMaterialMorphs: MmdMorph<MorphType.Material>[] = [];
        const groupMmdMorphs: MmdMorph<MorphType.Group>[] = [];

        const boneMmdMorphDependencyMap = new Map<number, MmdMorph<MorphType.Bone>[]>();
        const materialMmdMorphDependencyMap = new Map<number, MmdMorph<MorphType.Material>[]>();

        const computeList = new Set<MmdMorph<MorphType.Bone | MorphType.Material>>;

        if (data.metadata.format === "pmd") {
            const morphsData = (data as Pmd).morphs;

            for (let i = 0; i < morphsData.length; ++i) {
                const morphData = morphsData[i];
                const morphName = morphData.name;
                const mmdMorph = new MmdMorph(morphName, MorphType.Vertex, morphData.elements);
                mmdMorphs.push(mmdMorph);

                if (!mmdMorphNameMap.has(morphName)) mmdMorphNameMap.set(morphName, i);
            }
        } else {
            const morphsData = (data as Pmx).morphs;

            for (let i = 0; i < morphsData.length; ++i) {
                const morphData = morphsData[i];
                const morphName = morphData.name;
                const mmdMorph = new MmdMorph(morphName, morphData.type as MorphType, morphData.elements);
                mmdMorphs.push(mmdMorph);

                if (!mmdMorphNameMap.has(morphName)) mmdMorphNameMap.set(morphName, i);

                if (morphData.type === MorphType.Group) {
                    groupMmdMorphs.push(mmdMorph as MmdMorph<MorphType.Group>);
                } else if (morphData.type === MorphType.Bone) {
                    for (let j = 0; j < morphData.elements.length; ++j) {
                        const boneIndex = morphData.elements[j].index;
                        let boneMorphs = boneMmdMorphDependencyMap.get(boneIndex);
                        if (boneMorphs === undefined) {
                            boneMorphs = [];
                            boneMmdMorphDependencyMap.set(boneIndex, boneMorphs);
                        }
                        boneMorphs.push(mmdMorph as MmdMorph<MorphType.Bone>);
                    }

                    computeList.add(mmdMorph as MmdMorph<MorphType.Bone>);
                } else if (morphData.type === MorphType.Material) {
                    for (let j = 0; j < morphData.elements.length; ++j) {
                        const materialIndex = morphData.elements[j].index;
                        let materialMorphs = materialMmdMorphDependencyMap.get(materialIndex);
                        if (materialMorphs === undefined) {
                            materialMorphs = [];
                            materialMmdMorphDependencyMap.set(materialIndex, materialMorphs);
                        }
                        materialMorphs.push(mmdMorph as MmdMorph<MorphType.Material>);
                    }

                    computeList.add(mmdMorph as MmdMorph<MorphType.Material>);
                    mmdMaterialMorphs.push(mmdMorph as MmdMorph<MorphType.Material>);
                }
            }
        }

        for (let i = 0; i < groupMmdMorphs.length; ++i) {
            const groupMmdMorph = groupMmdMorphs[i];
            const groupMorphs = groupMmdMorph.elements;
            for (let j = 0; j < groupMorphs.length; ++j) {
                const groupMorph = groupMorphs[j];
                const memberMmdMorph = mmdMorphs[groupMorph.index];
                memberMmdMorph.connectedGroupMmdMorphs.push({
                    mmdMorph: groupMmdMorph,
                    morph: groupMorph
                });
            }
        }

        this.mmdMorphNameMap = mmdMorphNameMap;
        this._mmdMorphs = mmdMorphs;
        this._mmdMaterialMorphs = mmdMaterialMorphs;

        this._boneMmdMorphDependencyMap = boneMmdMorphDependencyMap;
        this._materialMmdMorphDependencyMap = materialMmdMorphDependencyMap;

        this._computeSet = computeList;
    }

    private addComputeMorphs(mmdMorph: MmdMorph<MorphType>): void {
        if (mmdMorph.type === MorphType.Bone) {
            const boneMorphs = (mmdMorph as MmdMorph<MorphType.Bone>).elements;
            for (let i = 0; i < boneMorphs.length; ++i) {
                const dependencyMmdMorphs = this._boneMmdMorphDependencyMap.get(boneMorphs[i].index)!;
                for (let j = 0; j < dependencyMmdMorphs.length; ++j) {
                    this._computeSet.add(dependencyMmdMorphs[j]);
                }
            }
        } else if (mmdMorph.type === MorphType.Material) {
            const materialMorphs = (mmdMorph as MmdMorph<MorphType.Material>).elements;
            for (let i = 0; i < materialMorphs.length; ++i) {
                const materialMorphIndex = materialMorphs[i].index;
                if (materialMorphIndex === -1) {
                    const mmdMaterialMorphs = this._mmdMaterialMorphs;
                    for (let j = 0; j < mmdMaterialMorphs.length; ++j) {
                        this._computeSet.add(mmdMaterialMorphs[j]);
                    }
                } else {
                    const dependencyMmdMorphs = this._materialMmdMorphDependencyMap.get(materialMorphs[i].index)!;
                    for (let j = 0; j < dependencyMmdMorphs.length; ++j) {
                        this._computeSet.add(dependencyMmdMorphs[j]);
                    }
                }
            }
        }
    }

    public setWeight(name: string, weight: number): void {
        const index = this.mmdMorphNameMap.get(name);
        if (index === undefined) return;

        const mmdMorph = this._mmdMorphs[index];
        mmdMorph.weight = weight;

        if (mmdMorph.type === MorphType.Group) {
            const groupMmdMorphs = mmdMorph as MmdMorph<MorphType.Group>;
            const groupMorphs = groupMmdMorphs.elements;
            for (let i = 0; i < groupMorphs.length; ++i) {
                const groupMorph = groupMorphs[i];
                this.addComputeMorphs(this._mmdMorphs[groupMorph.index]);
            }
        }

        this.addComputeMorphs(mmdMorph);
    }

    public getWeight(name: string): number {
        const index = this.mmdMorphNameMap.get(name);
        if (index === undefined) return 0;

        return this._mmdMorphs[index].weight;
    }

    public setWeightByIndex(index: number, weight: number): void {
        this._mmdMorphs[index].weight = weight;
    }

    public getWeightByIndex(index: number): number {
        return this._mmdMorphs[index].weight;
    }

    private readonly _computeBuffer: MmdMorph<MorphType.Bone | MorphType.Material>[] = [];
    private readonly _updateMorphControllers = new Set<MmdMaterialMorphController>();

    public apply(
        materialControllers: readonly MmdMaterialMorphController[]
    ): void {
        const computeBuffer = this._computeBuffer;
        for (const morph of this._computeSet) {
            computeBuffer.push(morph);
        }

        const morphNameMap = this.mmdMorphNameMap;
        computeBuffer.sort((a, b) => { // consider to use OrderedSet instead (use js-sdsl)
            return morphNameMap.get(a.name)! - morphNameMap.get(b.name)!;
        });

        const updateMorphControllers = this._updateMorphControllers;

        for (let i = 0; i < computeBuffer.length; ++i) {
            const morph = computeBuffer[i];
            if (morph.type === MorphType.Material) {
                const materialMmdMorph = morph as MmdMorph<MorphType.Material>;
                const materialMorphs = materialMmdMorph.elements;
                for (let i = 0; i < materialMorphs.length; ++i) {
                    const materialMorph = materialMorphs[i];
                    if (materialMorph.index === -1) {
                        for (let j = 0; j < materialControllers.length; ++j) {
                            updateMorphControllers.add(materialControllers[j]);
                        }
                        break;
                    }
                    const materialController = materialControllers[materialMorph.index];
                    updateMorphControllers.add(materialController);
                }
            }
        }

        for (const controller of updateMorphControllers) {
            controller.reset();
        }

        for (let i = 0; i < computeBuffer.length; ++i) {
            const morph = computeBuffer[i];
            if (morph.type === MorphType.Material) {
                const materialMmdMorph = morph as MmdMorph<MorphType.Material>;

                let weight = materialMmdMorph.weight;
                for (let j = 0; j < materialMmdMorph.connectedGroupMmdMorphs.length; ++j) {
                    const groupMorphData = materialMmdMorph.connectedGroupMmdMorphs[j];
                    weight *= groupMorphData.mmdMorph.weight * groupMorphData.morph.ratio;
                }

                const materialMorphs = materialMmdMorph.elements;
                for (let i = 0; i < materialMorphs.length; ++i) {
                    const materialMorph = materialMorphs[i];
                    if (materialMorph.index === -1) {
                        for (let j = 0; j < materialControllers.length; ++j) {
                            const materialController = materialControllers[j];
                            if (materialMorph.type === 0) { // multiply
                                materialController.multiplyWeightFromMorphData(materialMorph, weight);
                            } else if (materialMorph.type === 1) { // add
                                materialController.addWeightFromMorphData(materialMorph, weight);
                            }
                        }
                    } else {
                        const materialController = materialControllers[materialMorph.index];
                        if (materialMorph.type === 0) { // multiply
                            materialController.multiplyWeightFromMorphData(materialMorph, weight);
                        } else if (materialMorph.type === 1) { // add
                            materialController.addWeightFromMorphData(materialMorph, weight);
                        }
                    }
                }
            }
        }

        for (const controller of updateMorphControllers) {
            controller.apply();
        }

        updateMorphControllers.clear();
        computeBuffer.length = 0;
    }
}
