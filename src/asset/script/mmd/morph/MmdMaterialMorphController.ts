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

import * as THREE from "three/src/Three";
import { MmdMaterialLike } from "../MmdMaterial";

export class MmdMaterialMorphController {
    public readonly material: MmdMaterialLike;

    private readonly _isExactMmdMaterial: boolean;
    private readonly _diffuse: THREE.Color;
    private _opacity: number;
    private readonly _specular: THREE.Color;
    private _shininess: number;
    private readonly _emissive: THREE.Color;
    private readonly _edgeColor: THREE.Color;
    private _edgeSize: number;

    public readonly weightedDiffuse: THREE.Color;
    public weightedOpacity: number;
    public readonly weightedSpecular: THREE.Color;
    public weightedShininess: number;
    public readonly weightedEmissive: THREE.Color;
    public readonly weightedEdgeColor: THREE.Color;
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
        
        const edgeColor = this._edgeColor = new THREE.Color();
        this._edgeSize = 0;
        if (material.userData !== undefined && material.userData.outlineParameters !== undefined) {
            const outlineParameters = material.userData.outlineParameters;
            edgeColor.fromArray(outlineParameters.color);
            this._edgeSize = outlineParameters.thickness;
        }

        this.weightedDiffuse = new THREE.Color().copy(diffuse);
        this.weightedOpacity = this._opacity;
        this.weightedSpecular = new THREE.Color().copy(specular);
        this.weightedShininess = this._shininess;
        this.weightedEmissive = new THREE.Color().copy(emissive);
        this.weightedEdgeColor = new THREE.Color().copy(edgeColor);
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

    public reset(): void {
        this.weightedDiffuse.copy(this._diffuse);
        this.weightedOpacity = this._opacity;
        this.weightedSpecular.copy(this._specular);
        this.weightedShininess = this._shininess;
        this.weightedEmissive.copy(this._emissive);
        this.weightedEdgeColor.copy(this._edgeColor);
        this.weightedEdgeSize = this._edgeSize;
    }

    public apply(): void {
        const material = this.material;
        material.diffuse = this.weightedDiffuse;
        material.opacity = this.weightedOpacity;
        material.specular = this.weightedSpecular;
        material.shininess = this.weightedShininess;
        material.emissive = this.weightedEmissive;
        if (this._isExactMmdMaterial) {
            const outlineParameters = material.userData!.outlineParameters!;
            const outlineParametersColor = outlineParameters.color;
            const weightedEdgeColor = this.weightedEdgeColor;
            outlineParametersColor[0] = weightedEdgeColor.r;
            outlineParametersColor[1] = weightedEdgeColor.g;
            outlineParametersColor[2] = weightedEdgeColor.b;
            outlineParameters.thickness = this.weightedEdgeSize;
        }
    }
}
