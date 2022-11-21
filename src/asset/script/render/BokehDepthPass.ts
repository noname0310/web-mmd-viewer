import { FullScreenQuad, Pass } from "three/examples/jsm/postprocessing/Pass";
import * as THREE from "three/src/Three";
import { UniformsUtils } from "three/src/Three";

type NearFarCamera = THREE.Camera & {
    near: number;
    far: number;
};

export type BokehPass2Params = {
    width?: number;
    height?: number;
    rings?: number;
    samples?: number;
};

// eslint-disable-next-line @typescript-eslint/naming-convention
const BokehDepthShader = {
    uniforms: {
        "mNear": { value: 1.0 },
        "mFar": { value: 1000.0 }
    },

    vertexShader: /* glsl */`
		varying float vViewZDepth;

		void main() {

			#include <begin_vertex>
			#include <project_vertex>

			vViewZDepth = - mvPosition.z;

		}`,

    fragmentShader: /* glsl */`
		uniform float mNear;
		uniform float mFar;

		varying float vViewZDepth;

		void main() {

			float color = 1.0 - smoothstep( mNear, mFar, vViewZDepth );
			gl_FragColor = vec4( vec3( color ), 1.0 );

		}`
};

export class BokehDepthPass extends Pass {
    public scene: THREE.Scene;
    public camera: NearFarCamera;
    public renderTargetDepth: THREE.WebGLRenderTarget;
    public materialDepth: THREE.ShaderMaterial;
    public fsQuad: FullScreenQuad;
    private readonly _oldClearColor: THREE.Color;

    public constructor(scene: THREE.Scene, camera: THREE.Camera, params: BokehPass2Params) {
        super();

        this.scene = scene;
        this.camera = camera as NearFarCamera;

        // render targets

        const width = params.width || window.innerWidth || 1;
        const height = params.height || window.innerHeight || 1;

        this.renderTargetDepth = new THREE.WebGLRenderTarget(width, height);

        this.renderTargetDepth.texture.name = "BokehPass.depth";

        // depth material

        const depthShader = BokehDepthShader;
        const depthUniforms = UniformsUtils.clone(depthShader.uniforms) as typeof depthShader.uniforms;

        this.materialDepth = new THREE.ShaderMaterial({
            uniforms: depthUniforms,
            vertexShader: depthShader.vertexShader,
            fragmentShader: depthShader.fragmentShader
        });

        this.needsSwap = false;

        this.fsQuad = new FullScreenQuad(this.materialDepth);

        this._oldClearColor = new THREE.Color();
    }
    public override render(
        renderer: THREE.WebGLRenderer,
        writeBuffer: THREE.WebGLRenderTarget
    ): void {
        // Render depth into texture

        const depthUniforms = this.materialDepth.uniforms as typeof BokehDepthShader.uniforms;

        const camera = this.camera;
        depthUniforms["mNear"].value = camera.near;
        depthUniforms["mFar"].value = camera.far;

        this.scene.overrideMaterial = this.materialDepth;

        renderer.getClearColor(this._oldClearColor);
        const oldClearAlpha = renderer.getClearAlpha();
        const oldAutoClear = renderer.autoClear;
        renderer.autoClear = false;

        renderer.setClearColor(0xffffff);
        renderer.setClearAlpha(1.0);
        renderer.setRenderTarget(this.renderTargetDepth);
        renderer.clear();
        renderer.render(this.scene, this.camera);

        if (this.renderToScreen) {
            renderer.setRenderTarget(null);
            this.fsQuad.render(renderer);
        } else {
            renderer.setRenderTarget(writeBuffer);
            renderer.clear();
            this.fsQuad.render(renderer);
        }

        this.scene.overrideMaterial = null;
        renderer.setClearColor(this._oldClearColor);
        renderer.setClearAlpha(oldClearAlpha);
        renderer.autoClear = oldAutoClear;
    }
}
