import { FullScreenQuad } from "three/examples/jsm/postprocessing/Pass";
import { Pass } from "three/examples/jsm/postprocessing/Pass";
import * as THREE from "three/src/Three";

export class PostProcessDisposer {
    public static disposePass(pass: Pass): void {
        if ((pass as any).dispose) {
            (pass as any).dispose();
            return;
        }

        const keys = Object.keys(pass);
        for (let i = 0; i < keys.length; ++i) {
            const key = keys[i];
            const prop = (pass as any)[key];

            const isDisposable = (
                prop instanceof THREE.WebGLRenderTarget ||
                prop instanceof THREE.Material ||
                prop instanceof THREE.Texture ||
                prop instanceof THREE.BufferGeometry ||
                prop instanceof FullScreenQuad 
            );

            if (isDisposable) prop.dispose();

            if (prop instanceof Array) {
                for (let j = 0; j < prop.length; ++j) {
                    const item = prop[j];
                    
                    const isDisposable = (
                        item instanceof THREE.WebGLRenderTarget ||
                        item instanceof THREE.Material ||
                        item instanceof THREE.Texture ||
                        item instanceof THREE.BufferGeometry ||
                        item instanceof FullScreenQuad
                    );

                    if (isDisposable) item.dispose();
                }
            }
        }
    }
}
