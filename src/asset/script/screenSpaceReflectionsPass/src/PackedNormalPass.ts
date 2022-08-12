import { ShaderReplacement } from "../../shader-replacement/src/ShaderReplacement";
import { PackedShader } from "./PackedShader";

export class PackedNormalPass extends ShaderReplacement {
    public useNormalMaps: boolean;
    public useRoughnessMaps: boolean;
    public roughnessOverride: number|null;

    public constructor() {
        super(PackedShader);
        this.useNormalMaps = true;
        this.useRoughnessMaps = true;
        this.roughnessOverride = null;
    }

    public updateUniforms(object: THREE.Object3D, material: THREE.Material, target: THREE.ShaderMaterial): void {
        super.updateUniforms(object, material, target);

        if (this.roughnessOverride !== null) {
            target.uniforms.roughness.value = this.roughnessOverride;
        }

        (target as any).setDefine("USE_ROUGHNESSMAP", this.useRoughnessMaps && target.uniforms.roughnessMap.value ? "" : undefined);

        (target as any).setDefine("USE_NORMALMAP", this.useNormalMaps && target.uniforms.normalMap.value ? "" : undefined);
        (target as any).setDefine("TANGENTSPACE_NORMALMAP", this.useNormalMaps && target.uniforms.normalMap.value ? "" : undefined);

        (target as any).setDefine("ALPHATEST", target.uniforms.alphaTest.value === 0 ? undefined : target.uniforms.alphaTest.value);

        (target as any).setDefine("USE_ALPHAMAP", (!target.uniforms.alphaMap.value) ? undefined : "");

        (target as any).setDefine("USE_MAP", (!target.uniforms.map.value) ? undefined : "");

        (target as any).setDefine("USE_UV", ("USE_ALPHAMAP" in target.defines || "USE_MAP" in target.defines || "USE_NORMALMAP" in target.defines || "USE_ROUGHNESSMAP" in target.defines) ? "" : undefined);
    }
}
