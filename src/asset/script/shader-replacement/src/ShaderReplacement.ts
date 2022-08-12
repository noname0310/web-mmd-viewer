import { WrappedShaderMaterial } from "./WrappedShaderMaterial";

export function setMaterialDefine(material: THREE.Material, define: any, value: any): void {
    if (value === undefined) {
        if (define in material.defines!) {
            delete material.defines![define];
            material.needsUpdate = true;
        }
    } else {
        if (value !== material.defines![define]) {
            material.defines![define] = value;
            material.needsUpdate = true;
        }
    }
}

// eslint-disable-next-line @typescript-eslint/naming-convention
const _originalMaterials = new WeakMap();
export class ShaderReplacement {
    private readonly _replacementMaterial: THREE.ShaderMaterial;
    private readonly _replacementMaterials: WeakMap<THREE.Object3D, THREE.ShaderMaterial>;

    public overrideUniforms: { [key: string]: any };
    public overrideDefines: { [key: string]: any };

    public constructor(shader: any) {
        this._replacementMaterial = new WrappedShaderMaterial(shader);
        this._replacementMaterials = new WeakMap();

        this.overrideUniforms = {};
        this.overrideDefines = {};
    }

    public replace(scene: THREE.Scene, recursive = false, cacheCurrentMaterial = true): void {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const scope = this;
        function applyMaterial(object: THREE.Object3D): void {

            if (!(object as THREE.Mesh).isMesh && !(object as THREE.SkinnedMesh).isSkinnedMesh) {
                return;
            }

            if (!replacementMaterials.has(object)) {
                const replacementMaterial = scope.createMaterial(object);
                replacementMaterials.set(object, replacementMaterial);
            }

            const replacementMaterial = replacementMaterials.get(object);
            if (!replacementMaterial) {
                return;
            }

            let originalMaterial = (object as THREE.Mesh).material as THREE.Material;
            if (cacheCurrentMaterial) {
                originalMaterials.set(object, originalMaterial);
            } else {
                originalMaterial = originalMaterials.get(object);
            }

            if (!originalMaterial) {
                console.error("ShaderReplacement : Material for object was not cached before replacing shader.", object);
            }

            scope.updateUniforms(object, originalMaterial, replacementMaterial);
            if ((replacementMaterial as any).finalize) {
                (replacementMaterial as any).finalize();
            }

            (object as THREE.Mesh).material = replacementMaterial;
        }

        const replacementMaterials = this._replacementMaterials;
        const originalMaterials = _originalMaterials;
        if (Array.isArray(scene)) {
            if (recursive) {
                for (let i = 0, l = scene.length; i < l; i++) {
                    scene[i].traverse(applyMaterial);
                }
            } else {
                for (let i = 0, l = scene.length; i < l; i++) {
                    applyMaterial(scene[i]);
                }
            }
        } else {
            if (recursive) {
                scene.traverse(applyMaterial);
            } else {
                applyMaterial(scene);
            }
        }
    }

    public reset(scene: THREE.Object3D|THREE.Object3D[], recursive: boolean): void {
        function resetMaterial(object: THREE.Object3D): void {
            if (originalMaterials.has(object)) {
                (object as THREE.Mesh).material = originalMaterials.get(object);
                originalMaterials.delete(object);
            } else if ((object as THREE.SkinnedMesh).isSkinnedMesh || (object as THREE.Mesh).isMesh) {
                console.error("ShaderReplacement : Material for object was not cached before resetting.", object);
            }
        }

        const originalMaterials = _originalMaterials;
        if (Array.isArray(scene)) {
            if (recursive) {
                for (let i = 0, l = scene.length; i < l; i++) {
                    resetMaterial(scene[i]);
                }
            } else {
                for (let i = 0, l = scene.length; i < l; i++) {
                    scene[i].traverse(resetMaterial);
                }
            }
        } else {
            if (recursive) {
                scene.traverse(resetMaterial);
            } else {
                resetMaterial(scene);
            }
        }
    }

    public createMaterial(_object: THREE.Object3D): THREE.ShaderMaterial {
        return this._replacementMaterial.clone();
    }

    public updateUniforms(_object: THREE.Object3D, material: THREE.Material, target: THREE.ShaderMaterial): void {
        const replacementMaterial = this._replacementMaterial;
        const originalDefines = replacementMaterial.defines;
        const materialDefines = material.defines;
        const targetDefines = target.defines;

        target.side = material.side;
        (target as any).flatShading = (material as any).flatShading;
        (target as any).skinning = (material as any).skinning;

        if (materialDefines) {
            for (const key in materialDefines) {
                (target as any).setDefine(key, materialDefines[key]);
            }

            for (const key in targetDefines) {
                if (!(key in materialDefines)) {
                    (target as any).setDefine(key, originalDefines![key]);
                } else {
                    (target as any).setDefine(key, materialDefines[key]);
                }
            }
        }

        // NOTE: we shouldn't have to worry about using copy / equals on colors, vectors, or arrays here
        // because we promise not to change the values.
        const targetUniforms = target.uniforms;
        if ((material as THREE.ShaderMaterial).isShaderMaterial) {
            const materialUniforms = (material as THREE.ShaderMaterial).uniforms;
            for (const key in targetUniforms) {

                const materialUniform = materialUniforms[key];
                const targetUniform = targetUniforms[key];
                if (materialUniform && materialUniform.value !== targetUniform.value) {
                    if (
                        targetUniform.value && targetUniform.value.isTexture ||
                        materialUniform.value && materialUniform.value.isTexture
                    ) {
                        (target as any).setTextureUniform(key, materialUniform.value);
                    } else {
                        targetUniform.value = materialUniform.value;
                    }
                }
            }
        } else {
            for (const key in targetUniforms) {
                const targetUniform = targetUniforms[key];
                if (key in material && (material as any)[key] !== targetUniform.value) {
                    if (
                        targetUniform.value && targetUniform.value.isTexture ||
                        (material as any)[key] && (material as any)[key].isTexture
                    ) {
                        (target as any).setTextureUniform(key, (material as any)[key]);
                    } else {
                        targetUniform.value = (material as any)[key];
                    }
                }
            }
        }

        const { overrideDefines, overrideUniforms } = this;
        for (const key in overrideDefines) {
            if (overrideDefines[key] === null || overrideDefines[key] === undefined) {
                delete targetDefines[key];
            } else {
                if (targetDefines[key] !== overrideDefines[key]) {
                    targetDefines[key] = overrideDefines[key];
                    target.needsUpdate = true;
                }
            }
        }

        for (const key in overrideUniforms) {
            if (key in targetUniforms) {
                targetUniforms[key].value = overrideUniforms[key].value;
            }
        }
    }

    public dispose(): void {
        // TODO: disposal needed?
    }
}
