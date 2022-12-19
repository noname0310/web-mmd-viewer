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
    private _material: MmdMaterialLike;

    private _isExactMmdMaterial: boolean;
    private _diffuse?: THREE.Color;
    private _opacity: number;
    private _specular?: THREE.Color;
    private _shininess?: number;
    private _emissive?: THREE.Color;
    private _edgeColor?: [number, number, number, number];
    private _edgeSize?: number;

    public weightedDiffuse?: THREE.Color;
    public weightedOpacity: number;
    public weightedSpecular?: THREE.Color;
    public weightedShininess?: number;
    public weightedEmissive?: THREE.Color;
    public weightedEdgeColor?: [number, number, number, number];
    public weightedEdgeSize?: number;

    public constructor(material: MmdMaterialLike) {
        this._material = material;

        const isExactMMdMaterial = this._isExactMmdMaterial = MmdMaterialMorphController.isExactMmdMaterial(material);
        
        this._opacity = material.opacity;
        this.weightedOpacity = this._opacity;

        if (isExactMMdMaterial) {
            const diffuse = this._diffuse = new THREE.Color();
            diffuse.copy(material.diffuse!);

            const specular = this._specular = new THREE.Color();
            specular.copy(material.specular!);

            this._shininess = material.shininess ?? 0;

            const emissive = this._emissive = new THREE.Color();
            emissive.copy(material.emissive!);

            const edgeColor = this._edgeColor = [0, 0, 0, 0];
            this._edgeSize = 0;
            const outlineParameters = material.userData!.outlineParameters!;
            edgeColor[0] = outlineParameters.color[0];
            edgeColor[1] = outlineParameters.color[1];
            edgeColor[2] = outlineParameters.color[2];
            edgeColor[3] = outlineParameters.alpha;
            this._edgeSize = outlineParameters.thickness;

            this.weightedDiffuse = new THREE.Color().copy(diffuse);
            this.weightedSpecular = new THREE.Color().copy(specular);
            this.weightedShininess = this._shininess;
            this.weightedEmissive = new THREE.Color().copy(emissive);
            this.weightedEdgeColor = [...edgeColor];
            this.weightedEdgeSize = this._edgeSize;
        }
    }

    private static isExactMmdMaterial(material: MmdMaterialLike): boolean {
        return material.diffuse !== undefined &&
            material.specular !== undefined &&
            material.shininess !== undefined &&
            material.emissive !== undefined &&
            material.userData !== undefined &&
            material.userData.outlineParameters !== undefined;
    }

    public rebind(material: MmdMaterialLike): void {
        const lastIsExactMmdMaterial = this._isExactMmdMaterial;
        
        this._material = material;
        this._isExactMmdMaterial = MmdMaterialMorphController.isExactMmdMaterial(material);

        if (!lastIsExactMmdMaterial && this._isExactMmdMaterial) {
            this._diffuse = new THREE.Color();
            this._specular = new THREE.Color();
            this._shininess = 0;
            this._emissive = new THREE.Color();
            this._edgeColor = [0, 0, 0, 0];
            this._edgeSize = 0;

            this.weightedDiffuse = new THREE.Color();
            this.weightedSpecular = new THREE.Color();
            this.weightedShininess = 0;
            this.weightedEmissive = new THREE.Color();
            this.weightedEdgeColor = [0, 0, 0, 0];
            this.weightedEdgeSize = 0;
        }

        this._opacity = material.opacity;
        this.weightedOpacity = this._opacity;

        if (this._isExactMmdMaterial) {
            this._diffuse!.copy(material.diffuse!);
            this._specular!.copy(material.specular!);
            this._shininess = material.shininess ?? 0;
            this._emissive!.copy(material.emissive!);

            const outlineParameters = material.userData!.outlineParameters!;
            const edgeColor = this._edgeColor!;
            edgeColor[0] = outlineParameters.color[0];
            edgeColor[1] = outlineParameters.color[1];
            edgeColor[2] = outlineParameters.color[2];
            edgeColor[3] = outlineParameters.alpha;
            this._edgeSize = outlineParameters.thickness;
            
            this.weightedDiffuse!.copy(this._diffuse!);

            this.weightedSpecular!.copy(this._specular!);

            this.weightedShininess = this._shininess;

            this.weightedEmissive!.copy(this._emissive!);

            const weightedEdgeColor = this.weightedEdgeColor!;
            weightedEdgeColor[0] = edgeColor[0];
            weightedEdgeColor[1] = edgeColor[1];
            weightedEdgeColor[2] = edgeColor[2];
            weightedEdgeColor[3] = edgeColor[3];
            this.weightedEdgeSize = this._edgeSize;
        }
    }

    public addWeightFromMorphData(morph: MaterialMorph, weight: number): void {
        this.weightedOpacity += morph.diffuse[3] * weight;

        if (this._isExactMmdMaterial) {
            const weightedDiffuse = this.weightedDiffuse!;
            weightedDiffuse.r += morph.diffuse[0] * weight;
            weightedDiffuse.g += morph.diffuse[1] * weight;
            weightedDiffuse.b += morph.diffuse[2] * weight;

            const weightedSpecular = this.weightedSpecular!;
            weightedSpecular.r += morph.specular[0] * weight;
            weightedSpecular.g += morph.specular[1] * weight;
            weightedSpecular.b += morph.specular[2] * weight;

            this.weightedShininess! += morph.shininess * weight;

            const weightedEmissive = this.weightedEmissive!;
            weightedEmissive.r += morph.ambient[0] * weight;
            weightedEmissive.g += morph.ambient[1] * weight;
            weightedEmissive.b += morph.ambient[2] * weight;

            const weightedEdgeColor = this.weightedEdgeColor!;
            weightedEdgeColor[0] += morph.edgeColor[0] * weight;
            weightedEdgeColor[1] += morph.edgeColor[1] * weight;
            weightedEdgeColor[2] += morph.edgeColor[2] * weight;

            this.weightedEdgeSize! += morph.edgeSize / 300 * weight;
        }
    }

    public multiplyWeightFromMorphData(morph: MaterialMorph, weight: number): void {
        this.weightedOpacity *= morph.diffuse[3] * weight;

        if (this._isExactMmdMaterial) {
            const weightedDiffuse = this.weightedDiffuse!;
            weightedDiffuse.r *= morph.diffuse[0] * weight;
            weightedDiffuse.g *= morph.diffuse[1] * weight;
            weightedDiffuse.b *= morph.diffuse[2] * weight;

            const weightedSpecular = this.weightedSpecular!;
            weightedSpecular.r *= morph.specular[0] * weight;
            weightedSpecular.g *= morph.specular[1] * weight;
            weightedSpecular.b *= morph.specular[2] * weight;

            this.weightedShininess! *= morph.shininess * weight;

            const weightedEmissive = this.weightedEmissive!;
            weightedEmissive.r *= morph.ambient[0] * weight;
            weightedEmissive.g *= morph.ambient[1] * weight;
            weightedEmissive.b *= morph.ambient[2] * weight;

            const weightedEdgeColor = this.weightedEdgeColor!;
            weightedEdgeColor[0] *= morph.edgeColor[0] * weight;
            weightedEdgeColor[1] *= morph.edgeColor[1] * weight;
            weightedEdgeColor[2] *= morph.edgeColor[2] * weight;

            this.weightedEdgeSize! *= morph.edgeSize * weight;
        }
    }

    public reset(): void {
        this.weightedOpacity = this._opacity;

        if (this._isExactMmdMaterial) {
            this.weightedDiffuse!.copy(this._diffuse!);
            this.weightedSpecular!.copy(this._specular!);
            this.weightedShininess = this._shininess;
            this.weightedEmissive!.copy(this._emissive!);
            const edgeColor = this._edgeColor!;
            const weightedEdgeColor = this.weightedEdgeColor!;
            weightedEdgeColor[0] = edgeColor[0];
            weightedEdgeColor[1] = edgeColor[1];
            weightedEdgeColor[2] = edgeColor[2];
            weightedEdgeColor[3] = edgeColor[3];
            this.weightedEdgeSize = this._edgeSize;
        }
    }

    public apply(): void {
        const material = this._material;
        material.opacity = this.weightedOpacity;
        material.transparent = material.opacity < 1;
        if (this._isExactMmdMaterial) {
            material.diffuse!.copy(this.weightedDiffuse!);
            material.specular!.copy(this.weightedSpecular!);
            material.shininess = this.weightedShininess;
            material.emissive!.copy(this.weightedEmissive!);
            
            const outlineParameters = material.userData!.outlineParameters!;
            outlineParameters.thickness = this.weightedEdgeSize!;
            const outlineParametersColor = outlineParameters.color;
            const weightedEdgeColor = this.weightedEdgeColor!;
            outlineParametersColor[0] = weightedEdgeColor[0];
            outlineParametersColor[1] = weightedEdgeColor[1];
            outlineParametersColor[2] = weightedEdgeColor[2];
            outlineParameters.alpha = weightedEdgeColor[3];
            outlineParameters.visible = this.weightedEdgeSize! > 0;
        }
    }

    public get material(): MmdMaterialLike {
        return this._material;
    }
}
