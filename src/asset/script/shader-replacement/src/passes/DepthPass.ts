import { BasicDepthPacking, ShaderLib } from "three/src/Three";

import { ShaderReplacement } from "../ShaderReplacement";

export class DepthPass extends ShaderReplacement {
	public constructor() {
		super({
			defines: {
				DEPTH_PACKING: BasicDepthPacking
			},
			uniforms: {
				...ShaderLib.depth.uniforms,
				alphaMap: { value: null },
				alphaTest: { value: 0 },
				map: { value: null },
				opacity: { value: 1.0 }
			},
			vertexShader: ShaderLib.depth.vertexShader,
			fragmentShader: ShaderLib.depth.fragmentShader
		});
	}

	public updateUniforms(object: THREE.Object3D, material: THREE.Material, target: THREE.ShaderMaterial): void {
		super.updateUniforms(object, material, target);

		// TODO: Handle displacement map
		// TODO: support packing

		(target as any).setDefine("USE_UV", "");

		(target as any).setDefine("ALPHATEST", target.uniforms.alphaTest.value ? target.uniforms.alphaTest.value : undefined);

		(target as any).setDefine("USE_ALPHAMAP", (target.defines.ALPHATEST === 0 || !target.uniforms.alphaMap.value) ? undefined : "");

		(target as any).setDefine("USE_MAP", (target.defines.ALPHATEST === 0 || !target.uniforms.map.value) ? undefined : "");
	}
}
