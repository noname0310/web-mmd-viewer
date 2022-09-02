import { FloatType, RGBAFormat } from "three/src/Three";
import { DataTexture } from "three/src/Three";
import { Matrix4 } from "three/src/Three";

import { ShaderReplacement } from "../ShaderReplacement";
import { VelocityShader } from "./VelocityShader";
export class VelocityPass extends ShaderReplacement {
    public initialized: boolean;
    public includeCameraVelocity: boolean;
    public includeObjectVelocity: boolean;
    public prevProjectionMatrix: Matrix4;
    public prevViewMatrix: Matrix4;
    public prevInfo: Map<THREE.SkinnedMesh, any>;
    public lastFrame: number;
    public autoUpdate: boolean;
    public camera: THREE.Camera;

    public constructor(camera: THREE.Camera) {
        super(VelocityShader);

        this.initialized = false;
        this.includeCameraVelocity = true;
        this.includeObjectVelocity = true;
        this.prevProjectionMatrix = new Matrix4();
        this.prevViewMatrix = new Matrix4();
        this.prevInfo = new Map();
        this.lastFrame = 0;
        this.autoUpdate = true;
        this.camera = camera;
    }

    public replace(scene: THREE.Scene, recursive?: boolean, cacheCurrentMaterial?: boolean): void {
        // NOTE: As it is this can only really be used for one scene because of how this frame
        // index works. Instead we'll need a different frame id per scene.
        this.lastFrame++;

        if (!this.initialized || !this.includeCameraVelocity) {
            const camera = this.camera;
            this.prevProjectionMatrix.copy(camera.projectionMatrix);
            this.prevViewMatrix.copy(camera.matrixWorldInverse);
            this.initialized = true;
        }

        super.replace(scene, recursive, cacheCurrentMaterial);
    }

    public reset(scene: THREE.Object3D | THREE.Object3D[], recursive: boolean): void {
        super.reset(scene, recursive);

        // NOTE: We expect that the camera and object transforms are all up to date here so we can cache them for the next frame.
        if (this.autoUpdate) {
            this.updateTransforms();
        }
    }

    public updateTransforms(): void {
        const camera = this.camera;
        this.prevProjectionMatrix.copy(camera.projectionMatrix);
        this.prevViewMatrix.copy(camera.matrixWorldInverse);

        const lastFrame = this.lastFrame;
        const prevInfo = this.prevInfo;
        prevInfo.forEach((info, object) => {
            if (info.lastFrame !== lastFrame) {
                if (info.boneTexture) {
                    info.boneTexture.dispose();
                }
                prevInfo.delete(object);
            } else {
                info.modelViewMatrix.multiplyMatrices(this.prevViewMatrix, object.matrixWorld);

                if (info.boneMatrices) {
                    info.boneMatrices.set(object.skeleton.boneMatrices);
                    info.boneTexture.needsUpdate = true;
                }
            }
        });
    }

    public updateUniforms(object: THREE.Object3D, material: THREE.Material, target: THREE.ShaderMaterial): void {
        super.updateUniforms(object, material, target);

        // TODO: Handle alpha clip
        // TODO: Handle displacement map

        const prevInfo = this.prevInfo;
        let info;
        if (!prevInfo.has(object as THREE.SkinnedMesh)) {
            info = {
                lastFrame: this.lastFrame,
                modelViewMatrix: new Matrix4().multiplyMatrices(this.prevViewMatrix, object.matrixWorld),
                boneMatrices: null,
                boneTexture: null
            };
            prevInfo.set(object as THREE.SkinnedMesh, info);
        } else {
            info = prevInfo.get(object as THREE.SkinnedMesh);
        }

        if ((material as any).skinned) {
            const skeleton = (object as THREE.SkinnedMesh).skeleton;
            const boneTextureNeedsUpdate = info.boneMatrices === null || info.boneMatrices.length !== skeleton.boneMatrices.length;
            if (/*isSkinned && */boneTextureNeedsUpdate) {
                const boneMatrices = new Float32Array(skeleton.boneMatrices.length);
                boneMatrices.set(skeleton.boneMatrices);
                info.boneMatrices = boneMatrices;

                const size = Math.sqrt(skeleton.boneMatrices.length / 4);
                const boneTexture = new DataTexture(boneMatrices, size, size, RGBAFormat, FloatType);
                boneTexture.needsUpdate = true;

                target.uniforms.prevBoneTexture.value = boneTexture;
                info.boneTexture = boneTexture;
            }
        }

        info.lastFrame = this.lastFrame;
        target.uniforms.prevProjectionMatrix.value.copy(this.prevProjectionMatrix);
        target.uniforms.prevModelViewMatrix.value.copy(info.modelViewMatrix);
    }

    public dispose(): void {
        this.initialized = false;

        const prevInfo = this.prevInfo;
        prevInfo.forEach((info, object) => {
            if (info.boneTexture) {
                info.boneTexture.dispose();
            }
            prevInfo.delete(object);
        });
    }
}
