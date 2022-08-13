import { ShaderLib } from "three/src/Three";

import { ShaderReplacement } from "../ShaderReplacement";

export class NormalPass extends ShaderReplacement {
    public useNormalMaps: boolean;

    public constructor() {
        super({
            extensions: {
                derivatives: true
            },
            defines: {
                // USE_NORMALMAP : '',
                // TANGENTSPACE_NORMALMAP : '',
                // eslint-disable-next-line @typescript-eslint/naming-convention
                USE_UV: ""
            },
            uniforms: {
                ...ShaderLib.normal.uniforms,
                alphaMap: { value: null },
                alphaTest: { value: 0 },
                map: { value: null },
                opacity: { value: 1.0 }
            },
            vertexShader: ShaderLib.normal.vertexShader,
            fragmentShader: /* glsl */`

				#define NORMAL
				uniform float opacity;
				#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( TANGENTSPACE_NORMALMAP )
					varying vec3 vViewPosition;
				#endif
				#ifndef FLAT_SHADED
					varying vec3 vNormal;
					#ifdef USE_TANGENT
						varying vec3 vTangent;
						varying vec3 vBitangent;
					#endif
				#endif
				#include <packing>
				#include <uv_pars_fragment>
				#include <map_pars_fragment>
				#include <bumpmap_pars_fragment>
				#include <normalmap_pars_fragment>
				#include <alphamap_pars_fragment>
				#include <logdepthbuf_pars_fragment>
				#include <clipping_planes_pars_fragment>
				void main() {
					vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
					#include <clipping_planes_fragment>
					#include <logdepthbuf_fragment>
					#include <map_fragment>
					#include <alphamap_fragment>
					#include <alphatest_fragment>
					#include <normal_fragment_begin>
					#include <normal_fragment_maps>
					gl_FragColor = vec4( packNormalToRGB( normal ), opacity );
				}
			`
        });

        this.useNormalMaps = false;
    }

    public createMaterial(object: THREE.Object3D): THREE.ShaderMaterial {
        const mat = super.createMaterial(object);

        return mat;
    }

    public updateUniforms(object: THREE.Object3D, material: THREE.Material, target: THREE.ShaderMaterial): void {

        super.updateUniforms(object, material, target);

        // TODO: Handle object space normal map
        // TODO: Handle displacement map

        (target as any).setDefine("USE_NORMALMAP", this.useNormalMaps && target.uniforms.normalMap.value ? "" : undefined);
        (target as any).setDefine("TANGENTSPACE_NORMALMAP", this.useNormalMaps && target.uniforms.normalMap.value ? "" : undefined);

        (target as any).setDefine("ALPHATEST", target.uniforms.alphaTest.value ? target.uniforms.alphaTest.value : undefined);

        (target as any).setDefine("USE_ALPHAMAP", (target.defines.ALPHATEST === 0 || !target.uniforms.alphaMap.value) ? undefined : "");

        (target as any).setDefine("USE_MAP", (target.defines.ALPHATEST === 0 || !target.uniforms.map.value) ? undefined : "");

        (target as any).setDefine("USE_UV", ("USE_ALPHAMAP" in target.defines || "USE_MAP" in target.defines) ? "" : undefined);

    }

}
