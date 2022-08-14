import { SSRPass } from "three/examples/jsm/postprocessing/SSRPass";

export class SSRPassOverride extends SSRPass {
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
