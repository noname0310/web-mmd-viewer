// MMD material morph params to three.js material table

// diffuse -> diffuse, opacity
// specular -> specular
// shininess -> shininess
// ambient -> emissive
// edgeColor -> userData.outlineParameters.color, userData.outlineParameters.alpha, userData.outlineParameters.visible
// edgeSize -> userData.outlineParameters.thickness, userData.outlineParameters.visible
// textureColor -> ???
// textureColor alpha -> ???
// sphereTextureColor -> ???

import { MaterialMorph } from "@noname0310/mmd-parser";
import * as THREE from "three/src/Three";

import { MmdMaterialLike } from "../MmdMaterial";

export class MmdMaterialMorphController {
    public readonly material: MmdMaterialLike;

    private readonly _isExactMmdMaterial: boolean;
    private readonly _diffuse: THREE.Color;
    private readonly _opacity: number;
    private readonly _specular: THREE.Color;
    private readonly _shininess: number;
    private readonly _emissive: THREE.Color;
    private readonly _edgeColor: [number, number, number, number];
    private readonly _edgeSize: number;

    public readonly weightedDiffuse: THREE.Color;
    public weightedOpacity: number;
    public readonly weightedSpecular: THREE.Color;
    public weightedShininess: number;
    public readonly weightedEmissive: THREE.Color;
    public readonly weightedEdgeColor: [number, number, number, number];
    public weightedEdgeSize: number;

    public constructor(material: MmdMaterialLike) {
        this.material = material;

        this._isExactMmdMaterial = MmdMaterialMorphController.isExactMmdMaterial(material);

        const diffuse = this._diffuse = new THREE.Color();
        if (material.diffuse !== undefined) diffuse.copy(material.diffuse);

        this._opacity = material.opacity;

        const specular = this._specular = new THREE.Color();
        if (material.specular !== undefined) specular.copy(material.specular);

        this._shininess = material.shininess ?? 0;

        const emissive = this._emissive = new THREE.Color();
        if (material.emissive !== undefined) emissive.copy(material.emissive);

        const edgeColor = this._edgeColor = [0, 0, 0, 0];
        this._edgeSize = 0;
        if (material.userData !== undefined && material.userData.outlineParameters !== undefined) {
            const outlineParameters = material.userData.outlineParameters;
            edgeColor[0] = outlineParameters.color[0];
            edgeColor[1] = outlineParameters.color[1];
            edgeColor[2] = outlineParameters.color[2];
            edgeColor[3] = outlineParameters.alpha;
            this._edgeSize = outlineParameters.thickness;
        }

        this.weightedDiffuse = new THREE.Color().copy(diffuse);
        this.weightedOpacity = this._opacity;
        this.weightedSpecular = new THREE.Color().copy(specular);
        this.weightedShininess = this._shininess;
        this.weightedEmissive = new THREE.Color().copy(emissive);
        this.weightedEdgeColor = [...edgeColor];
        this.weightedEdgeSize = this._edgeSize;
    }

    private static isExactMmdMaterial(material: MmdMaterialLike): boolean {
        return material.diffuse !== undefined &&
            material.specular !== undefined &&
            material.shininess !== undefined &&
            material.emissive !== undefined &&
            material.userData !== undefined &&
            material.userData.outlineParameters !== undefined;
    }

    public addWeightFromMorphData(morph: MaterialMorph): void {
        const weightedDiffuse = this.weightedDiffuse;
        weightedDiffuse.r += morph.diffuse[0];
        weightedDiffuse.g += morph.diffuse[1];
        weightedDiffuse.b += morph.diffuse[2];
        this.weightedOpacity += morph.diffuse[3];

        const weightedSpecular = this.weightedSpecular;
        weightedSpecular.r += morph.specular[0];
        weightedSpecular.g += morph.specular[1];
        weightedSpecular.b += morph.specular[2];

        this.weightedShininess += morph.shininess;

        const weightedEmissive = this.weightedEmissive;
        weightedEmissive.r += morph.ambient[0];
        weightedEmissive.g += morph.ambient[1];
        weightedEmissive.b += morph.ambient[2];

        const weightedEdgeColor = this.weightedEdgeColor;
        weightedEdgeColor[0] += morph.edgeColor[0];
        weightedEdgeColor[1] += morph.edgeColor[1];
        weightedEdgeColor[2] += morph.edgeColor[2];

        this.weightedEdgeSize += morph.edgeSize / 300;
    }

    public multiplyWeightFromMorphData(morph: MaterialMorph): void {
        const weightedDiffuse = this.weightedDiffuse;
        weightedDiffuse.r *= morph.diffuse[0];
        weightedDiffuse.g *= morph.diffuse[1];
        weightedDiffuse.b *= morph.diffuse[2];
        this.weightedOpacity *= morph.diffuse[3];

        const weightedSpecular = this.weightedSpecular;
        weightedSpecular.r *= morph.specular[0];
        weightedSpecular.g *= morph.specular[1];
        weightedSpecular.b *= morph.specular[2];

        this.weightedShininess *= morph.shininess;

        const weightedEmissive = this.weightedEmissive;
        weightedEmissive.r *= morph.ambient[0];
        weightedEmissive.g *= morph.ambient[1];
        weightedEmissive.b *= morph.ambient[2];

        const weightedEdgeColor = this.weightedEdgeColor;
        weightedEdgeColor[0] *= morph.edgeColor[0];
        weightedEdgeColor[1] *= morph.edgeColor[1];
        weightedEdgeColor[2] *= morph.edgeColor[2];

        this.weightedEdgeSize *= morph.edgeSize;
    }

    public reset(): void {
        this.weightedDiffuse.copy(this._diffuse);
        this.weightedOpacity = this._opacity;
        this.weightedSpecular.copy(this._specular);
        this.weightedShininess = this._shininess;
        this.weightedEmissive.copy(this._emissive);
        const edgeColor = this._edgeColor;
        const weightedEdgeColor = this.weightedEdgeColor;
        weightedEdgeColor[0] = edgeColor[0];
        weightedEdgeColor[1] = edgeColor[1];
        weightedEdgeColor[2] = edgeColor[2];
        weightedEdgeColor[3] = edgeColor[3];
        this.weightedEdgeSize = this._edgeSize;
    }

    public apply(): void {
        const material = this.material;
        material.opacity = this.weightedOpacity;
        material.transparent = material.opacity < 1;
        if (this._isExactMmdMaterial) {
            material.diffuse = this.weightedDiffuse;
            material.specular = this.weightedSpecular;
            material.shininess = this.weightedShininess;
            material.emissive = this.weightedEmissive;

            const outlineParameters = material.userData!.outlineParameters!;
            outlineParameters.thickness = this.weightedEdgeSize;
            const outlineParametersColor = outlineParameters.color;
            const weightedEdgeColor = this.weightedEdgeColor;
            outlineParametersColor[0] = weightedEdgeColor[0];
            outlineParametersColor[1] = weightedEdgeColor[1];
            outlineParametersColor[2] = weightedEdgeColor[2];
            outlineParameters.alpha = weightedEdgeColor[3];
            outlineParameters.visible = this.weightedEdgeSize > 0;
        }
    }
}
