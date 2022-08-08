import { FullScreenQuad, Pass } from "three/examples/jsm/postprocessing/Pass";
import { /*BokehDepthShader,*/ BokehShader } from "three/examples/jsm/shaders/BokehShader2";
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

export class BokehPass2 extends Pass {
    public scene: THREE.Scene;
    public camera: NearFarCamera;
    public renderTargetDepth: THREE.WebGLRenderTarget;
    public materialDepth: THREE.ShaderMaterial;
    public materialBokeh: THREE.ShaderMaterial;
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

        // bokeh material

        /*
        focalDepth: Uniform;
        focalLength: Uniform;
        fstop: Uniform;
        maxblur: Uniform;
        showFocus: Uniform;
        manualdof: Uniform;
        vignetting: Uniform;
        depthblur: Uniform;
        threshold: Uniform;
        gain: Uniform;
        bias: Uniform;
        fringe: Uniform;
        noise: Uniform;
        dithering: Uniform;
        pentagon: Uniform;
        shaderFocus: Uniform;
        focusCoords: Uniform;
        */
        
        const bokehShader = BokehShader;
        const bokehUniforms = UniformsUtils.clone(bokehShader.uniforms) as typeof bokehShader.uniforms;

        bokehUniforms["tDepth"].value = this.renderTargetDepth.texture;

        this.materialBokeh = new THREE.ShaderMaterial({
            uniforms: bokehUniforms as any,
            vertexShader: bokehShader.vertexShader,
            fragmentShader: bokehShader.fragmentShader,
            defines: {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                RINGS: params.rings || 3,
                // eslint-disable-next-line @typescript-eslint/naming-convention
                SAMPLES: params.samples || 4
            }
        });

        this.needsSwap = false;

        this.fsQuad = new FullScreenQuad(this.materialBokeh);

        this._oldClearColor = new THREE.Color();
    }

    public updateDefines(params: { rings?: number; samples?: number }): void {
        if (params.rings) this.materialBokeh.defines.RINGS = params.rings;
        if (params.samples) this.materialBokeh.defines.SAMPLES = params.samples;
        this.materialBokeh.needsUpdate = true;
    }

    public override render(
        renderer: THREE.WebGLRenderer,
        writeBuffer: THREE.WebGLRenderTarget,
        readBuffer: THREE.WebGLRenderTarget
    ): void {
        // Render depth into texture

        const depthUniforms = this.materialDepth.uniforms as typeof BokehDepthShader.uniforms;
        
        const camera = this.camera;
        depthUniforms["mNear"].value = camera.near;
        depthUniforms["mFar"].value = camera.far;

        this.scene.overrideMaterial = this.materialDepth;
        
        renderer.getClearColor( this._oldClearColor );
        const oldClearAlpha = renderer.getClearAlpha();
        const oldAutoClear = renderer.autoClear;
        renderer.autoClear = false;
        
        renderer.setClearColor(0xffffff);
        renderer.setClearAlpha(1.0);
        renderer.setRenderTarget(this.renderTargetDepth);
        renderer.clear();
        renderer.render(this.scene, this.camera);

        // Render bokeh composite

        const bokehUniforms = this.materialBokeh.uniforms as unknown as typeof BokehShader.uniforms;

        bokehUniforms["znear"].value = camera.near;
        bokehUniforms["zfar"].value = camera.far;
        bokehUniforms["tColor"].value = readBuffer.texture;
        bokehUniforms["textureWidth"].value = readBuffer.width;
        bokehUniforms["textureHeight"].value = readBuffer.height;

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
