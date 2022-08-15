import { SSRPass, SSRPassParams } from "three/examples/jsm/postprocessing/SSRPass";
import * as THREE from "three/src/Three";

export class SSRPassOverride extends SSRPass {
    public constructor(params: SSRPassParams) {
        super(params);

        const beautyRenderTarget = this.beautyRenderTarget;
        beautyRenderTarget.depthTexture.dispose();
        beautyRenderTarget.depthTexture = new THREE.DepthTexture(screen.width, screen.height);
        beautyRenderTarget.depthTexture.type = THREE.FloatType;
        beautyRenderTarget.depthTexture.minFilter = THREE.NearestFilter;
        beautyRenderTarget.depthTexture.magFilter = THREE.NearestFilter;
        this.ssrMaterial.uniforms["tDepth"].value = beautyRenderTarget.depthTexture;
        this.depthRenderMaterial.uniforms["tDepth"].value = beautyRenderTarget.depthTexture;
    }

    public override render(
        renderer: THREE.WebGLRenderer,
        writeBuffer: THREE.WebGLRenderTarget,
        readBuffer: THREE.WebGLRenderTarget,
        deltaTime: number,
        maskActive: boolean
    ): void {
        this.ssrMaterial.uniforms["cameraProjectionMatrix"].value.copy(this.camera.projectionMatrix);
        this.ssrMaterial.uniforms["cameraInverseProjectionMatrix"].value.copy(this.camera.projectionMatrixInverse);

        super.render(renderer, writeBuffer, readBuffer, deltaTime, maskActive);
    }
}
